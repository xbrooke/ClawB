export type AppState = "NOT_READY" | "READY" | "RUNNING";

export interface ServiceStatus {
  state: AppState;
  openclawInstalled: boolean;
  openclawVersion: string | null;
  gatewayRunning: boolean;
  gatewayPid: number | null;
  nodeInstalled: boolean;
  nodeVersion: string | null;
}

export interface PreparationResult {
  success: boolean;
  state: AppState;
  message: string;
  logs: string[];
}