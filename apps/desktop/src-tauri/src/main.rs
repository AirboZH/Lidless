// Hide the Windows console window in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // When invoked with a CLI subcommand (usually from the agent hook), run as a
    // client: connect to the already-running GUI instance, send the control
    // request, then exit immediately — never start another Tauri/tray instance.
    let args: Vec<String> = std::env::args().skip(1).collect();
    if let Some(first) = args.first() {
        if lidless_lib::cli::is_cli_command(first) {
            std::process::exit(lidless_lib::cli::run(&args));
        }
    }

    lidless_lib::run();
}
