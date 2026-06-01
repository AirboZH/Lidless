//! State machine + background monitor thread.
//!
//! Key design point: **all OS-level keep-awake calls happen on the single
//! monitor thread**, because Windows' SetThreadExecutionState is thread-local.
//! Frontend commands only flip flags and wake the monitor, which performs
//! engage/disengage centrally.
//!
//! A generation counter + Condvar eliminates the "lost wakeup" race: a command
//! increments the generation while holding the lock and notifies; after
//! handling, the monitor only enters a timed wait if the generation is
//! unchanged. The timeout (2s) is used to poll power changes (plug/unplug).

use std::collections::HashMap;
use std::sync::{Arc, Condvar, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::keepawake::Awake;
use crate::power;

#[derive(Clone, Serialize, PartialEq)]
pub struct Status {
    /// Whether the user has turned the switch on
    pub desired: bool,
    /// Whether keep-awake is actually engaged at the system level right now
    pub engaged: bool,
    /// Whether "only when plugged in" is enabled
    pub ac_only: bool,
    /// Current power source: Some(true)=plugged in, Some(false)=battery, None=unknown
    pub on_ac: Option<bool>,
    /// Whether "auto keep-awake with agents" is enabled (i.e. the hook lease layer is active)
    pub auto_enabled: bool,
    /// Whether keep-awake is currently held by an agent lease (auto_enabled and an unexpired lease exists)
    pub auto_active: bool,
    /// Number of currently unexpired agent leases
    pub active_leases: u32,
    pub platform: String,
}

struct Inner {
    desired: bool,
    ac_only: bool,
    engaged: bool,
    on_ac: Option<bool>,
    /// Master switch for "auto keep-awake with agents"
    auto_enabled: bool,
    /// Agent leases: session_id -> expiry instant. Any unexpired lease keeps the system awake.
    leases: HashMap<String, Instant>,
    generation: u64,
}

pub struct Manager {
    inner: Mutex<Inner>,
    cv: Condvar,
}

fn platform_name() -> String {
    if cfg!(target_os = "windows") {
        "windows".into()
    } else if cfg!(target_os = "macos") {
        "macos".into()
    } else {
        "other".into()
    }
}

impl Manager {
    pub fn new() -> Self {
        Manager {
            inner: Mutex::new(Inner {
                desired: false,
                ac_only: false,
                engaged: false,
                on_ac: None,
                auto_enabled: true,
                leases: HashMap::new(),
                generation: 0,
            }),
            cv: Condvar::new(),
        }
    }

    fn snapshot_locked(&self, g: &Inner) -> Status {
        let now = Instant::now();
        let active = g.leases.values().filter(|exp| **exp > now).count() as u32;
        Status {
            desired: g.desired,
            engaged: g.engaged,
            ac_only: g.ac_only,
            on_ac: g.on_ac,
            auto_enabled: g.auto_enabled,
            auto_active: g.auto_enabled && active > 0,
            active_leases: active,
            platform: platform_name(),
        }
    }

    pub fn snapshot(&self) -> Status {
        let g = self.inner.lock().unwrap();
        self.snapshot_locked(&g)
    }

    pub fn set_desired(&self, desired: bool) -> Status {
        let mut g = self.inner.lock().unwrap();
        g.desired = desired;
        g.generation = g.generation.wrapping_add(1);
        let s = self.snapshot_locked(&g);
        drop(g);
        self.cv.notify_all();
        s
    }

    pub fn set_ac_only(&self, ac_only: bool) -> Status {
        let mut g = self.inner.lock().unwrap();
        g.ac_only = ac_only;
        g.generation = g.generation.wrapping_add(1);
        let s = self.snapshot_locked(&g);
        drop(g);
        self.cv.notify_all();
        s
    }

    pub fn set_auto_enabled(&self, enabled: bool) -> Status {
        let mut g = self.inner.lock().unwrap();
        g.auto_enabled = enabled;
        g.generation = g.generation.wrapping_add(1);
        let s = self.snapshot_locked(&g);
        drop(g);
        self.cv.notify_all();
        s
    }

    /// Renew an agent lease (triggered by an activity event). `ttl` is the
    /// crash-safety upper bound: if the agent process exits abnormally without
    /// sending a finish signal, the lease still expires automatically after ttl.
    pub fn lease_refresh(&self, id: String, ttl: Duration) -> Status {
        let mut g = self.inner.lock().unwrap();
        g.leases.insert(id, Instant::now() + ttl);
        g.generation = g.generation.wrapping_add(1);
        let s = self.snapshot_locked(&g);
        drop(g);
        self.cv.notify_all();
        s
    }

    /// Release an agent lease (triggered by a finish event). When `grace`>0 it
    /// only **shortens** the expiry to now+grace (never extends an existing
    /// earlier expiry), leaving a renewal window for the next prompt in
    /// interactive mode; when `grace`==0 it removes the lease immediately.
    pub fn lease_release(&self, id: String, grace: Duration) -> Status {
        let mut g = self.inner.lock().unwrap();
        if grace.is_zero() {
            g.leases.remove(&id);
        } else {
            let exp = Instant::now() + grace;
            g.leases
                .entry(id)
                .and_modify(|e| {
                    if exp < *e {
                        *e = exp;
                    }
                })
                .or_insert(exp);
        }
        g.generation = g.generation.wrapping_add(1);
        let s = self.snapshot_locked(&g);
        drop(g);
        self.cv.notify_all();
        s
    }

    /// Force everything off: turn off the manual switch and clear all agent
    /// leases ("I'm done, let it sleep").
    pub fn force_off(&self) -> Status {
        let mut g = self.inner.lock().unwrap();
        g.desired = false;
        g.leases.clear();
        g.generation = g.generation.wrapping_add(1);
        let s = self.snapshot_locked(&g);
        drop(g);
        self.cv.notify_all();
        s
    }
}

/// Start the background monitor thread. It is the only thread that performs
/// OS-level keep-awake calls.
pub fn spawn_monitor(app: AppHandle, mgr: Arc<Manager>) {
    std::thread::Builder::new()
        .name("lidless-monitor".into())
        .spawn(move || {
            let mut awake = Awake::new();
            let mut last_status: Option<Status> = None;

            loop {
                // 1) Sample the power state outside the lock (on macOS this spawns
                //    pmset, which shouldn't run while holding the lock)
                let on_ac = power::on_ac_power();

                // 2) Hold the lock: update state, compute the target, make the OS call if needed
                let (status, seen_gen) = {
                    let mut g = mgr.inner.lock().unwrap();
                    g.on_ac = on_ac;
                    // Drop expired leases (piggybacks on the 2s poll, no extra timer needed)
                    let now = Instant::now();
                    g.leases.retain(|_, exp| *exp > now);
                    // The manual switch OR (auto enabled && a live lease exists) requires keep-awake
                    let want = g.desired || (g.auto_enabled && !g.leases.is_empty());
                    let should = want && (!g.ac_only || on_ac.unwrap_or(true));
                    if should != g.engaged {
                        let res = if should {
                            awake.engage()
                        } else {
                            awake.disengage()
                        };
                        match res {
                            Ok(()) => g.engaged = should,
                            Err(e) => eprintln!("[lidless] keep-awake call failed: {e}"),
                        }
                    }
                    (mgr.snapshot_locked(&g), g.generation)
                };

                // 3) Only update the tray + notify the frontend when the status changed
                if last_status.as_ref() != Some(&status) {
                    update_tray(&app, status.engaged);
                    let _ = app.emit("status-changed", &status);
                    last_status = Some(status);
                }

                // 4) Wait for a command to wake us (generation change) or a 2s timeout (poll power changes)
                let g = mgr.inner.lock().unwrap();
                if g.generation == seen_gen {
                    let _ = mgr.cv.wait_timeout(g, Duration::from_secs(2)).unwrap();
                }
                // Otherwise a command already arrived; loop and re-evaluate immediately
            }
        })
        .expect("failed to start monitor thread");
}

/// Tray operations must run on the main thread, so marshal over to it.
fn update_tray(app: &AppHandle, engaged: bool) {
    let app = app.clone();
    let _ = app.clone().run_on_main_thread(move || {
        if let Some(tray) = app.tray_by_id("main") {
            let tip = if engaged {
                "Lidless — active (system won't sleep)"
            } else {
                "Lidless — off"
            };
            let _ = tray.set_tooltip(Some(tip));
        }
    });
}

// ---------- Tauri commands ----------

#[tauri::command]
pub fn get_status(mgr: State<'_, Arc<Manager>>) -> Status {
    mgr.snapshot()
}

#[tauri::command]
pub fn set_desired(desired: bool, mgr: State<'_, Arc<Manager>>) -> Status {
    mgr.set_desired(desired)
}

#[tauri::command]
pub fn set_ac_only(ac_only: bool, mgr: State<'_, Arc<Manager>>) -> Status {
    mgr.set_ac_only(ac_only)
}

#[tauri::command]
pub fn set_auto_enabled(enabled: bool, mgr: State<'_, Arc<Manager>>) -> Status {
    mgr.set_auto_enabled(enabled)
}

#[derive(Serialize)]
pub struct SystemReport {
    pub platform: String,
    /// Whether Windows has Modern Standby (S0) enabled; None on other platforms
    pub modern_standby: Option<bool>,
    /// A note to surface to the user, if any
    pub note: Option<String>,
}

#[tauri::command]
pub fn system_report() -> SystemReport {
    #[cfg(target_os = "windows")]
    {
        let ms = win_modern_standby();
        let note = if ms == Some(true) {
            Some(
                "Modern Standby (S0) detected: the wireless adapter may still be cut off after \
                 locking. We recommend unchecking \"Allow the computer to turn off this device to \
                 save power\" under Device Manager -> Network adapters -> your wireless adapter -> \
                 Properties -> Power Management."
                    .into(),
            )
        } else {
            None
        };
        SystemReport {
            platform: "windows".into(),
            modern_standby: ms,
            note,
        }
    }
    #[cfg(target_os = "macos")]
    {
        SystemReport {
            platform: "macos".into(),
            modern_standby: None,
            note: None,
        }
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        SystemReport {
            platform: "other".into(),
            modern_standby: None,
            note: None,
        }
    }
}

#[cfg(target_os = "windows")]
fn win_modern_standby() -> Option<bool> {
    // Registry CsEnabled=1 means Connected/Modern Standby is enabled (language-independent)
    let out = std::process::Command::new("reg")
        .args([
            "query",
            r"HKLM\SYSTEM\CurrentControlSet\Control\Power",
            "/v",
            "CsEnabled",
        ])
        .output()
        .ok()?;
    let text = String::from_utf8_lossy(&out.stdout).to_lowercase();
    if text.contains("0x1") {
        Some(true)
    } else if text.contains("0x0") {
        Some(false)
    } else {
        None
    }
}
