import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import os from 'os';

export interface CommandResult {
  success: boolean;
  message: string;
  stdout?: string;
  stderr?: string;
}

export interface CommandOptions {
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

function getOpenclawCommand(): { cmd: string; args: string[] } {
  if (process.platform === 'win32') {
    return { cmd: 'cmd', args: ['/c'] };
  }
  return { cmd: '/bin/sh', args: ['-c'] };
}

export async function runCommand(
  command: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      stdout += text;
      options.onStdout?.(text);
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      stderr += text;
      options.onStderr?.(text);
    });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        message: code === 0 ? 'Success' : `Exit code: ${code}`,
        stdout,
        stderr,
      });
    });

    proc.on('error', (err) => {
      resolve({
        success: false,
        message: err.message,
        stdout,
        stderr,
      });
    });
  });
}

export async function checkCommandExists(command: string): Promise<boolean> {
  const { cmd, args } = getOpenclawCommand();
  const checkCmd = process.platform === 'win32'
    ? `where ${command} 2>NUL`
    : `which ${command} 2>/dev/null`;

  const result = await runCommand(cmd, [...args, checkCmd]);
  return result.success && result.stdout.trim().length > 0;
}

export async function getNodeVersion(): Promise<string | null> {
  const result = await runCommand('node', ['--version']);
  if (result.success) {
    return result.stdout.trim().replace('v', '');
  }
  return null;
}

export async function getOpenclawVersion(): Promise<string | null> {
  const result = await runCommand('openclaw', ['--version']);
  if (result.success) {
    const match = result.stdout.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  }
  return null;
}