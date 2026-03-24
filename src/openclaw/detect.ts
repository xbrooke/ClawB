import { invoke } from "@tauri-apps/api/core";
import { getOpenClawHome, getOpenClawConfigPath, getGatewayLogPath } from "./platform";

export interface OpenClawStatus {
  installed: boolean;
  version: string | null;
  path: string | null;
  gatewayRunning: boolean;
  gatewayPid: number | null;
}

export interface NodeStatus {
  installed: boolean;
  version: string | null;
  path: string | null;
}

export async function detectOpenClaw(): Promise<OpenClawStatus> {
  try {
    const info = await invoke<{ installed: boolean; version: string | null; path: string | null }>("get_openclaw_info");
    const gateway = await invoke<{ running: boolean; pid: number | null }>("get_gateway_status");

    return {
      installed: info.installed,
      version: info.version,
      path: info.path,
      gatewayRunning: gateway.running,
      gatewayPid: gateway.pid,
    };
  } catch {
    return {
      installed: false,
      version: null,
      path: null,
      gatewayRunning: false,
      gatewayPid: null,
    };
  }
}

export async function detectNode(): Promise<NodeStatus> {
  try {
    const result = await invoke<string | null>("get_node_info");
    if (result) {
      return { installed: true, version: result, path: null };
    }
    return { installed: false, version: null, path: null };
  } catch {
    return { installed: false, version: null, path: null };
  }
}

export async function checkOpenClawInstalled(): Promise<boolean> {
  try {
    return await invoke<boolean>("check_openclaw_installed");
  } catch {
    return false;
  }
}

export async function checkGatewayRunning(): Promise<boolean> {
  try {
    const status = await invoke<{ running: boolean }>("get_gateway_status");
    return status.running;
  } catch {
    return false;
  }
}

// Re-export path utilities from platform module for backwards compatibility
export { getOpenClawHome, getOpenClawConfigPath, getGatewayLogPath };
