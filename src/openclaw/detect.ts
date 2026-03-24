/**
 * OpenClaw Detection Module - Simplified
 * Basic detection without complex state machine
 */

import { invoke } from "@tauri-apps/api/core";

export enum InstallState {
  UNKNOWN = "UNKNOWN",
  NOT_INSTALLED = "NOT_INSTALLED",
  INSTALLED = "INSTALLED",
  READY = "READY",
}

export interface DetectionResult {
  state: InstallState;
  node: {
    exists: boolean;
    version: string | null;
  };
  openclaw: {
    exists: boolean;
    version: string | null;
  };
  gateway: {
    running: boolean;
    pid: number | null;
  };
}

// Simple detection
export async function detect(): Promise<DetectionResult> {
  try {
    const [nodeResult, openclawResult, gatewayResult] = await Promise.all([
      invoke<{ installed: boolean; version: string | null }>("check_openclaw_installed"),
      invoke<{ installed: boolean; version: string | null }>("get_openclaw_info"),
      invoke<{ running: boolean; pid: number | null }>("get_gateway_status"),
    ]);

    const state = !nodeResult.installed || !openclawResult.installed
      ? InstallState.NOT_INSTALLED
      : gatewayResult.running
        ? InstallState.READY
        : InstallState.INSTALLED;

    return {
      state,
      node: {
        exists: nodeResult.installed,
        version: nodeResult.version,
      },
      openclaw: {
        exists: openclawResult.installed,
        version: openclawResult.version,
      },
      gateway: {
        running: gatewayResult.running,
        pid: gatewayResult.pid,
      },
    };
  } catch {
    return {
      state: InstallState.UNKNOWN,
      node: { exists: false, version: null },
      openclaw: { exists: false, version: null },
      gateway: { running: false, pid: null },
    };
  }
}

// Quick check if ready
export async function isReady(): Promise<boolean> {
  const result = await detect();
  return result.state === InstallState.READY;
}
