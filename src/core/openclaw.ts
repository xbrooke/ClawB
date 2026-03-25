import { runCommand, checkCommandExists, getOpenclawVersion } from './cli';

export interface InstallResult {
  success: boolean;
  message: string;
}

export async function checkInstalled(): Promise<{ installed: boolean; version: string | null }> {
  const installed = await checkCommandExists('openclaw');
  if (!installed) {
    return { installed: false, version: null };
  }
  const version = await getOpenclawVersion();
  return { installed: true, version };
}

export async function install(): Promise<InstallResult> {
  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = await runCommand(npmCmd, ['install', '-g', 'openclaw']);

    if (result.success) {
      return { success: true, message: 'OpenClaw installed successfully' };
    } else {
      return { success: false, message: result.stderr || 'Installation failed' };
    }
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function uninstall(): Promise<InstallResult> {
  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = await runCommand(npmCmd, ['uninstall', '-g', 'openclaw']);

    if (result.success) {
      return { success: true, message: 'OpenClaw uninstalled' };
    } else {
      return { success: false, message: result.stderr || 'Uninstall failed' };
    }
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

export async function update(): Promise<InstallResult> {
  try {
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const result = await runCommand(npmCmd, ['update', '-g', 'openclaw']);

    if (result.success) {
      return { success: true, message: 'OpenClaw updated' };
    } else {
      return { success: false, message: result.stderr || 'Update failed' };
    }
  } catch (error) {
    return { success: false, message: String(error) };
  }
}