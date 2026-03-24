/**
 * OpenClaw Install Module
 * Complete installation flow: detect → install → onboard → gateway
 */

import { invoke } from "@tauri-apps/api/core";
import { platform } from "./platform";
import { InstallState, detect } from "./detect";


// Progress callback type
export type ProgressCallback = (stage: InstallStage, message: string, progress?: number) => void;

export enum InstallStage {
  DETECTING = "detecting",
  INSTALLING = "installing",
  ONBOARDING = "onboarding",
  STARTING_GATEWAY = "starting_gateway",
  DONE = "done",
  ERROR = "error",
}

export interface InstallResult {
  success: boolean;
  state: InstallState;
  message?: string;
  error?: string;
}

// Default progress callback
function defaultProgress(stage: InstallStage, message: string): void {
  console.log(`[${stage}] ${message}`);
}

// Install OpenClaw
export async function installOpenClaw(progress?: ProgressCallback): Promise<InstallResult> {
  const cb = progress || defaultProgress;

  try {
    // Stage 1: Detect current state
    cb(InstallStage.DETECTING, "检测当前环境...");
    const result = await detect();

    if (result.state === InstallState.READY) {
      return { success: true, state: result.state, message: "OpenClaw 已安装并可正常使用" };
    }

    // Stage 2: Install OpenClaw if needed
    if (!result.openclaw.exists) {
      cb(InstallStage.INSTALLING, "正在安装 OpenClaw...");

      if (platform.isWindows) {
        // Windows: Use standalone installer via Tauri command
        await invoke("install_openclaw_full");
      } else {
        // macOS/Linux: Use npm via Tauri command
        await invoke("run_shell_command", {
          command: "npm install -g openclaw --registry https://registry.npmmirror.com",
        });
      }
      cb(InstallStage.INSTALLING, "OpenClaw 安装完成");
    }

    // Stage 3: Onboard if needed
    if (!result.openclaw.hasConfig) {
      cb(InstallStage.ONBOARDING, "正在初始化 OpenClaw...");
      const onboardResult = await onboardOpenClaw(cb);
      if (!onboardResult.success) {
        return onboardResult;
      }
      cb(InstallStage.ONBOARDING, "OpenClaw 初始化完成");
    }

    // Stage 4: Start Gateway
    cb(InstallStage.STARTING_GATEWAY, "正在启动 Gateway...");
    const gatewayResult = await startGatewayService();
    if (!gatewayResult.success) {
      return { success: false, state: InstallState.INSTALLED, error: gatewayResult.error };
    }
    cb(InstallStage.STARTING_GATEWAY, "Gateway 启动完成");

    cb(InstallStage.DONE, "安装完成！");
    return { success: true, state: InstallState.READY, message: "安装完成" };
  } catch (e) {
    cb(InstallStage.ERROR, `安装过程出错: ${e}`);
    return { success: false, state: InstallState.UNKNOWN, error: String(e) };
  }
}

// Onboard OpenClaw
export async function onboardOpenClaw(progress?: ProgressCallback): Promise<InstallResult> {
  const cb = progress || defaultProgress;

  try {
    cb(InstallStage.ONBOARDING, "执行 openclaw onboard...");

    // Try Tauri command first
    try {
      await invoke("run_onboard");
      cb(InstallStage.ONBOARDING, "初始化配置完成");
      return { success: true, state: InstallState.INSTALLED };
    } catch {
      // Fallback: try direct command via Tauri
    }

    const cmd = platform.isWindows
      ? "cmd /C openclaw onboard --install-daemon"
      : "bash -c 'openclaw onboard --install-daemon'";

    const shellResult = await invoke<{ success: boolean; output?: string; error?: string }>(
      "run_shell_command",
      { command: cmd }
    );

    if (!shellResult.success) {
      cb(InstallStage.ERROR, `初始化失败: ${shellResult.error}`);
      return { success: false, state: InstallState.INSTALLED, error: shellResult.error };
    }
    return { success: true, state: InstallState.INSTALLED };
  } catch (e) {
    return { success: false, state: InstallState.INSTALLED, error: String(e) };
  }
}

// Start Gateway service
export async function startGatewayService(): Promise<InstallResult> {
  const status = await invoke<{ running: boolean }>("get_gateway_status");
  if (status.running) {
    return { success: true, state: InstallState.READY, message: "Gateway 已在运行" };
  }

  await invoke("install_gateway");
  await invoke("start_gateway");
  return { success: true, state: InstallState.READY, message: "Gateway 启动成功" };
}

// Stop Gateway service
export async function stopGatewayService(): Promise<InstallResult> {
  try {
    await invoke("stop_gateway");
    return { success: true, state: InstallState.READY, message: "Gateway 已停止" };
  } catch (e) {
    return { success: false, state: InstallState.READY, error: String(e) };
  }
}

// Restart Gateway service
export async function restartGatewayService(): Promise<InstallResult> {
  try {
    await invoke("restart_gateway");
    return { success: true, state: InstallState.READY, message: "Gateway 重启成功" };
  } catch (e) {
    return { success: false, state: InstallState.READY, error: String(e) };
  }
}

// Full setup: install + onboard + start gateway
export async function setupOpenClaw(progress?: ProgressCallback): Promise<InstallResult> {
  return await installOpenClaw(progress);
}

// Check what actions are needed
export async function getRequiredActions(): Promise<{
  needsInstall: boolean;
  needsOnboard: boolean;
  needsStartGateway: boolean;
  isReady: boolean;
  issues: string[];
}> {
  const result = await detect();

  const issues: string[] = [];

  if (!result.node.exists) {
    issues.push("Node.js 未安装");
  }

  if (!result.openclaw.exists) {
    issues.push("OpenClaw 未安装");
  }

  if (result.openclaw.exists && !result.openclaw.hasConfig) {
    issues.push("OpenClaw 未初始化");
  }

  if (!result.gateway.running) {
    issues.push("Gateway 未运行");
  }

  return {
    needsInstall: !result.openclaw.exists,
    needsOnboard: result.openclaw.exists && !result.openclaw.hasConfig,
    needsStartGateway: result.openclaw.exists && result.openclaw.hasConfig && !result.gateway.running,
    isReady: result.state === InstallState.READY,
    issues,
  };
}

// Quick status check
export async function quickStatus(): Promise<{
  ready: boolean;
  message: string;
}> {
  const result = await detect();

  switch (result.state) {
    case InstallState.READY:
      return { ready: true, message: "就绪" };
    case InstallState.NOT_INSTALLED:
      return { ready: false, message: "未安装" };
    case InstallState.CONFIG_MISSING:
      return { ready: false, message: "需要初始化" };
    case InstallState.INSTALLED:
      return { ready: false, message: "Gateway 未运行" };
    default:
      return { ready: false, message: "状态未知" };
  }
}
