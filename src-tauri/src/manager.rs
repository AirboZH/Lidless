//! 状态机 + 后台 monitor 线程。
//!
//! 设计要点：**所有操作系统级保活调用都只发生在 monitor 这一个线程上**，
//! 因为 Windows 的 SetThreadExecutionState 是线程私有的。前端命令只修改标志位
//! 并唤醒 monitor，由 monitor 统一执行 engage/disengage。
//!
//! 用 generation 计数 + Condvar 消除「丢失唤醒」竞态：命令在持锁时自增 generation
//! 并 notify；monitor 处理完后若发现 generation 未变才进入带超时的等待，
//! 超时（2s）用于轮询电源变化（插拔电源）。

use std::sync::{Arc, Condvar, Mutex};
use std::time::Duration;

use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::keepawake::Awake;
use crate::power;

#[derive(Clone, Serialize, PartialEq)]
pub struct Status {
    /// 用户是否打开了开关
    pub desired: bool,
    /// 系统层面当前是否真的在保活
    pub engaged: bool,
    /// 是否「仅插电时生效」
    pub ac_only: bool,
    /// 当前是否接通电源：Some(true)=插电, Some(false)=电池, None=未知
    pub on_ac: Option<bool>,
    pub platform: String,
}

struct Inner {
    desired: bool,
    ac_only: bool,
    engaged: bool,
    on_ac: Option<bool>,
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
                generation: 0,
            }),
            cv: Condvar::new(),
        }
    }

    fn snapshot_locked(&self, g: &Inner) -> Status {
        Status {
            desired: g.desired,
            engaged: g.engaged,
            ac_only: g.ac_only,
            on_ac: g.on_ac,
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
}

/// 启动后台 monitor 线程。该线程是唯一执行 OS 级保活调用的线程。
pub fn spawn_monitor(app: AppHandle, mgr: Arc<Manager>) {
    std::thread::Builder::new()
        .name("lidless-monitor".into())
        .spawn(move || {
            let mut awake = Awake::new();
            let mut last_status: Option<Status> = None;

            loop {
                // 1) 在锁外采样电源状态（macOS 下会 spawn pmset，不宜持锁进行）
                let on_ac = power::on_ac_power();

                // 2) 持锁：更新状态、计算目标、必要时做 OS 调用
                let (status, seen_gen) = {
                    let mut g = mgr.inner.lock().unwrap();
                    g.on_ac = on_ac;
                    let should = g.desired && (!g.ac_only || on_ac.unwrap_or(true));
                    if should != g.engaged {
                        let res = if should {
                            awake.engage()
                        } else {
                            awake.disengage()
                        };
                        match res {
                            Ok(()) => g.engaged = should,
                            Err(e) => eprintln!("[lidless] 保活调用失败: {e}"),
                        }
                    }
                    (mgr.snapshot_locked(&g), g.generation)
                };

                // 3) 状态有变化才更新托盘 + 通知前端
                if last_status.as_ref() != Some(&status) {
                    update_tray(&app, status.engaged);
                    let _ = app.emit("status-changed", &status);
                    last_status = Some(status);
                }

                // 4) 等待命令唤醒（generation 变化）或 2s 超时（轮询电源变化）
                let g = mgr.inner.lock().unwrap();
                if g.generation == seen_gen {
                    let _ = mgr.cv.wait_timeout(g, Duration::from_secs(2)).unwrap();
                }
                // 否则期间已有命令到达，直接进入下一轮重新评估
            }
        })
        .expect("无法启动 monitor 线程");
}

/// 托盘操作需在主线程执行，故 marshal 过去。
fn update_tray(app: &AppHandle, engaged: bool) {
    let app = app.clone();
    let _ = app.clone().run_on_main_thread(move || {
        if let Some(tray) = app.tray_by_id("main") {
            let tip = if engaged {
                "Lidless — 已保活（系统不睡眠）"
            } else {
                "Lidless — 未启用"
            };
            let _ = tray.set_tooltip(Some(tip));
        }
    });
}

// ---------- Tauri 命令 ----------

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

#[derive(Serialize)]
pub struct SystemReport {
    pub platform: String,
    /// Windows 是否启用了 Modern Standby (S0)；其它平台为 None
    pub modern_standby: Option<bool>,
    /// 需要提醒用户的注意事项（如有）
    pub note: Option<String>,
}

#[tauri::command]
pub fn system_report() -> SystemReport {
    #[cfg(target_os = "windows")]
    {
        let ms = win_modern_standby();
        let note = if ms == Some(true) {
            Some(
                "检测到 Modern Standby (S0)：锁屏后无线网卡仍可能被切断。\
                 建议在「设备管理器 → 网络适配器 → 你的无线网卡 → 属性 → 电源管理」\
                 取消勾选「允许计算机关闭此设备以节约电源」。"
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
    // 注册表 CsEnabled=1 表示启用了 Connected/Modern Standby（与系统语言无关）
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
