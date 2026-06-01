//! One-click setup: write Lidless's hook configuration into the Claude Code /
//! Codex config files, with matching removal and status queries. The program
//! path in the commands uses the current exe's absolute path to avoid PATH issues.
//!
//! - Claude Code: `~/.claude/settings.json`, merged into the `hooks` field
//!   (serde_json, preserving the rest).
//! - Codex: `~/.codex/config.toml`, writes the top-level `notify` key
//!   (toml_edit, preserving comments and formatting).

use std::path::PathBuf;

use serde::Serialize;
use serde_json::{json, Map, Value};

use crate::control::home_dir;

/// Command signature: used to recognize / remove "the hook we wrote", so we
/// never delete the user's own configuration by mistake.
const CLAUDE_SIG: &str = "hook claude";

fn current_exe_string() -> Result<String, String> {
    std::env::current_exe()
        .map_err(|e| format!("could not get the current executable path: {e}"))?
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "the executable path contains invalid characters".to_string())
}

fn claude_settings_path() -> Result<PathBuf, String> {
    let mut p = home_dir().ok_or("could not locate the home directory")?;
    p.push(".claude");
    p.push("settings.json");
    Ok(p)
}

fn codex_config_path() -> Result<PathBuf, String> {
    let mut p = home_dir().ok_or("could not locate the home directory")?;
    p.push(".codex");
    p.push("config.toml");
    Ok(p)
}

// ---------- Claude Code ----------

/// Claude hook command string: `"<exe>" hook claude` (the exe is quoted to allow spaces in the path).
fn claude_command(exe: &str) -> String {
    format!("\"{exe}\" hook claude")
}

/// Whether a hook group is one we wrote (its inner command contains CLAUDE_SIG).
fn is_lidless_group(group: &Value) -> bool {
    group
        .get("hooks")
        .and_then(Value::as_array)
        .map(|inner| {
            inner.iter().any(|h| {
                h.get("command")
                    .and_then(Value::as_str)
                    .map(|c| c.contains(CLAUDE_SIG))
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false)
}

/// Into a given event array: first drop the old lidless group, then append the new one.
fn upsert_event(hooks: &mut Map<String, Value>, event: &str, matcher: Option<&str>, command: &str) {
    let entry = hooks
        .entry(event.to_string())
        .or_insert_with(|| Value::Array(vec![]));
    if !entry.is_array() {
        *entry = Value::Array(vec![]);
    }
    let arr = entry.as_array_mut().unwrap();
    arr.retain(|g| !is_lidless_group(g));

    let mut group = Map::new();
    if let Some(m) = matcher {
        group.insert("matcher".into(), json!(m));
    }
    group.insert(
        "hooks".into(),
        json!([{ "type": "command", "command": command }]),
    );
    arr.push(Value::Object(group));
}

fn load_json_object(path: &PathBuf) -> Result<Map<String, Value>, String> {
    if !path.exists() {
        return Ok(Map::new());
    }
    let txt = std::fs::read_to_string(path).map_err(|e| format!("failed to read {path:?}: {e}"))?;
    if txt.trim().is_empty() {
        return Ok(Map::new());
    }
    match serde_json::from_str::<Value>(&txt) {
        Ok(Value::Object(m)) => Ok(m),
        Ok(_) => Err(format!("{path:?} is not a JSON object")),
        Err(e) => Err(format!("failed to parse {path:?}: {e}")),
    }
}

fn write_json_object(path: &PathBuf, obj: &Map<String, Value>) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("failed to create directory: {e}"))?;
    }
    let txt = serde_json::to_string_pretty(&Value::Object(obj.clone()))
        .map_err(|e| format!("failed to serialize: {e}"))?;
    std::fs::write(path, txt).map_err(|e| format!("failed to write {path:?}: {e}"))
}

fn install_claude() -> Result<(), String> {
    let exe = current_exe_string()?;
    let cmd = claude_command(&exe);
    let path = claude_settings_path()?;
    let mut root = load_json_object(&path)?;

    let hooks_entry = root
        .entry("hooks".to_string())
        .or_insert_with(|| Value::Object(Map::new()));
    if !hooks_entry.is_object() {
        return Err("the hooks field in settings.json is not an object; skipped to avoid corrupting the config".into());
    }
    let hooks = hooks_entry.as_object_mut().unwrap();

    // Refresh: on prompt submit + before each tool call (long-task safety net)
    upsert_event(hooks, "UserPromptSubmit", None, &cmd);
    upsert_event(hooks, "PreToolUse", Some("*"), &cmd);
    // Release: end of a turn (with grace) + session end (immediate)
    upsert_event(hooks, "Stop", None, &cmd);
    upsert_event(hooks, "SessionEnd", None, &cmd);

    write_json_object(&path, &root)
}

