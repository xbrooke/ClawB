/**
 * Command Execution Module
 * Promise-based command execution with streaming output support
 */

import { invoke } from "@tauri-apps/api/core";
import { platform } from "./platform";

export interface ExecOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
}

export interface ExecResult {
  success: boolean;
  output: string;
  error?: string;
  code?: number;
}

export interface StreamLine {
  type: "stdout" | "stderr" | "error";
  data: string;
}

// Build platform-specific command
function buildCommand(innerCmd: string): string {
  if (platform.isWindows) {
    // Windows: ensure PATH includes Node.js location
    const pathAdditions = [
      "C:\\Program Files\\nodejs",
      "C:\\Program Files (x86)\\nodejs",
      `${process.env.LOCALAPPDATA || ""}\\Programs\\nodejs`,
    ].filter(Boolean).join(";");

    return `set "PATH=${pathAdditions};%PATH%" && ${innerCmd}`;
  } else {
    // macOS/Linux
    const pathAdditions = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"].join(":");
    return `export PATH="${pathAdditions}:$PATH" && ${innerCmd}`;
  }
}

// Execute command and return result
export async function exec(command: string, options?: ExecOptions): Promise<ExecResult> {
  const timeout = options?.timeout || 300000; // 5 min default

  try {
    const wrappedCmd = buildCommand(command);
    const output = await invoke<string>("run_shell_command", {
      command: wrappedCmd,
      timeout: String(timeout),
    });

    return {
      success: true,
      output: output || "",
    };
  } catch (e) {
    return {
      success: false,
      output: "",
      error: String(e),
    };
  }
}

// Execute command with real-time output callback
export async function execStream(
  command: string,
  _onLine: (line: string) => void,
  _options?: ExecOptions
): Promise<ExecResult> {
  const wrappedCmd = buildCommand(command);

  try {
    await invoke("run_shell_command", { command: wrappedCmd });
    return { success: true, output: "" };
  } catch (e) {
    return { success: false, output: "", error: String(e) };
  }
}

// Get command path
export async function which(cmd: string): Promise<string | null> {
  try {
    const result = await invoke<string | null>("get_command_path", { command: cmd });
    return result;
  } catch {
    return null;
  }
}

// Check if command exists
export async function exists(cmd: string): Promise<boolean> {
  const path = await which(cmd);
  return path !== null;
}

// Get platform info for commands
export function getCommandPrefix(): string {
  if (platform.isWindows) {
    return "cmd /C";
  }
  return "bash -c";
}

// Build a shell command string
export function sh(cmd: string): string {
  if (platform.isWindows) {
    return `cmd /C ${cmd}`;
  }
  return `bash -c '${cmd.replace(/'/g, "'\\''")}'`;
}

// Run multiple commands in sequence
export async function sequence(
  commands: string[],
  onLine?: (line: string, index: number) => void
): Promise<ExecResult[]> {
  const results: ExecResult[] = [];

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    if (onLine) {
      onLine(`[${i + 1}/${commands.length}] ${cmd}`, i);
    }
    const result = await exec(cmd);
    results.push(result);
    if (!result.success && result.error) {
      break; // Stop on error
    }
  }

  return results;
}

// Run npm install globally
export async function npmInstallGlobal(packageName: string): Promise<ExecResult> {
  const npmCmd = platform.isWindows ? "npm.cmd" : "npm";
  const registry = "--registry https://registry.npmmirror.com";
  return exec(`${npmCmd} install -g ${packageName} ${registry}`);
}

// Run OpenClaw commands
export async function openclawCmd(args: string): Promise<ExecResult> {
  return exec(`openclaw ${args}`);
}
