//! Windows 实现：用 `SetThreadExecutionState` 阻止系统睡眠，并开启 away mode
//! （屏幕可黑，但系统与后台进程照常运行——正好对应「锁屏但不睡眠」）。
//!
//! - ES_SYSTEM_REQUIRED   告诉系统「有人在用」，重置空闲睡眠计时器
//! - ES_AWAYMODE_REQUIRED away 模式：屏幕熄灭、系统不真正睡眠，远程访问可继续
//! - ES_CONTINUOUS        让上述状态持续有效，直到下一次只传 ES_CONTINUOUS 复位
//!
//! 注意：刻意**不**加 ES_DISPLAY_REQUIRED，这样锁屏后屏幕可以正常熄灭省电。

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
        // 返回值是「上一个状态」，全新线程时可能为 0，故不据此判失败。
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
