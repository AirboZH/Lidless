//! 其它平台（如 Linux）的占位实现，仅保证可编译。

pub struct Awake;

impl Awake {
    pub fn new() -> Self {
        Self
    }

    pub fn engage(&mut self) -> Result<(), String> {
        Err("当前平台暂不支持保持唤醒".into())
    }

    pub fn disengage(&mut self) -> Result<(), String> {
        Ok(())
    }
}
