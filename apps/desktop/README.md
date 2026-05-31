# Lidless

> 锁屏不睡眠 · 网络不掉线

让电脑在**锁屏状态下保持唤醒、Wi-Fi 不断**，方便远程使用 Claude Code、RustDesk 等。
一个开关，跨 Windows / macOS。名字取自 *lidless eye*——机器看起来睡着了（锁屏），那只不闭的眼睛却始终醒着。

## 功能

- **一键保活**：阻止系统进入睡眠；锁屏后屏幕可正常熄灭，但系统和后台进程继续运行。
- **仅插电时生效**（可选）：拔掉电源自动暂停，插上自动恢复。
- **Modern Standby 提醒**（Windows）：检测到 S0 待机时提示无线网卡省电的处理办法。
- **托盘弹窗**：无任务栏图标、无常驻窗口；点击托盘图标在托盘旁弹出面板，点击别处（失焦）自动收起，后台继续保活。

## 技术原理

| 平台 | 阻止睡眠 | 电源检测 |
| --- | --- | --- |
| Windows | `SetThreadExecutionState(ES_CONTINUOUS \| ES_SYSTEM_REQUIRED \| ES_AWAYMODE_REQUIRED)` | `GetSystemPowerStatus` |
| macOS | IOKit `IOPMAssertionCreateWithName(PreventUserIdleSystemSleep)` | `pmset -g batt` |

系统调用均为手写 FFI（见 `src-tauri/src/keepawake/`、`src-tauri/src/power.rs`），不依赖第三方 crate。
关键约束：Windows 的 `SetThreadExecutionState` 状态是**线程私有**的，因此所有 OS 级保活调用都集中在
`manager.rs` 的单一 monitor 线程上执行；前端命令只改标志位并唤醒该线程。

## 开发 / 运行

前置：[Rust](https://rustup.rs/)、[Node.js](https://nodejs.org/)、[pnpm](https://pnpm.io/)。Windows 还需 WebView2（Win11 自带）。

```bash
pnpm install
pnpm icon        # 由 app-icon.png 生成各平台图标到 src-tauri/icons/
pnpm dev         # 开发模式运行
pnpm build       # 打包安装程序
```

## 后续计划（step 2）

当前版本靠「让系统不睡眠」顺带保住 Wi-Fi，对绝大多数传统 S3 睡眠的机器足够。
更彻底地处理无线网卡省电（尤其 Modern Standby 机型）需要：

- Windows：通过 WMI (`MSPower_DeviceWakeEnable`) 或设备属性关闭网卡的「允许计算机关闭此设备以节约电源」，需要管理员权限。
- 把保活状态持久化、开机自启、首次引导。

详见 `manager.rs` 中 `system_report` 给出的提示。
