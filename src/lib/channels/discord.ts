import { invoke } from "@tauri-apps/api/core";
import type { ConfigChannel, ChannelStatus, ChannelConfig } from "./types";

interface DiscordConfig extends ChannelConfig {
  webhook_url?: string;
}

export class DiscordChannel implements ConfigChannel {
  readonly id = "discord";
  readonly name = "Discord";
  readonly icon = "discord";
  readonly type: "config" = "config";
  status: ChannelStatus = "inactive";
  config: DiscordConfig = {};

  async getStatus(): Promise<ChannelStatus> {
    try {
      const cfg = await this.loadConfig();
      if (cfg.webhook_url) {
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
    return !!cfg.webhook_url;
  }

  async saveConfig(config: DiscordConfig): Promise<void> {
    const current = await this.loadConfig();
    const merged = { ...current, ...config };
    await invoke("write_config", { config: merged });
    this.config = merged;
  }

  async loadConfig(): Promise<DiscordConfig> {
    try {
      const cfg = await invoke<Record<string, unknown>>("read_config");
      this.config = {
        webhook_url: cfg.discord_webhook_url as string | undefined,
      };
      return this.config;
    } catch {
      return {};
    }
  }

  async test(): Promise<boolean> {
    if (!this.config.webhook_url) {
      return false;
    }
    try {
      return await invoke<boolean>("test_discord_webhook", {
        webhookUrl: this.config.webhook_url,
      });
    } catch {
      return false;
    }
  }

  async send(payload: { content: string; userId?: string }): Promise<void> {
    if (!this.config.webhook_url) {
      throw new Error("Discord 未配置");
    }
    await invoke("send_discord_message", {
      webhookUrl: this.config.webhook_url,
      content: payload.content,
    });
  }
}
