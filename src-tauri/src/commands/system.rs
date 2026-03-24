use tauri::command;

#[cfg(target_os = "windows")]
const CURRENT_PLATFORM: &str = "windows";

#[cfg(target_os = "macos")]
const CURRENT_PLATFORM: &str = "macos";

#[cfg(target_os = "linux")]
const CURRENT_PLATFORM: &str = "linux";

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
const CURRENT_PLATFORM: &str = "unknown";

#[derive(serde::Serialize)]
pub struct PlatformInfo {
    pub platform: String,
}

#[command]
pub fn get_platform() -> PlatformInfo {
    PlatformInfo {
        platform: CURRENT_PLATFORM.to_string(),
    }
}