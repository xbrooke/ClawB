/**
 * OpenClaw Module - Simplified Entry Point
 */

export { InstallState, detect } from "./detect";
export type { DetectionResult } from "./detect";
export { getStatus, isRunning } from "./gateway";
export {
  installOpenClaw,
  onboardOpenClaw,
  startGateway,
  stopGateway,
  restartGateway,
  installGateway,
} from "./install";
