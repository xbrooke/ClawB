import type { Channel, SendPayload } from "./types";
import { WeChatChannel } from "./wechat";
import { FeishuChannel } from "./feishu";

class ChannelRegistry {
  private channels: Map<string, Channel> = new Map();

  constructor() {
    this.register(new WeChatChannel());
    this.register(new FeishuChannel());
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

  async sendMessage(channelId: string, payload: SendPayload): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    if (!channel.send) {
      throw new Error(`Channel ${channelId} does not support sending`);
    }
    await channel.send(payload);
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
