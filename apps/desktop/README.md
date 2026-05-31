# Lidless — desktop app

> Stay awake when locked · stay online

Keep the machine **awake while locked, with Wi-Fi alive**, so you can use Claude Code,
RustDesk and the like remotely. One switch, across Windows / macOS. The name comes from
the *lidless eye* — the machine looks asleep (locked), but the unblinking eye stays open.

## Features

- **One-tap keep awake**: prevent system sleep; after locking, the screen can still turn off normally while the system and background processes keep running.
- **Only when plugged in** (optional): pause automatically on battery, resume when plugged back in.
- **Modern Standby hint** (Windows): when S0 standby is detected, surface how to deal with wireless-adapter power saving.
- **Tray popover**: no taskbar icon and no always-on window; click the tray icon to pop up a panel next to the tray, click elsewhere (blur) to tuck it away while keep-awake continues in the background.

## How it works

| Platform | Prevent sleep | Power detection |
| --- | --- | --- |
| Windows | `SetThreadExecutionState(ES_CONTINUOUS \| ES_SYSTEM_REQUIRED \| ES_AWAYMODE_REQUIRED)` | `GetSystemPowerStatus` |
| macOS | IOKit `IOPMAssertionCreateWithName(PreventUserIdleSystemSleep)` | `pmset -g batt` |

All system calls are hand-written FFI (see `src-tauri/src/keepawake/`, `src-tauri/src/power.rs`),
with no third-party crates. Key constraint: Windows' `SetThreadExecutionState` state is
**thread-local**, so all OS-level keep-awake calls are made on the single monitor thread in
`manager.rs`; frontend commands only flip flags and wake that thread.

## Develop / run

Prerequisites: [Rust](https://rustup.rs/), [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/).
On Windows you also need WebView2 (bundled with Windows 11). Run from the repo root:

```bash
pnpm install
pnpm --filter @lidless/desktop icon   # generate per-platform icons from app-icon.png into src-tauri/icons/
pnpm desktop:dev                       # run in dev mode
pnpm desktop:build                     # build the installers
```

## Roadmap (step 2)

The current version keeps Wi-Fi alive as a side effect of "keeping the system awake",
which is enough for most machines that use traditional S3 sleep. Handling wireless-adapter
power saving more thoroughly (especially on Modern Standby machines) would need:

- Windows: disable the adapter's "Allow the computer to turn off this device to save power"
  via WMI (`MSPower_DeviceWakeEnable`) or device properties — requires administrator rights.
- Persisting the keep-awake state, launch-on-login, and a first-run onboarding flow.

See the hint produced by `system_report` in `manager.rs`.
