export type Platform = "windows" | "macos" | "linux";

export interface PlatformInfo {
  platform: Platform;
  isWindows: boolean;
  isMacos: boolean;
  isLinux: boolean;
  homeDir: string;
  nodePaths: string[];
  shellCmd: string;
  shellArgs: string[];
  pathSeparator: string;
}

/**
 * Detects the current platform using navigator.userAgent.
 * Note: This is a best-effort detection from the browser context.
 * For more accurate detection, the Rust backend should be used.
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  let platform: Platform = "windows";

  if (userAgent.includes("mac") || userAgent.includes("darwin")) {
    platform = "macos";
  } else if (userAgent.includes("linux") && !userAgent.includes("android")) {
    platform = "linux";
  }

  const isWindows = platform === "windows";
  const isMacos = platform === "macos";
  const isLinux = platform === "linux";

  // Default paths - these should be overridden by backend calls when possible
  const homeDir = isWindows
    ? "C:\\Users\\UNKNOWN" // Will be updated by backend
    : isMacos
      ? "/Users/UNKNOWN" // Will be updated by backend
      : "/root";

  const nodePaths = isWindows
    ? [
        "C:\\Program Files\\nodejs",
        "C:\\Program Files (x86)\\nodejs",
        `${process.env.LOCALAPPDATA || "C:\\Users\\UNKNOWN"}\\Programs\\nodejs`,
      ]
    : isMacos
      ? ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"]
      : ["/usr/local/bin", "/usr/bin", "/snap/bin"];

  const shellCmd = isWindows ? "cmd" : "/bin/sh";
  const shellArgs = isWindows ? ["/C"] : ["-c"];

  const pathSeparator = isWindows ? "\\" : "/";

  return {
    platform,
    isWindows,
    isMacos,
    isLinux,
    homeDir,
    nodePaths,
    shellCmd,
    shellArgs,
    pathSeparator,
  };
}

export const platform = detectPlatform();

/**
 * Join path segments in a cross-platform manner.
 */
export function joinPath(...segments: string[]): string {
  return segments.join(platform.pathSeparator);
}

/**
 * Get the OpenClaw config directory path.
 * Uses proper path joining for cross-platform compatibility.
 */
export function getOpenClawHome(): string {
  if (platform.isWindows) {
    return `${platform.homeDir}\\`.replace(/\\\\$/, "") + `.openclaw`;
  }
  return `${platform.homeDir}/.openclaw`;
}

/**
 * Get the OpenClaw config file path.
 */
export function getOpenClawConfigPath(): string {
  return joinPath(getOpenClawHome(), "config.json");
}

/**
 * Get the gateway log file path.
 */
export function getGatewayLogPath(): string {
  if (platform.isWindows) {
    return joinPath(getOpenClawHome(), "logs", "gateway.log");
  }
  return joinPath(getOpenClawHome(), "logs", "gateway.log");
}
