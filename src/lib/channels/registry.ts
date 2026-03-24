import type { Channel, SendPayload } from "./types";
import { ChannelError } from "./types";
import { WeChatChannel } from "./wechat";
import { FeishuChannel } from "./feishu";
import { TelegramChannel } from "./telegram";
import { DiscordChannel } from "./discord";
import { DingTalkChannel } from "./dingtalk";
import { QQChannel } from "./qq";

class ChannelRegistry {
  private channels: Map<string, Channel> = new Map();

  constructor() {
    this.register(new WeChatChannel());
    this.register(new FeishuChannel());
    this.register(new TelegramChannel());
    this.register(new DiscordChannel());
    this.register(new DingTalkChannel());
    this.register(new QQChannel());
  }

  register(channel: Channel): void {
    this.channels.set(channel.id, channel);
  }

  get(id: string): Channel | undefined {
    return this.channels.get(id);
  }

  list(): Channel[] {
    return Array.from(this.channels.values());
  }

  listByType(type: "config" | "bind"): Channel[] {
    return Array.from(this.channels.values()).filter((ch) => ch.type === type);
  }

  /**
   * Unified sendMessage interface for all channels.
   * @param channelId - The channel identifier
   * @param payload - The message payload
   * @throws ChannelError if channel not found, not ready, or send fails
   */
  async sendMessage(channelId: string, payload: SendPayload): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new ChannelError(`Channel ${channelId} not found`, channelId, "NOT_FOUND");
    }
    if (!channel.send) {
      throw new ChannelError(`Channel ${channelId} does not support sending`, channelId, "SEND_FAILED");
    }

    // Validate channel is ready before sending
    const isValid = await channel.validate();
    if (!isValid) {
      const reason = channel.type === "bind"
        ? `${channel.name}未绑定，请先绑定后再发送消息`
        : `${channel.name}未配置，请先配置后再发送消息`;
      throw new ChannelError(reason, channelId, "NOT_READY");
    }

    await channel.send(payload);
  }

  /**
   * Check if a channel is ready to send messages.
   */
  async canSend(channelId: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel || !channel.send) return false;
    return await channel.validate();
  }

  async getAllStatuses(): Promise<Record<string, string>> {
    const statuses: Record<string, string> = {};
    for (const channel of this.channels.values()) {
      statuses[channel.id] = await channel.getStatus();
    }
    return statuses;
  }
}

export const channelRegistry = new ChannelRegistry();
