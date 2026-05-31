//! Windows implementation: use `SetThreadExecutionState` to prevent system
//! sleep and enable away mode (the screen may turn off, but the system and
//! background processes keep running — exactly "locked but not sleeping").
//!
//! - ES_SYSTEM_REQUIRED   tells the system "someone is using it", resetting the idle-sleep timer
//! - ES_AWAYMODE_REQUIRED away mode: the screen turns off, the system doesn't truly sleep, remote access keeps working
//! - ES_CONTINUOUS        keeps the above state in effect until the next call passes ES_CONTINUOUS alone to reset it
//!
//! Note: we deliberately do **not** add ES_DISPLAY_REQUIRED, so the screen can
//! still turn off normally after locking to save power.

const ES_CONTINUOUS: u32 = 0x8000_0000;
const ES_SYSTEM_REQUIRED: u32 = 0x0000_0001;
const ES_AWAYMODE_REQUIRED: u32 = 0x0000_0040;

#[link(name = "kernel32")]
unsafe extern "system" {
    fn SetThreadExecutionState(es_flags: u32) -> u32;
}

pub struct Awake {
    engaged: bool,
}

impl Awake {
    pub fn new() -> Self {
        Self { engaged: false }
    }

    pub fn engage(&mut self) -> Result<(), String> {
        // The return value is the "previous state"; it may be 0 on a brand-new
        // thread, so we don't treat that as a failure.
        unsafe {
            SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_AWAYMODE_REQUIRED);
        }
        self.engaged = true;
        Ok(())
    }

    pub fn disengage(&mut self) -> Result<(), String> {
        unsafe {
            SetThreadExecutionState(ES_CONTINUOUS);
        }
        self.engaged = false;
        Ok(())
    }
}

impl Drop for Awake {
    fn drop(&mut self) {
        if self.engaged {
            let _ = self.disengage();
        }
    }
}
