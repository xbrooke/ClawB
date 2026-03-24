/**
 * Gateway Management - Simple wrapper around Tauri commands
 */

import { invoke } from "@tauri-apps/api/core";

export interface GatewayStatus {
  running: boolean;
  pid: number | null;
}

export async function getStatus(): Promise<GatewayStatus> {
  try {
    return await invoke<GatewayStatus>("get_gateway_status");
  } catch {
    return { running: false, pid: null };
  }
}

export async function isRunning(): Promise<boolean> {
  const status = await getStatus();
  return status.running;
}
