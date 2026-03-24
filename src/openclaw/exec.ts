import { invoke } from "@tauri-apps/api/core";
import { platform } from "./platform";

export interface ExecResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function runCommand(command: string): Promise<ExecResult> {
  try {
    const output = await invoke<string>("run_shell_command", { command });
    return { success: true, output };
  } catch (e) {
    return { success: false, output: "", error: String(e) };
  }
}

export async function getCommandPath(cmd: string): Promise<string | null> {
  try {
    return await invoke<string | null>("get_command_path", { command: cmd });
  } catch {
    return null;
  }
}

export function buildShellCommand(innerCmd: string): string {
  if (platform.isWindows) {
    const pathPrefix = platform.nodePaths.map(p => `set "PATH=${p};%PATH%"`).join(" && ");
    return `${pathPrefix} && ${innerCmd}`;
  } else {
    const pathStr = platform.nodePaths.join(":");
    return `export PATH="${pathStr}:$PATH" && ${innerCmd}`;
  }
}
