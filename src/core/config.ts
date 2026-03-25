import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';

export interface OpenClawConfig {
  apiKey?: string;
  provider?: string;
  model?: string;
  channels?: Record<string, unknown>;
}

let configPath: string | null = null;

function getConfigPath(): string {
  if (configPath) return configPath;
  const home = os.homedir();
  configPath = join(home, '.openclaw', 'openclaw.json');
  return configPath;
}

export async function ensureConfigDir(): Promise<void> {
  const configDir = join(os.homedir(), '.openclaw');
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

export async function read(): Promise<OpenClawConfig | null> {
  try {
    const path = getConfigPath();
    await fs.access(path);
    const data = await fs.readFile(path, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function write(data: OpenClawConfig): Promise<{ success: boolean; message: string }> {
  try {
    await ensureConfigDir();
    const path = getConfigPath();
    await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, message: 'Config saved' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function exists(): Promise<boolean> {
  try {
    const path = getConfigPath();
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}