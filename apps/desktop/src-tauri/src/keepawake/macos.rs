//! macOS 实现：通过 IOKit 电源管理框架创建 power assertion，
//! 这正是 `caffeinate` 命令的底层做法。
//!
//! 用 `PreventUserIdleSystemSleep`：阻止系统空闲睡眠，但**允许显示器睡眠**
//! （锁屏后屏幕可熄灭）。系统不睡眠，Wi-Fi 自然不会断。
//! 退出时 `IOPMAssertionRelease` 释放。

use std::ffi::{c_void, CString};
use std::os::raw::c_char;

type CFStringRef = *const c_void;
type CFAllocatorRef = *const c_void;
type IOPMAssertionID = u32;
type IOReturn = i32;

const KCFSTRING_ENCODING_UTF8: u32 = 0x0800_0100;
const KIOPM_ASSERTION_LEVEL_ON: u32 = 255;
const KIORETURN_SUCCESS: IOReturn = 0;

// 阻止系统睡眠，但放任显示器睡眠（屏幕可熄灭 / 锁屏）
const ASSERTION_TYPE: &str = "PreventUserIdleSystemSleep";
const ASSERTION_NAME: &str = "Lidless 正在保持系统唤醒";

#[link(name = "CoreFoundation", kind = "framework")]
unsafe extern "C" {
    fn CFStringCreateWithCString(
        alloc: CFAllocatorRef,
        c_str: *const c_char,
        encoding: u32,
    ) -> CFStringRef;
    fn CFRelease(cf: *const c_void);
}

#[link(name = "IOKit", kind = "framework")]
unsafe extern "C" {
    fn IOPMAssertionCreateWithName(
        assertion_type: CFStringRef,
        assertion_level: u32,
        assertion_name: CFStringRef,
        assertion_id: *mut IOPMAssertionID,
    ) -> IOReturn;
    fn IOPMAssertionRelease(assertion_id: IOPMAssertionID) -> IOReturn;
}

fn cfstr(s: &str) -> CFStringRef {
    let c = CString::new(s).expect("assertion 字符串不应包含 NUL");
    unsafe { CFStringCreateWithCString(std::ptr::null(), c.as_ptr(), KCFSTRING_ENCODING_UTF8) }
}

pub struct Awake {
    assertion: Option<IOPMAssertionID>,
}

impl Awake {
    pub fn new() -> Self {
        Self { assertion: None }
    }

    pub fn engage(&mut self) -> Result<(), String> {
        if self.assertion.is_some() {
            return Ok(());
        }
        let type_ref = cfstr(ASSERTION_TYPE);
        let name_ref = cfstr(ASSERTION_NAME);
        let mut id: IOPMAssertionID = 0;
        let rc = unsafe {
            IOPMAssertionCreateWithName(type_ref, KIOPM_ASSERTION_LEVEL_ON, name_ref, &mut id)
        };
        unsafe {
            CFRelease(type_ref);
            CFRelease(name_ref);
        }
        if rc == KIORETURN_SUCCESS {
            self.assertion = Some(id);
            Ok(())
        } else {
            Err(format!("IOPMAssertionCreateWithName 失败: {rc}"))
        }
    }

    pub fn disengage(&mut self) -> Result<(), String> {
        if let Some(id) = self.assertion.take() {
            let rc = unsafe { IOPMAssertionRelease(id) };
            if rc != KIORETURN_SUCCESS {
                return Err(format!("IOPMAssertionRelease 失败: {rc}"));
            }
        }
        Ok(())
    }
}

impl Drop for Awake {
    fn drop(&mut self) {
        let _ = self.disengage();
    }
}
