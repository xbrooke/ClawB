import { invoke } from "@tauri-apps/api/core";
import type { ConfigChannel, ChannelStatus, ChannelConfig } from "./types";
import { ChannelError } from "./types";

interface DingTalkConfig extends ChannelConfig {
  webhook_url?: string;
  secret?: string;
}

export class DingTalkChannel implements ConfigChannel {
  readonly id = "dingtalk";
  readonly name = "钉钉";
  readonly icon = "dingtalk";
  readonly type: "config" = "config";
  status: ChannelStatus = "inactive";
  config: DingTalkConfig = {};

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

  async saveConfig(config: DingTalkConfig): Promise<void> {
    const current = await this.loadConfig();
    const merged = { ...current, ...config };
    await invoke("write_config", { config: merged });
    this.config = merged;
  }

  async loadConfig(): Promise<DingTalkConfig> {
    try {
      const cfg = await invoke<Record<string, unknown>>("read_config");
      this.config = {
        webhook_url: cfg.dingtalk_webhook_url as string | undefined,
        secret: cfg.dingtalk_secret as string | undefined,
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
      return await invoke<boolean>("test_dingtalk_webhook", {
        webhookUrl: this.config.webhook_url,
        secret: this.config.secret,
      });
    } catch {
      return false;
    }
  }

  async send(payload: { content: string; userId?: string }): Promise<void> {
    if (!this.config.webhook_url) {
      throw new ChannelError("钉钉未配置，请先配置Webhook URL后再发送消息", this.id, "NOT_READY");
    }
    await invoke("send_dingtalk_message", {
      webhookUrl: this.config.webhook_url,
      secret: this.config.secret,
      content: payload.content,
    });
  }
}
