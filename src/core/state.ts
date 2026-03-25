export type AppState = 'NOT_READY' | 'READY' | 'RUNNING';

export interface ServiceStatus {
  state: AppState;
  openclawInstalled: boolean;
  openclawVersion: string | null;
  gatewayRunning: boolean;
  gatewayPid: number | null;
  nodeInstalled: boolean;
  nodeVersion: string | null;
  configExists: boolean;
}

import { getOpenclawVersion, getNodeVersion } from './cli';
import { getStatus as getGatewayStatus } from './gateway';
import { exists as configExists } from './config';

export async function get(): Promise<ServiceStatus> {
  const [nodeVersion, openclawVersion, gatewayStatus, hasConfig] = await Promise.all([
    getNodeVersion(),
    getOpenclawVersion(),
    Promise.resolve(getGatewayStatus()),
    configExists(),
  ]);

  const nodeInstalled = nodeVersion !== null;
  const openclawInstalled = openclawVersion !== null;
  const gatewayRunning = gatewayStatus.running;

  let state: AppState = 'NOT_READY';
  if (openclawInstalled && gatewayRunning) {
    state = 'RUNNING';
  } else if (openclawInstalled && hasConfig) {
    state = 'READY';
  }

  return {
    state,
    openclawInstalled,
    openclawVersion,
    gatewayRunning,
    gatewayPid: gatewayStatus.pid,
    nodeInstalled,
    nodeVersion,
    configExists: hasConfig,
  };
}