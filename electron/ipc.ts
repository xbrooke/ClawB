import { ipcMain, app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';

let gatewayProcess: ChildProcess | null = null;

function getConfigPath(): string {
  return join(os.homedir(), '.openclaw', 'openclaw.json');
}

async function ensureConfigDir(): Promise<void> {
  const configDir = join(os.homedir(), '.openclaw');
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

async function runCommand(command: string, args: string[] = []): Promise<{ success: boolean; message: string; stdout?: string; stderr?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      resolve({ success: code === 0, message: code === 0 ? 'Success' : `Exit code: ${code}`, stdout, stderr });
    });
    proc.on('error', (err) => {
      resolve({ success: false, message: err.message, stdout, stderr });
    });
  });
}

async function checkCommandExists(command: string): Promise<boolean> {
  const checkCmd = process.platform === 'win32' ? `where ${command} 2>NUL` : `which ${command} 2>/dev/null`;
  const result = await runCommand(process.platform === 'win32' ? 'cmd' : '/bin/sh', process.platform === 'win32' ? ['/c', checkCmd] : ['-c', checkCmd]);
  return result.success && result.stdout.trim().length > 0;
}

async function getNodeVersion(): Promise<string | null> {
  try {
    const result = await runCommand('node', ['--version']);
    if (result.success) {
      return result.stdout.replace('v', '').trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function getOpenclawVersion(): Promise<string | null> {
  try {
    const result = await runCommand('openclaw', ['--version']);
    if (result.success) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

function getGatewayStatus() {
  if (gatewayProcess && gatewayProcess.pid) {
    try {
      if (process.platform === 'win32') {
        return { running: true, pid: gatewayProcess.pid, message: 'Running' };
      }
      process.kill(gatewayProcess.pid, 0);
      return { running: true, pid: gatewayProcess.pid, message: 'Running' };
    } catch {
      gatewayProcess = null;
    }
  }
  return { running: false, pid: null, message: 'Not running' };
}

let wechatProcess: ChildProcess | null = null;
let wechatStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

export function registerIpcHandlers() {
  ipcMain.handle('state:get', async () => {
    const [nodeVersion, openclawVersion, gatewayStatus] = await Promise.all([
      getNodeVersion(),
      getOpenclawVersion(),
      Promise.resolve(getGatewayStatus()),
    ]);
    let configExists = false;
    try {
      await fs.access(getConfigPath());
      configExists = true;
    } catch {}

    const nodeInstalled = nodeVersion !== null;
    const openclawInstalled = openclawVersion !== null;
    const gatewayRunning = gatewayStatus.running;

    let state: 'NOT_READY' | 'READY' | 'RUNNING' = 'NOT_READY';
    if (openclawInstalled && gatewayRunning) state = 'RUNNING';
    else if (openclawInstalled && configExists) state = 'READY';

    return { state, openclawInstalled, openclawVersion, gatewayRunning, gatewayPid: gatewayStatus.pid, nodeInstalled, nodeVersion, configExists };
  });

  ipcMain.handle('openclaw:install', async () => {
    try {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const result = await runCommand(npmCmd, ['install', '-g', 'openclaw']);
      return { success: result.success, message: result.success ? 'OpenClaw installed' : result.stderr || 'Failed' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  });

  ipcMain.handle('gateway:start', async () => {
    if (gatewayProcess) return { success: true, message: 'Gateway already running' };
    try {
      gatewayProcess = spawn('openclaw', ['gateway', 'start'], { shell: true, detached: false, stdio: ['ignore', 'pipe', 'pipe'] });
      gatewayProcess.on('error', () => { gatewayProcess = null; });
      gatewayProcess.on('close', () => { gatewayProcess = null; });
      return { success: true, message: 'Gateway starting...' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  });

  ipcMain.handle('gateway:stop', async () => {
    if (!gatewayProcess) return { success: false, message: 'Gateway not running' };
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(gatewayProcess.pid), '/f', '/t']);
      } else {
        gatewayProcess.kill('SIGTERM');
      }
      gatewayProcess = null;
      return { success: true, message: 'Gateway stopped' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  });

  ipcMain.handle('config:read', async () => {
    try {
      const path = getConfigPath();
      await fs.access(path);
      const data = await fs.readFile(path, 'utf-8');
      return JSON.parse(data);
    } catch { return null; }
  });

  ipcMain.handle('config:write', async (_, data) => {
    try {
      await ensureConfigDir();
      await fs.writeFile(getConfigPath(), JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, message: 'Config saved' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  });

  ipcMain.handle('channel:connect', async (_, channelType: string) => {
    if (channelType === 'wechat') {
      if (wechatStatus === 'connected' || wechatStatus === 'connecting') {
        return { success: true, message: 'Already connecting/connected' };
      }
      try {
        wechatStatus = 'connecting';
        wechatProcess = spawn('npx', ['-y', '@tencent-weixin/openclaw-weixin-cli@latest', 'install'], { shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
        wechatProcess.on('error', () => { wechatStatus = 'error'; wechatProcess = null; });
        wechatProcess.on('close', () => { wechatStatus = 'disconnected'; wechatProcess = null; });
        wechatStatus = 'connected';
        return { success: true, message: '微信连接已启动，请在终端查看二维码' };
      } catch (error) {
        wechatStatus = 'error';
        return { success: false, message: String(error) };
      }
    }
    return { success: false, message: 'Unknown channel' };
  });

  ipcMain.handle('channel:disconnect', async (_, channelType: string) => {
    if (channelType === 'wechat' && wechatProcess) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(wechatProcess.pid), '/f', '/t']);
        } else {
          wechatProcess.kill('SIGTERM');
        }
        wechatProcess = null;
        wechatStatus = 'disconnected';
        return { success: true, message: 'Disconnected' };
      } catch (error) {
        return { success: false, message: String(error) };
      }
    }
    return { success: true, message: 'Not connected' };
  });

  ipcMain.handle('channel:status', (_, channelType: string) => {
    if (channelType === 'wechat') return wechatStatus;
    return 'disconnected';
  });
}