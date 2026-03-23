import { invoke } from "@tauri-apps/api/core";
import type { ConfigChannel, ChannelStatus, ChannelConfig } from "./types";

interface FeishuConfig extends ChannelConfig {
  feishu_app_id?: string;
  feishu_app_secret?: string;
  dm_policy?: string;
}

export class FeishuChannel implements ConfigChannel {
  readonly id = "feishu";
  readonly name = "飞书";
  readonly icon = "feishu";
  readonly type: "config" = "config";
  status: ChannelStatus = "inactive";
  config: FeishuConfig = {};

  async getStatus(): Promise<ChannelStatus> {
    try {
      const cfg = await this.loadConfig();
      if (cfg.feishu_app_id && cfg.feishu_app_secret) {
        this.status = "active";
      } else {
        this.status = "inactive";
      }
      return this.status;
    } catch {
      this.status = "error";
      return "error";
    }
  }

  async validate(): Promise<boolean> {
    const cfg = await this.loadConfig();
    return !!(cfg.feishu_app_id && cfg.feishu_app_secret);
  }

  async saveConfig(config: FeishuConfig): Promise<void> {
    const current = await this.loadConfig();
    const merged = { ...current, ...config };
    await invoke("write_config", { config: merged });
    this.config = merged;
  }

  async loadConfig(): Promise<FeishuConfig> {
    try {
      const cfg = await invoke<Record<string, unknown>>("read_config");
      this.config = {
        feishu_app_id: cfg.feishu_app_id as string | undefined,
        feishu_app_secret: cfg.feishu_app_secret as string | undefined,
        dm_policy: cfg.dm_policy as string | undefined,
      };
      return this.config;
    } catch {
      return {};
    }
  }

  async test(): Promise<boolean> {
    if (!this.config.feishu_app_id || !this.config.feishu_app_secret) {
      return false;
    }
    try {
      return await invoke<boolean>("test_feishu_connection", {
        appId: this.config.feishu_app_id,
        appSecret: this.config.feishu_app_secret,
      });
    } catch {
      return false;
    }
  }

  async send(_payload: { content: string; userId?: string }): Promise<void> {
    if (!this.config.feishu_app_id || !this.config.feishu_app_secret) {
      throw new Error("飞书未配置");
    }
    // Messages go through the gateway
  }
}
