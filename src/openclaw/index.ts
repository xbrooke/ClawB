import { invoke } from "@tauri-apps/api/core";
import type { AppState, ServiceStatus, PreparationResult } from "./types";

export type { AppState, ServiceStatus, PreparationResult } from "./types";

export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    const [gatewayStatus, openclawInfo, nodeInfo] = await Promise.all([
      invoke<{ running: boolean; pid: number | null; message: string }>("get_gateway_status"),
      invoke<{ installed: boolean; version: string | null; path: string | null }>("get_openclaw_info"),
      invoke<{ installed: boolean; version: string | null; path: string | null }>("get_node_info"),
    ]);

    const openclawInstalled = openclawInfo.installed && !!openclawInfo.version;
    const gatewayRunning = gatewayStatus.running;

    let state: AppState = "NOT_READY";
    if (openclawInstalled && gatewayRunning) {
      state = "RUNNING";
    } else if (openclawInstalled) {
      state = "READY";
    }

    return {
      state,
      openclawInstalled,
      openclawVersion: openclawInfo.version,
      gatewayRunning,
      gatewayPid: gatewayStatus.pid,
      nodeInstalled: nodeInfo.installed,
      nodeVersion: nodeInfo.version,
    };
  } catch (e) {
    return {
      state: "NOT_READY",
      openclawInstalled: false,
      openclawVersion: null,
      gatewayRunning: false,
      gatewayPid: null,
      nodeInstalled: false,
      nodeVersion: null,
    };
  }
}

export async function prepareEnvironment(
  onLog?: (log: string) => void
): Promise<PreparationResult> {
  const logs: string[] = [];

  const addLog = (log: string) => {
    logs.push(log);
    onLog?.(log);
  };

  try {
    addLog("开始准备环境...");

    const status = await getServiceStatus();

    if (status.state === "RUNNING") {
      addLog("服务已运行");
      return { success: true, state: status.state, message: "服务已运行", logs };
    }

    if (!status.openclawInstalled) {
      addLog("正在安装 OpenClaw CLI...");
      const installResult = await invoke<{ success: boolean; message: string }>("install_openclaw_full");
      if (!installResult.success) {
        addLog(`安装失败: ${installResult.message}`);
        return { success: false, state: "NOT_READY", message: installResult.message, logs };
      }
      addLog("OpenClaw CLI 安装完成");
    }

    if (!status.gatewayRunning) {
      addLog("正在启动 Gateway...");
      const startResult = await invoke<{ success: boolean; message: string }>("start_gateway");
      if (!startResult.success) {
        addLog(`启动失败: ${startResult.message}`);
        return { success: false, state: "READY", message: startResult.message, logs };
      }
      addLog("Gateway 启动成功");
    }

    const finalStatus = await getServiceStatus();
    addLog(`当前状态: ${finalStatus.state}`);
    return { success: true, state: finalStatus.state, message: "环境准备完成", logs };

  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    addLog(`错误: ${errorMsg}`);
    return { success: false, state: "NOT_READY", message: errorMsg, logs };
  }
}

export async function startService(): Promise<{ success: boolean; message: string }> {
  return invoke<{ success: boolean; message: string }>("start_gateway");
}

export async function stopService(): Promise<{ success: boolean; message: string }> {
  return invoke<{ success: boolean; message: string }>("stop_gateway");
}

export async function restartService(): Promise<{ success: boolean; message: string }> {
  return invoke<{ success: boolean; message: string }>("restart_gateway");
}

export async function uninstallOpenClaw(): Promise<{ success: boolean; message: string }> {
  return invoke<{ success: boolean; message: string }>("uninstall_openclaw");
}

export async function updateOpenClaw(): Promise<{ success: boolean; message: string }> {
  return invoke<{ success: boolean; message: string }>("update_openclaw");
}

export async function checkOpenclawInstalled(): Promise<boolean> {
  try {
    const info = await invoke<{ installed: boolean; version: string | null }>("check_openclaw_installed");
    return info.installed;
  } catch {
    return false;
  }
}