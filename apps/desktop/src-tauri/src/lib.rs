mod keepawake;
mod manager;
mod power;

use std::sync::Arc;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tauri_plugin_positioner::{Position, WindowExt};

use crate::manager::Manager as AwakeManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mgr = Arc::new(AwakeManager::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .manage(mgr)
        .setup(|app| {
            // macOS：作为附件运行，不显示 Dock 图标（菜单栏小工具风格）
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // ---- 系统托盘 ----
            let toggle_i = MenuItem::with_id(app, "toggle", "切换保持唤醒", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出 Lidless", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[
                    &toggle_i,
                    &show_i,
                    &PredefinedMenuItem::separator(app)?,
                    &quit_i,
                ],
            )?;

            TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Lidless — 未启用")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => show_popover(app),
                    "toggle" => {
                        let mgr = app.state::<Arc<AwakeManager>>();
                        let cur = mgr.snapshot().desired;
                        mgr.set_desired(!cur);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // 缓存托盘图标位置，供 positioner 计算弹窗坐标
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_popover(tray.app_handle());
                    }
                })
                .build(app)?;

            // ---- 后台 monitor 线程 ----
            let mgr = app.state::<Arc<AwakeManager>>().inner().clone();
            manager::spawn_monitor(app.handle().clone(), mgr);

            Ok(())
        })
        .on_window_event(|window, event| match event {
            // 失去焦点即隐藏：点击窗口以外任何地方都会收起弹窗
            tauri::WindowEvent::Focused(false) => {
                let _ = window.hide();
            }
            // 无边框窗口没有关闭按钮，保险起见把关闭请求也转成隐藏
            tauri::WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            manager::get_status,
            manager::set_desired,
            manager::set_ac_only,
            manager::system_report,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Lidless 时出错");
}

fn show_popover(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        // Windows 任务栏通常在下方 → 弹窗在托盘上方；
        // macOS 菜单栏在上方 → 弹窗在托盘下方。
        #[cfg(target_os = "macos")]
        let pos = Position::TrayBottomCenter;
        #[cfg(not(target_os = "macos"))]
        let pos = Position::TrayCenter;
        let _ = w.move_window(pos);
        let _ = w.show();
        let _ = w.set_focus();
    }
}
