import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface GatewayStatus {
  running: boolean;
  pid: number | null;
  message: string;
}

export async function getGatewayStatus(): Promise<GatewayStatus> {
  try {
    return await invoke<GatewayStatus>("get_gateway_status");
  } catch (e) {
    return { running: false, pid: null, message: String(e) };
  }
}

export async function startGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("start_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function stopGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("stop_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function installGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("install_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function uninstallGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("uninstall_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function restartGateway(): Promise<{ success: boolean; error?: string }> {
  try {
    await invoke("restart_gateway");
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function listenGatewayOutput(
  callback: (line: string) => void
): Promise<UnlistenFn> {
  return listen<string>("gateway-output", (event) => {
    callback(event.payload);
  });
}

export async function listenGatewayStatus(
  callback: (status: GatewayStatus) => void
): Promise<UnlistenFn> {
  return listen<GatewayStatus>("gateway-status", (event) => {
    callback(event.payload);
  });
}

export function buildGatewayCommand(action: "start" | "stop" | "restart" | "install" | "uninstall"): string {
  switch (action) {
    case "start":
      return `openclaw gateway start`;
    case "stop":
      return `openclaw gateway stop`;
    case "restart":
      return `openclaw gateway restart`;
    case "install":
      return `openclaw gateway install`;
    case "uninstall":
      return `openclaw gateway uninstall`;
  }
}
