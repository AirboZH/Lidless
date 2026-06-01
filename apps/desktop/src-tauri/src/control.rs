//! Local control channel: a tiny HTTP server bound to `127.0.0.1` only, used by
//! the agent hook (via the CLI client, see `cli.rs`) to drive keep-awake.
//!
//! Design:
//! - Bind an ephemeral port (`127.0.0.1:0`), generate a random token, and write
//!   the port + token to `~/.lidless/endpoint.json`; the CLI client reads it to
//!   connect and authenticate.
//! - Only accept requests carrying `Authorization: Bearer <token>`, blocking
//!   other local processes / web pages.
//! - Routes call straight through to the lease / switch methods on `Manager`;
//!   the monitor thread funnels them into the actual OS calls.

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use serde::Deserialize;
use serde_json::json;

use crate::manager::Manager;

/// The user's home directory. Uses `USERPROFILE` on Windows, `HOME` elsewhere.
pub fn home_dir() -> Option<PathBuf> {
    let var = if cfg!(target_os = "windows") {
        "USERPROFILE"
    } else {
        "HOME"
    };
    std::env::var_os(var).map(PathBuf::from)
}

/// The `~/.lidless` directory.
pub fn lidless_dir() -> Option<PathBuf> {
    home_dir().map(|mut p| {
        p.push(".lidless");
        p
    })
}

/// The `~/.lidless/endpoint.json` path.
pub fn endpoint_path() -> Option<PathBuf> {
    lidless_dir().map(|mut p| {
        p.push("endpoint.json");
        p
    })
}

/// Token generation without third-party crates: mix high-resolution time /
/// process id / a stack address, then diffuse with splitmix64 into 64 hex
/// chars. It only needs to keep out non-cooperating local processes; the
/// threat model is very low (worst case is keep-awake being toggled by mistake).
fn gen_token() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0);
    let pid = std::process::id() as u64;
    let stack = (&nanos as *const u64) as u64;
    let mut x = nanos ^ pid.rotate_left(17) ^ stack.rotate_left(33) ^ 0x9E37_79B9_7F4A_7C15;
    let mut out = String::with_capacity(64);
    for _ in 0..4 {
        x = x.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = x;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^= z >> 31;
        out.push_str(&format!("{z:016x}"));
    }
    out
}

fn write_endpoint(port: u16, token: &str) {
    let Some(dir) = lidless_dir() else {
        eprintln!("[lidless] could not locate the home directory; control channel address not written");
        return;
    };
    if let Err(e) = std::fs::create_dir_all(&dir) {
        eprintln!("[lidless] failed to create ~/.lidless: {e}");
        return;
    }
    let path = dir.join("endpoint.json");
    let body = json!({ "port": port, "token": token }).to_string();
    if let Err(e) = std::fs::write(&path, body) {
        eprintln!("[lidless] failed to write endpoint.json: {e}");
    }
}

/// Start the control channel thread (called once inside the GUI process).
pub fn start(mgr: Arc<Manager>) {
    std::thread::Builder::new()
        .name("lidless-control".into())
        .spawn(move || {
            let server = match tiny_http::Server::http("127.0.0.1:0") {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("[lidless] failed to start control channel: {e}");
                    return;
                }
            };
            let port = match server.server_addr().to_ip() {
                Some(addr) => addr.port(),
                None => {
                    eprintln!("[lidless] could not obtain the control port");
                    return;
                }
            };
            let token = gen_token();
            write_endpoint(port, &token);

            for req in server.incoming_requests() {
                handle(&mgr, &token, req);
            }
        })
        .expect("failed to start control thread");
}

/// Remove the endpoint file on exit so a later stray hook immediately decides
/// "not running" instead of waiting for a connection timeout.
pub fn cleanup_endpoint() {
    if let Some(path) = endpoint_path() {
        let _ = std::fs::remove_file(path);
    }
}

#[derive(Deserialize, Default)]
struct Body {
    #[serde(default)]
    id: String,
    #[serde(default)]
    ttl_secs: Option<u64>,
    #[serde(default)]
    grace_secs: Option<u64>,
}

fn handle(mgr: &Arc<Manager>, token: &str, mut req: tiny_http::Request) {
    // Authenticate
    let expected = format!("Bearer {token}");
    let authed = req
        .headers()
        .iter()
        .any(|h| h.field.equiv("Authorization") && h.value.as_str() == expected);
    if !authed {
        let _ = req.respond(
            tiny_http::Response::from_string("unauthorized")
                .with_status_code(tiny_http::StatusCode(401)),
        );
        return;
    }

    let is_post = *req.method() == tiny_http::Method::Post;
    let url = req.url().to_string();

    // Read the body (fine if GET /status has none)
    let mut buf = String::new();
    let _ = req.as_reader().read_to_string(&mut buf);
    let body: Body = serde_json::from_str(&buf).unwrap_or_default();

    let status = match (is_post, url.as_str()) {
        (true, "/lease/refresh") => {
            let ttl = Duration::from_secs(body.ttl_secs.unwrap_or(3600));
            Some(mgr.lease_refresh(body.id, ttl))
        }
        (true, "/lease/release") => {
            let grace = Duration::from_secs(body.grace_secs.unwrap_or(60));
            Some(mgr.lease_release(body.id, grace))
        }
        (true, "/awake/on") => Some(mgr.set_desired(true)),
        (true, "/awake/off") => Some(mgr.force_off()),
        (false, "/status") => Some(mgr.snapshot()),
        _ => None,
    };

    match status {
        Some(s) => {
            let payload = serde_json::to_string(&s).unwrap_or_else(|_| "{}".into());
            let header =
                tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..])
                    .unwrap();
            let _ = req.respond(tiny_http::Response::from_string(payload).with_header(header));
        }
        None => {
            let _ = req.respond(
                tiny_http::Response::from_string("not found")
                    .with_status_code(tiny_http::StatusCode(404)),
            );
        }
    }
}
