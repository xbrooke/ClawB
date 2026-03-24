/**
 * OpenClaw Detection Module
 * Detects Node.js and OpenClaw installation status
 */

import { invoke } from "@tauri-apps/api/core";
import { platform } from "./platform";

// Detection state machine
export enum InstallState {
  NOT_INSTALLED = "NOT_INSTALLED",
  INSTALLED = "INSTALLED",
  CONFIG_MISSING = "CONFIG_MISSING",
  READY = "READY",
  UNKNOWN = "UNKNOWN",
}

export interface DetectionResult {
  state: InstallState;
  node: NodeDetection;
  openclaw: OpenClawDetection;
  gateway: GatewayDetection;
}

export interface NodeDetection {
  exists: boolean;
  version: string | null;
  path: string | null;
}

export interface OpenClawDetection {
  exists: boolean;
  version: string | null;
  path: string | null;
  hasConfig: boolean;
}

export interface GatewayDetection {
  running: boolean;
  pid: number | null;
  port: number | null;
}

// Detect Node.js
export async function detectNode(): Promise<NodeDetection> {
  try {
    const result = await invoke<{ installed: boolean; version: string | null; path: string | null }>(
      "check_openclaw_installed"
    );
    return {
      exists: result.installed,
      version: result.version,
      path: result.path,
    };
  } catch {
    // Fallback: try direct command
    try {
      const output = await invoke<string>("run_shell_command", {
        command: platform.isWindows ? "node --version 2>NUL" : "node --version 2>/dev/null",
      });
      const version = output.trim().replace(/^v/, "");
      return {
        exists: !!version,
        version,
        path: platform.isWindows ? "C:\\Program Files\\nodejs" : "/usr/local/bin/node",
      };
    } catch {
      return { exists: false, version: null, path: null };
    }
  }
}

// Detect OpenClaw
export async function detectOpenClaw(): Promise<OpenClawDetection> {
  try {
    const result = await invoke<{ installed: boolean; version: string | null; path: string | null }>(
      "get_openclaw_info"
    );
    
    // Check if config exists
    let hasConfig = false;
    try {
      await invoke<string>("read_openclaw_config");
      hasConfig = true;
    } catch {
      hasConfig = false;
    }

    return {
      exists: result.installed,
      version: result.version,
      path: result.path,
      hasConfig,
    };
  } catch {
    return { exists: false, version: null, path: null, hasConfig: false };
  }
}

// Detect Gateway
export async function detectGateway(): Promise<GatewayDetection> {
  try {
    const result = await invoke<{ running: boolean; pid: number | null }>("get_gateway_status");
    return {
      running: result.running,
      pid: result.pid,
      port: null,
    };
  } catch {
    return { running: false, pid: null, port: null };
  }
}

// Full detection with state machine
export async function detect(): Promise<DetectionResult> {
  const [node, openclaw, gateway] = await Promise.all([
    detectNode(),
    detectOpenClaw(),
    detectGateway(),
  ]);

  let state: InstallState;

  if (!node.exists) {
    state = InstallState.NOT_INSTALLED;
  } else if (!openclaw.exists) {
    state = InstallState.NOT_INSTALLED;
  } else if (!openclaw.hasConfig) {
    state = InstallState.CONFIG_MISSING;
  } else if (!gateway.running) {
    state = InstallState.INSTALLED;
  } else {
    state = InstallState.READY;
  }

  return { state, node, openclaw, gateway };
}

// Check if Node.js is installed
export async function isNodeInstalled(): Promise<boolean> {
  const node = await detectNode();
  return node.exists;
}

// Check if OpenClaw is installed
export async function isOpenClawInstalled(): Promise<boolean> {
  const openclaw = await detectOpenClaw();
  return openclaw.exists;
}

// Check if OpenClaw config exists
export async function hasOpenClawConfig(): Promise<boolean> {
  const openclaw = await detectOpenClaw();
  return openclaw.hasConfig;
}

// Check if Gateway is running
export async function isGatewayRunning(): Promise<boolean> {
  const gateway = await detectGateway();
  return gateway.running;
}

// Get detailed status
export async function getDetailedStatus(): Promise<{
  canInstall: boolean;
  canOnboard: boolean;
  canStartGateway: boolean;
  issues: string[];
}> {
  const result = await detect();
  const issues: string[] = [];

  if (!result.node.exists) {
    issues.push("Node.js 未安装");
  }

  if (!result.openclaw.exists) {
    issues.push("OpenClaw 未安装");
  } else if (!result.openclaw.hasConfig) {
    issues.push("OpenClaw 配置缺失，需要初始化");
  }

  if (result.gateway.running) {
    issues.push("Gateway 已在运行");
  }

  return {
    canInstall: !result.openclaw.exists,
    canOnboard: result.openclaw.exists && !result.openclaw.hasConfig,
    canStartGateway: result.openclaw.exists && result.openclaw.hasConfig && !result.gateway.running,
    issues,
  };
}
