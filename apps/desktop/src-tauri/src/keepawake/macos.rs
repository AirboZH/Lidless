//! macOS implementation: create a power assertion via the IOKit power
//! management framework — exactly what the `caffeinate` command does under
//! the hood.
//!
//! Uses `PreventUserIdleSystemSleep`: blocks idle system sleep but **allows
//! the display to sleep** (the screen can turn off after locking). The system
//! stays awake, so Wi-Fi naturally won't drop. Released with
//! `IOPMAssertionRelease` on exit.

use std::ffi::{c_void, CString};
use std::os::raw::c_char;

type CFStringRef = *const c_void;
type CFAllocatorRef = *const c_void;
type IOPMAssertionID = u32;
type IOReturn = i32;

const KCFSTRING_ENCODING_UTF8: u32 = 0x0800_0100;
const KIOPM_ASSERTION_LEVEL_ON: u32 = 255;
const KIORETURN_SUCCESS: IOReturn = 0;

// Prevent system sleep but let the display sleep (the screen can turn off / lock)
const ASSERTION_TYPE: &str = "PreventUserIdleSystemSleep";
const ASSERTION_NAME: &str = "Lidless is keeping the system awake";

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
    let c = CString::new(s).expect("assertion string must not contain NUL");
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
            Err(format!("IOPMAssertionCreateWithName failed: {rc}"))
        }
    }

    pub fn disengage(&mut self) -> Result<(), String> {
        if let Some(id) = self.assertion.take() {
            let rc = unsafe { IOPMAssertionRelease(id) };
            if rc != KIORETURN_SUCCESS {
                return Err(format!("IOPMAssertionRelease failed: {rc}"));
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
