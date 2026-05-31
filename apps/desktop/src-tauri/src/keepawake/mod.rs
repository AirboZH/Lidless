//! Cross-platform "keep awake" primitive.
//!
//! Unified interface: `Awake::new()` creates it (inactive), `engage()` keeps
//! the system from sleeping, `disengage()` releases it. Per-platform
//! implementations live in the sibling files.
//!
//! ⚠️ Important Windows constraint: the state set by `SetThreadExecutionState`
//! is **thread-local** and is cleared when the thread exits. Therefore
//! `engage()/disengage()` must always be called on the same long-lived thread
//! (the monitor thread in `manager`) — callers already guarantee this.

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