fn remove_claude() -> Result<(), String> {
    let path = claude_settings_path()?;
    if !path.exists() {
        return Ok(());
    }
    let mut root = load_json_object(&path)?;
    if let Some(hooks) = root.get_mut("hooks").and_then(Value::as_object_mut) {
        for (_event, arr) in hooks.iter_mut() {
            if let Some(list) = arr.as_array_mut() {
                list.retain(|g| !is_lidless_group(g));
            }
        }
        // Drop event keys that became empty
        let empty: Vec<String> = hooks
            .iter()
            .filter(|(_, v)| v.as_array().map(|a| a.is_empty()).unwrap_or(false))
            .map(|(k, _)| k.clone())
            .collect();
        for k in empty {
            hooks.remove(&k);
        }
    }
    write_json_object(&path, &root)
}

fn claude_installed() -> bool {
    let Ok(path) = claude_settings_path() else {
        return false;
    };
    let Ok(root) = load_json_object(&path) else {
        return false;
    };
    root.get("hooks")
        .and_then(Value::as_object)
        .map(|hooks| {
            hooks
                .values()
                .filter_map(Value::as_array)
                .flatten()
                .any(is_lidless_group)
        })
        .unwrap_or(false)
}

// ---------- Codex ----------

/// Whether the notify array is one we wrote (contains both "hook" and "codex").
fn is_lidless_notify(item: &toml_edit::Item) -> bool {
    let Some(arr) = item.as_array() else {
        return false;
    };
    let vals: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).collect();
    vals.contains(&"hook") && vals.contains(&"codex")
}

fn load_codex_doc(path: &PathBuf) -> Result<toml_edit::DocumentMut, String> {
    if !path.exists() {
        return Ok(toml_edit::DocumentMut::new());
    }
    std::fs::read_to_string(path)
        .map_err(|e| format!("failed to read {path:?}: {e}"))?
        .parse::<toml_edit::DocumentMut>()
        .map_err(|e| format!("failed to parse config.toml: {e}"))
}

fn install_codex() -> Result<(), String> {
    let exe = current_exe_string()?;
    let path = codex_config_path()?;
    let mut doc = load_codex_doc(&path)?;

    // Codex supports only one notify program; if one already exists and isn't
    // ours, don't overwrite it — ask the user to handle it manually.
    if let Some(item) = doc.get("notify") {
        if !is_lidless_notify(item) {
            return Err(
                "detected an existing custom notify config; Codex supports only one notify \
                 program, so please wire Lidless in manually or remove the existing config first."
                    .into(),
            );
        }
    }

    let mut arr = toml_edit::Array::new();
    arr.push(exe.as_str());
    arr.push("hook");
    arr.push("codex");
    doc["notify"] = toml_edit::value(arr);

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("failed to create directory: {e}"))?;
    }
    std::fs::write(&path, doc.to_string()).map_err(|e| format!("failed to write {path:?}: {e}"))
}

fn remove_codex() -> Result<(), String> {
    let path = codex_config_path()?;
    if !path.exists() {
        return Ok(());
    }
    let mut doc = load_codex_doc(&path)?;
    let is_ours = doc.get("notify").map(is_lidless_notify).unwrap_or(false);
    if is_ours {
        doc.remove("notify");
        std::fs::write(&path, doc.to_string()).map_err(|e| format!("failed to write {path:?}: {e}"))?;
    }
    Ok(())
}

fn codex_installed() -> bool {
    let Ok(path) = codex_config_path() else {
        return false;
    };
    let Ok(doc) = load_codex_doc(&path) else {
        return false;
    };
    doc.get("notify").map(is_lidless_notify).unwrap_or(false)
}

// ---------- Shared dispatch (reused by the Tauri commands and the CLI) ----------

/// Connect a given target: `"claude"` | `"codex"`.
pub(crate) fn install(target: &str) -> Result<(), String> {
    match target {
        "claude" => install_claude(),
        "codex" => install_codex(),
        other => Err(format!("unknown integration target: {other}")),
    }
}

/// Remove the integration for a given target.
pub(crate) fn remove(target: &str) -> Result<(), String> {
    match target {
        "claude" => remove_claude(),
        "codex" => remove_codex(),
        other => Err(format!("unknown integration target: {other}")),
    }
}

/// Whether (claude_code, codex) are connected.
pub(crate) fn status() -> (bool, bool) {
    (claude_installed(), codex_installed())
}

// ---------- Tauri commands ----------

#[derive(Serialize)]
pub struct IntegrationStatus {
    pub claude_code: bool,
    pub codex: bool,
}

#[tauri::command]
pub fn integration_status() -> IntegrationStatus {
    let (claude_code, codex) = status();
    IntegrationStatus { claude_code, codex }
}

#[tauri::command]
pub fn install_integration(target: String) -> Result<(), String> {
    install(&target)
}

#[tauri::command]
pub fn remove_integration(target: String) -> Result<(), String> {
    remove(&target)
}
