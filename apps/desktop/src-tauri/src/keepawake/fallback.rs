//! Placeholder implementation for other platforms (e.g. Linux); compiles only.

pub struct Awake;

impl Awake {
    pub fn new() -> Self {
        Self
    }

    pub fn engage(&mut self) -> Result<(), String> {
        Err("keep-awake is not supported on this platform yet".into())
    }

    pub fn disengage(&mut self) -> Result<(), String> {
        Ok(())
    }
}
