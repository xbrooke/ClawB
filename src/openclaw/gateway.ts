/**
 * Gateway Management Module
 * Handles Gateway lifecycle: install, start, stop, restart, status
 */

import { invoke } from "@tauri-apps/api/core";

export interface GatewayStatus {
  running: boolean;
  pid: number | null;
  message: string;
  port?: number | null;
  version?: string | null;
}

export interface GatewayResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Get Gateway status
export async function getGatewayStatus(): Promise<GatewayStatus> {
  try {
    const result = await invoke<GatewayStatus>("get_gateway_status");
    return result;
  } catch (e) {
    return {
      running: false,
      pid: null,
      message: String(e),
      port: null,
      version: null,
    };
  }
}

// Check if Gateway is running (re-exported from detect.ts)

// Start Gateway
export async function startGateway(): Promise<GatewayResult> {
  try {
    await invoke("start_gateway");
    return { success: true, message: "Gateway 启动成功" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Stop Gateway
export async function stopGateway(): Promise<GatewayResult> {
  try {
    await invoke("stop_gateway");
    return { success: true, message: "Gateway 已停止" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Restart Gateway
export async function restartGateway(): Promise<GatewayResult> {
  try {
    await invoke("restart_gateway");
    return { success: true, message: "Gateway 重启成功" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Install Gateway service
export async function installGatewayService(): Promise<GatewayResult> {
  try {
    await invoke("install_gateway");
    return { success: true, message: "Gateway 服务安装成功" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Uninstall Gateway service
export async function uninstallGatewayService(): Promise<GatewayResult> {
  try {
    await invoke("uninstall_gateway");
    return { success: true, message: "Gateway 服务已卸载" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// Get Gateway health
export async function getGatewayHealth(): Promise<{ healthy: boolean; latency?: number }> {
  try {
    const result = await invoke<{ healthy: boolean; latency?: number }>("gateway_health");
    return result;
  } catch {
    return { healthy: false };
  }
}

// Wait for Gateway to be ready
export async function waitForGateway(timeout: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const status = await getGatewayStatus();
    if (status.running) {
      return true;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

// Stream Gateway logs
export async function streamGatewayLogs(
  onLine: (line: string) => void
): Promise<() => void> {
  const unlisten = await invoke<() => void>("listen_gateway_logs", {
    callback: (line: string) => {
      onLine(line);
    },
  });
  return unlisten;
}
