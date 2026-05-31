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
            // macOS: run as an accessory so no Dock icon shows (menu-bar utility style)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // ---- System tray ----
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle keep awake", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show window", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Lidless", true, None::<&str>)?;
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
                .tooltip("Lidless — off")
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
                    // Cache the tray icon position so positioner can compute the popover coordinates
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

            // ---- Background monitor thread ----
            let mgr = app.state::<Arc<AwakeManager>>().inner().clone();
            manager::spawn_monitor(app.handle().clone(), mgr);

            Ok(())
        })
        .on_window_event(|window, event| match event {
            // Hide on focus loss: clicking anywhere outside the window dismisses the popover
            tauri::WindowEvent::Focused(false) => {
                let _ = window.hide();
            }
            // The frameless window has no close button; turn close requests into hide just in case
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
        .expect("error while running Lidless");
}

fn show_popover(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        // The Windows taskbar is usually at the bottom -> popover above the tray;
        // the macOS menu bar is at the top -> popover below the tray.
        #[cfg(target_os = "macos")]
        let pos = Position::TrayBottomCenter;
        #[cfg(not(target_os = "macos"))]
        let pos = Position::TrayCenter;
        let _ = w.move_window(pos);
        let _ = w.show();
        let _ = w.set_focus();
    }
}
