//! CLI client mode: when the Lidless binary is launched with arguments (usually
//! from an agent hook), it reads `~/.lidless/endpoint.json` and sends an HTTP
//! control request to the running GUI instance.
//!
//! Key constraint: **the hook must not block or slow down the agent**. Therefore:
//! - the `hook` subcommand returns 0 regardless of success/failure (GUI not
//!   running / parse failure are silently ignored);
//! - connections use a short timeout;
//! - only "manually invoked" subcommands like `awake` / `lease` return non-zero
//!   and print a message on failure.

use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Duration;

use serde_json::{json, Value};

use crate::control::endpoint_path;

/// Entry point: returns the process exit code.
pub fn run(args: &[String]) -> i32 {
    match args.first().map(String::as_str) {
        Some("hook") => hook(&args[1..]),
        Some("awake") => awake(&args[1..]),
        Some("lease") => lease(&args[1..]),
        Some("integration") => integration(&args[1..]),
        _ => {
            eprintln!("usage: lidless <hook|awake|lease|integration> ...");
            2
        }
    }
}

/// Whether this is a CLI subcommand (lets main decide to enter CLI mode instead of starting the GUI).
pub fn is_cli_command(arg: &str) -> bool {
    matches!(arg, "hook" | "awake" | "lease" | "integration")
}

// ---------- hook subcommands ----------

fn hook(args: &[String]) -> i32 {
    match args.first().map(String::as_str) {
        Some("claude") => hook_claude(),
        Some("codex") => hook_codex(&args[1..]),
        _ => {
            eprintln!("usage: lidless hook <claude|codex>");
            0
        }
    }
}

/// Claude Code: the hook payload arrives as JSON on **stdin**, containing
/// `hook_event_name` / `session_id`. Events map to lease refresh / release.
/// Any error silently returns 0.
fn hook_claude() -> i32 {
    let mut buf = String::new();
    if std::io::stdin().read_to_string(&mut buf).is_err() {
        return 0;
    }
    let Ok(v) = serde_json::from_str::<Value>(&buf) else {
        return 0;
    };
    let event = v
        .get("hook_event_name")
        .and_then(Value::as_str)
        .unwrap_or("");
    let session = v
        .get("session_id")
        .and_then(Value::as_str)
        .unwrap_or("default")
        .to_string();

    let _ = match event {
        // Activity events: refresh. ttl is only the crash-safety upper bound.
        "UserPromptSubmit" | "PreToolUse" | "PostToolUse" | "Notification" | "SessionStart" => {
            post("/lease/refresh", json!({ "id": session, "ttl_secs": 3600 }))
        }
        // End of a turn / subagent: give a 60s grace so the next prompt can renew, avoiding flapping.
        "Stop" | "SubagentStop" => {
            post("/lease/release", json!({ "id": session, "grace_secs": 60 }))
        }
        // Session ended: release immediately.
        "SessionEnd" => post("/lease/release", json!({ "id": session, "grace_secs": 0 })),
        _ => Ok(String::new()),
    };
    0
}

/// Codex: `notify` passes the event JSON as the **last argv** (not stdin).
/// Codex's notify mainly fires on "complete / approval"; there is no reliable
/// "start" signal, so the semantics are "you run it manually, and when it
/// finishes we turn everything off" -> `agent-turn-complete` calls /awake/off.
fn hook_codex(args: &[String]) -> i32 {
    let Some(raw) = args.last() else {
        return 0;
    };
    let Ok(v) = serde_json::from_str::<Value>(raw) else {
        return 0;
    };
    let ty = v.get("type").and_then(Value::as_str).unwrap_or("");
    if ty == "agent-turn-complete" {
        let _ = post("/awake/off", json!({}));
    }
    0
}

// ---------- manually invoked subcommands ----------

fn awake(args: &[String]) -> i32 {
    let path = match args.first().map(String::as_str) {
        Some("on") => "/awake/on",
        Some("off") => "/awake/off",
        _ => {
            eprintln!("usage: lidless awake <on|off>");
            return 2;
        }
    };
    print_post(path, json!({}))
}

fn lease(args: &[String]) -> i32 {
    let sub = args.first().map(String::as_str).unwrap_or("");
    let id = args.get(1).cloned().unwrap_or_else(|| "default".into());
    match sub {
        "refresh" => {
            let ttl: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(3600);
            print_post("/lease/refresh", json!({ "id": id, "ttl_secs": ttl }))
        }
        "release" => {
            let grace: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(60);
            print_post("/lease/release", json!({ "id": id, "grace_secs": grace }))
        }
        _ => {
            eprintln!("usage: lidless lease <refresh|release> <id> [secs]");
            2
        }
    }
}

/// `lidless integration <install|remove|status> [claude|codex]`.
/// Pure local file operations; does not require the GUI to be running.
fn integration(args: &[String]) -> i32 {
    let sub = args.first().map(String::as_str).unwrap_or("");
    match sub {
        "status" => {
            let (claude, codex) = crate::integrations::status();
            println!("claude_code: {claude}\ncodex: {codex}");
            0
        }
        "install" | "remove" => {
            let Some(target) = args.get(1) else {
                eprintln!("usage: lidless integration {sub} <claude|codex>");
                return 2;
            };
            let res = if sub == "install" {
                crate::integrations::install(target)
            } else {
                crate::integrations::remove(target)
            };
            match res {
                Ok(()) => {
                    println!("{sub} {target}: ok");
                    0
                }
                Err(e) => {
                    eprintln!("{e}");
                    1
                }
            }
        }
        _ => {
            eprintln!("usage: lidless integration <install|remove|status> [claude|codex]");
            2
        }
    }
}

fn print_post(path: &str, body: Value) -> i32 {
    match post(path, body) {
        Ok(b) => {
            println!("{b}");
            0
        }
        Err(e) => {
            eprintln!("cannot connect to Lidless (is it running?): {e}");
            1
        }
    }
}

// ---------- minimal HTTP client ----------

fn post(path: &str, body: Value) -> std::io::Result<String> {
    let (port, token) = read_endpoint()?;
    let payload = body.to_string();
    let mut stream = TcpStream::connect(("127.0.0.1", port))?;
    stream.set_read_timeout(Some(Duration::from_millis(800)))?;
    stream.set_write_timeout(Some(Duration::from_millis(800)))?;
    let req = format!(
        "POST {path} HTTP/1.1\r\n\
         Host: 127.0.0.1\r\n\
         Authorization: Bearer {token}\r\n\
         Content-Type: application/json\r\n\
         Content-Length: {len}\r\n\
         Connection: close\r\n\r\n{payload}",
        len = payload.len()
    );
    stream.write_all(req.as_bytes())?;
    let mut resp = String::new();
    let _ = stream.read_to_string(&mut resp);
    // Return the response body (everything after the first blank line)
    Ok(resp
        .split_once("\r\n\r\n")
        .map(|(_, b)| b.to_string())
        .unwrap_or_default())
}

fn read_endpoint() -> std::io::Result<(u16, String)> {
    use std::io::{Error, ErrorKind};
    let path = endpoint_path()
        .ok_or_else(|| Error::new(ErrorKind::NotFound, "could not locate ~/.lidless/endpoint.json"))?;
    let txt = std::fs::read_to_string(path)?;
    let v: Value =
        serde_json::from_str(&txt).map_err(|e| Error::new(ErrorKind::InvalidData, e))?;
    let port = v
        .get("port")
        .and_then(Value::as_u64)
        .ok_or_else(|| Error::new(ErrorKind::InvalidData, "endpoint.json is missing \"port\""))?
        as u16;
    let token = v
        .get("token")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    Ok((port, token))
}
