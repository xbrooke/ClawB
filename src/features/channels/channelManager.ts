import { BaseChannel, ChannelStatus } from './baseChannel';
import { wechatChannel } from './wechat';

const channels: Record<string, BaseChannel> = {
  wechat: wechatChannel,
};

export function registerChannel(channel: BaseChannel): void {
  channels[channel.type] = channel;
}

export function getChannel(type: string): BaseChannel | undefined {
  return channels[type];
}

export function getAllChannels(): BaseChannel[] {
  return Object.values(channels);
}

export function connect(type: string): Promise<{ success: boolean; message: string }> {
  const channel = channels[type];
  if (!channel) {
    return Promise.resolve({ success: false, message: 'Channel not found' });
  }
  return channel.connect();
}

export function disconnect(type: string): Promise<{ success: boolean; message: string }> {
  const channel = channels[type];
  if (!channel) {
    return Promise.resolve({ success: false, message: 'Channel not found' });
  }
  return channel.disconnect();
}

export function getStatus(type: string): ChannelStatus {
  const channel = channels[type];
  if (!channel) {
    return 'disconnected';
  }
  return channel.getStatus();
}

export function send(type: string, message: string): Promise<{ success: boolean; message: string }> {
  const channel = channels[type];
  if (!channel) {
    return Promise.resolve({ success: false, message: 'Channel not found' });
  }
  return channel.send(message);
}