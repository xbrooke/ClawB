import { invoke } from "@tauri-apps/api/core";
import type { ConfigChannel, ChannelStatus, ChannelConfig } from "./types";
import { ChannelError } from "./types";

interface TelegramConfig extends ChannelConfig {
  bot_token?: string;
  chat_id?: string;
}

export class TelegramChannel implements ConfigChannel {
  readonly id = "telegram";
  readonly name = "Telegram";
  readonly icon = "telegram";
  readonly type: "config" = "config";
  status: ChannelStatus = "inactive";
  config: TelegramConfig = {};

  async getStatus(): Promise<ChannelStatus> {
    try {
      const cfg = await this.loadConfig();
      if (cfg.bot_token && cfg.chat_id) {
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
    return !!(cfg.bot_token && cfg.chat_id);
  }

  async saveConfig(config: TelegramConfig): Promise<void> {
    const current = await this.loadConfig();
    const merged = { ...current, ...config };
    await invoke("write_config", { config: merged });
    this.config = merged;
  }

  async loadConfig(): Promise<TelegramConfig> {
    try {
      const cfg = await invoke<Record<string, unknown>>("read_config");
      this.config = {
        bot_token: cfg.telegram_bot_token as string | undefined,
        chat_id: cfg.telegram_chat_id as string | undefined,
      };
      return this.config;
    } catch {
      return {};
    }
  }

  async test(): Promise<boolean> {
    if (!this.config.bot_token) {
      return false;
    }
    try {
      return await invoke<boolean>("test_telegram_connection", {
        botToken: this.config.bot_token,
      });
    } catch {
      return false;
    }
  }

  async send(payload: { content: string; userId?: string }): Promise<void> {
    if (!this.config.bot_token || !this.config.chat_id) {
      throw new ChannelError("Telegram未配置，请先配置Bot Token和Chat ID后再发送消息", this.id, "NOT_READY");
    }
    await invoke("send_telegram_message", {
      botToken: this.config.bot_token,
      chatId: this.config.chat_id,
      text: payload.content,
    });
  }
}
