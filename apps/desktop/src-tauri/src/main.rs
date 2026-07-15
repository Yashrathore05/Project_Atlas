#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use serde::{Deserialize, Serialize};
use std::path::{Component, Path, PathBuf};
use std::process::Command;

#[derive(Debug, Deserialize)]
struct TerminalPayload {
  command: String,
  args: Option<Vec<String>>,
  cwd: Option<String>,
}

#[derive(Debug, Serialize)]
struct ToolResponse {
  output: String,
}

fn workspace_root() -> Result<PathBuf, String> {
  let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
  manifest_dir
    .parent()
    .and_then(Path::parent)
    .and_then(Path::parent)
    .map(Path::to_path_buf)
    .ok_or_else(|| "Unable to resolve workspace root".to_string())
}

fn resolve_workspace_path(input: &str) -> Result<PathBuf, String> {
  let root = workspace_root()?;
  let requested = Path::new(input);
  if requested.is_absolute()
    || requested
      .components()
      .any(|component| matches!(component, Component::ParentDir | Component::Prefix(_)))
  {
    return Err(format!("Path escapes workspace root: {input}"));
  }

  let resolved = root.join(requested);

  if resolved != root && !resolved.starts_with(&root) {
    return Err(format!("Path escapes workspace root: {input}"));
  }

  Ok(resolved)
}

#[tauri::command]
fn atlas_read_file(path: String) -> Result<ToolResponse, String> {
  let resolved = resolve_workspace_path(&path)?;
  let output = std::fs::read_to_string(resolved).map_err(|err| err.to_string())?;
  Ok(ToolResponse { output })
}

#[tauri::command]
fn atlas_write_file(path: String, content: String) -> Result<ToolResponse, String> {
  let resolved = resolve_workspace_path(&path)?;
  if let Some(parent) = resolved.parent() {
    std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
  }
  std::fs::write(&resolved, content.as_bytes()).map_err(|err| err.to_string())?;
  Ok(ToolResponse {
    output: format!("Wrote {} bytes to {}", content.as_bytes().len(), resolved.display()),
  })
}

#[tauri::command]
fn atlas_terminal_execute(payload: TerminalPayload) -> Result<ToolResponse, String> {
  let cwd = match payload.cwd {
    Some(path) => resolve_workspace_path(&path)?,
    None => workspace_root()?,
  };

  let output = Command::new(&payload.command)
    .args(payload.args.unwrap_or_default())
    .current_dir(cwd)
    .output()
    .map_err(|err| err.to_string())?;

  let mut text = String::new();
  text.push_str(&String::from_utf8_lossy(&output.stdout));
  text.push_str(&String::from_utf8_lossy(&output.stderr));

  if !output.status.success() {
    return Err(format!(
      "Command exited with status {}: {}",
      output.status,
      text
    ));
  }

  Ok(ToolResponse { output: text })
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      atlas_read_file,
      atlas_write_file,
      atlas_terminal_execute
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
