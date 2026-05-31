//! 跨平台「保持唤醒」原语。
//!
//! 统一接口：`Awake::new()` 创建（未生效），`engage()` 让系统不睡眠，
//! `disengage()` 解除。各平台实现见同目录文件。
//!
//! ⚠️ Windows 重要约束：`SetThreadExecutionState` 设置的状态是**线程私有**的，
//! 线程退出即失效。因此 `engage()/disengage()` 必须始终在同一个长生命周期线程
//! （manager 里的 monitor 线程）上调用——调用方已保证这一点。

#[cfg(target_os = "windows")]
mod windows;
#[cfg(target_os = "windows")]
pub use windows::Awake;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::Awake;

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
mod fallback;
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub use fallback::Awake;
