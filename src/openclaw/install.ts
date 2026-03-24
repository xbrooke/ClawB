/**
 * OpenClaw Install Module - Simplified
 * User-driven installation flow with clear status
 */

import { invoke } from "@tauri-apps/api/core";
import { platform } from "./platform";

// Re-export for convenience
export { InstallState, detect } from "./detect";
export type { DetectionResult } from "./detect";

// Install OpenClaw via CLI
export async function installOpenClaw(): Promise<{ success: boolean; error?: string }> {
  try {
    // Use npx to install globally - works on both Windows and macOS
    await invoke("run_shell_command", {
      command: platform.isWindows
        ? "npm install -g openclaw --registry https://registry.npmmirror.com"
        : "npm install -g openclaw --registry https://registry.npmmirror.com",
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Initialize OpenClaw via onboard
export async function onboardOpenClaw(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("run_shell_command", {
      command: "openclaw onboard --install-daemon",
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Start Gateway
export async function startGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("start_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Stop Gateway
export async function stopGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("stop_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Restart Gateway
export async function restartGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("restart_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Install Gateway service
export async function installGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("install_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
