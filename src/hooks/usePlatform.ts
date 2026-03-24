import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export type Platform = "windows" | "macos" | "linux" | "unknown";

export interface PlatformInfo {
  platform: Platform;
}

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectPlatform = async () => {
      try {
        const info = await invoke<PlatformInfo>("get_platform");
        setPlatform(info.platform as Platform);
      } catch {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("mac") || userAgent.includes("darwin")) {
          setPlatform("macos");
        } else if (userAgent.includes("linux")) {
          setPlatform("linux");
        } else {
          setPlatform("windows");
        }
      } finally {
        setLoading(false);
      }
    };
    detectPlatform();
  }, []);

  return { platform, loading, isWindows: platform === "windows", isMacos: platform === "macos" };
}