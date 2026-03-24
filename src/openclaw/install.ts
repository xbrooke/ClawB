import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface InstallProgress {
  stage: "detecting" | "node" | "openclaw" | "gateway" | "done" | "error";
  message: string;
  progress?: number;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  stages: InstallProgress[];
}

type ProgressCallback = (progress: InstallProgress) => void;

let installProgressCallback: ProgressCallback | null = null;
let unlistenOutput: UnlistenFn | null = null;
let unlistenDone: UnlistenFn | null = null;

export function setInstallProgressCallback(cb: ProgressCallback) {
  installProgressCallback = cb;
}

function emitProgress(progress: InstallProgress) {
  installProgressCallback?.(progress);
}

async function setupEventListeners(): Promise<void> {
  unlistenOutput = await listen<string>("install-output", (event) => {
    emitProgress({
      stage: "openclaw",
      message: event.payload,
      progress: undefined,
    });
  });

  unlistenDone = await listen<string>("install-done", (event) => {
    if (event.payload === "success") {
      emitProgress({ stage: "done", message: "安装完成", progress: 100 });
    } else {
      emitProgress({ stage: "error", message: "安装失败", progress: 0 });
    }
    cleanup();
  });
}

function cleanup() {
  unlistenOutput?.();
  unlistenDone?.();
  unlistenOutput = null;
  unlistenDone = null;
}

export async function installOpenClaw(): Promise<InstallResult> {
  const stages: InstallProgress[] = [];
  let success = true;
  let error: string | undefined;

  emitProgress({ stage: "detecting", message: "检测环境...", progress: 10 });

  try {
    emitProgress({ stage: "node", message: "检测 Node.js...", progress: 20 });

    emitProgress({ stage: "openclaw", message: "正在安装 OpenClaw...", progress: 40 });

    await setupEventListeners();

    await invoke("install_openclaw_full");

  } catch (e) {
    success = false;
    error = String(e);
    emitProgress({ stage: "error", message: error, progress: 0 });
  }

  return { success, error, stages };
}

export async function updateOpenClaw(): Promise<InstallResult> {
  try {
    await invoke("update_openclaw");
    return { success: true, stages: [{ stage: "done", message: "更新完成", progress: 100 }] };
  } catch (e) {
    return { success: false, error: String(e), stages: [] };
  }
}

export async function uninstallOpenClaw(): Promise<InstallResult> {
  try {
    await invoke("uninstall_openclaw");
    return { success: true, stages: [] };
  } catch (e) {
    return { success: false, error: String(e), stages: [] };
  }
}

export async function checkOpenClawVersion(): Promise<string | null> {
  try {
    return await invoke<string>("check_openclaw_version");
  } catch {
    return null;
  }
}
