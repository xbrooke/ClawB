import { spawn, ChildProcess } from 'child_process';
import os from 'os';
import { runCommand } from './cli';

let gatewayProcess: ChildProcess | null = null;

export interface GatewayStatus {
  running: boolean;
  pid: number | null;
  message: string;
}

export interface GatewayResult {
  success: boolean;
  message: string;
}

export async function start(): Promise<GatewayResult> {
  if (gatewayProcess) {
    return { success: true, message: 'Gateway already running' };
  }

  try {
    gatewayProcess = spawn('openclaw', ['gateway', 'start'], {
      shell: true,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    gatewayProcess.on('error', (err) => {
      gatewayProcess = null;
    });

    gatewayProcess.on('close', () => {
      gatewayProcess = null;
    });

    return { success: true, message: 'Gateway starting...' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function stop(): Promise<GatewayResult> {
  if (!gatewayProcess) {
    return { success: false, message: 'Gateway not running' };
  }

  try {
    if (process.platform === 'win32') {
      await runCommand('taskkill', ['/pid', String(gatewayProcess.pid), '/f', '/t']);
    } else {
      gatewayProcess.kill('SIGTERM');
    }
    gatewayProcess = null;
    return { success: true, message: 'Gateway stopped' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function restart(): Promise<GatewayResult> {
  await stop();
  await new Promise((r) => setTimeout(r, 500));
  return start();
}

export function getStatus(): GatewayStatus {
  if (gatewayProcess && gatewayProcess.pid) {
    try {
      if (process.platform === 'win32') {
        return {
          running: true,
          pid: gatewayProcess.pid,
          message: 'Running',
        };
      }
      process.kill(gatewayProcess.pid, 0);
      return {
        running: true,
        pid: gatewayProcess.pid,
        message: 'Running',
      };
    } catch {
      gatewayProcess = null;
    }
  }
  return {
    running: false,
    pid: null,
    message: 'Not running',
  };
}

export function getProcess(): ChildProcess | null {
  return gatewayProcess;
}