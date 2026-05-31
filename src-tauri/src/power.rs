//! 电源状态检测：用于「仅在插电时生效」选项。
//!
//! 返回 `Some(true)` 表示已接通电源，`Some(false)` 表示电池供电，`None` 表示未知。

pub fn on_ac_power() -> Option<bool> {
    #[cfg(target_os = "windows")]
    {
        windows_on_ac()
    }
    #[cfg(target_os = "macos")]
    {
        macos_on_ac()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        None
    }
}

#[cfg(target_os = "windows")]
fn windows_on_ac() -> Option<bool> {
    #[repr(C)]
    #[allow(dead_code)] // 字段由 FFI 写入，Rust 侧只读 ac_line_status
    struct SystemPowerStatus {
        ac_line_status: u8,
        battery_flag: u8,
        battery_life_percent: u8,
        system_status_flag: u8,
        battery_life_time: u32,
        battery_full_life_time: u32,
    }

    #[link(name = "kernel32")]
    unsafe extern "system" {
        fn GetSystemPowerStatus(lp: *mut SystemPowerStatus) -> i32;
    }

    let mut s = SystemPowerStatus {
        ac_line_status: 255,
        battery_flag: 0,
        battery_life_percent: 0,
        system_status_flag: 0,
        battery_life_time: 0,
        battery_full_life_time: 0,
    };
    let ok = unsafe { GetSystemPowerStatus(&mut s) };
    if ok == 0 {
        return None;
    }
    match s.ac_line_status {
        0 => Some(false), // Offline，电池
        1 => Some(true),  // Online，已插电
        _ => None,        // 255 Unknown
    }
}

#[cfg(target_os = "macos")]
fn macos_on_ac() -> Option<bool> {
    // 解析 `pmset -g batt`，输出含 "AC Power" 或 "Battery Power"
    let out = std::process::Command::new("pmset")
        .args(["-g", "batt"])
        .output()
        .ok()?;
    let text = String::from_utf8_lossy(&out.stdout);
    if text.contains("AC Power") {
        Some(true)
    } else if text.contains("Battery Power") {
        Some(false)
    } else {
        None
    }
}
