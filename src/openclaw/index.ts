export * from "./platform";
export * from "./detect";
export * from "./exec";
export * from "./gateway";
export * from "./install";

export interface OpenClawModule {
  platform: ReturnType<typeof import("./platform").detectPlatform>;
  detect: typeof import("./detect");
  exec: typeof import("./exec");
  gateway: typeof import("./gateway");
  install: typeof import("./install");
}
