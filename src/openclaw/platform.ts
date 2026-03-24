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
}

export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  let platform: Platform = "windows";

  if (userAgent.includes("mac")) {
    platform = "macos";
  } else if (userAgent.includes("linux") && !userAgent.includes("android")) {
    platform = "linux";
  }

  const isWindows = platform === "windows";
  const isMacos = platform === "macos";
  const isLinux = platform === "linux";

  const homeDir = isWindows
    ? "C:\\Users\\Administrator"
    : isMacos
      ? "/Users/root"
      : "/root";

  const nodePaths = isWindows
    ? ["C:\\Program Files\\nodejs", "C:\\Program Files (x86)\\nodejs"]
    : isMacos
      ? ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"]
      : ["/usr/local/bin", "/usr/bin", "/snap/bin"];

  const shellCmd = isWindows ? "cmd" : "/bin/sh";
  const shellArgs = isWindows ? ["/C"] : ["-c"];

  return {
    platform,
    isWindows,
    isMacos,
    isLinux,
    homeDir,
    nodePaths,
    shellCmd,
    shellArgs,
  };
}

export const platform = detectPlatform();
