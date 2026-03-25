export type ChannelStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BaseChannel {
  type: string;
  name: string;
  getStatus(): ChannelStatus;
  connect(): Promise<{ success: boolean; message: string }>;
  disconnect(): Promise<{ success: boolean; message: string }>;
  send(message: string): Promise<{ success: boolean; message: string }>;
}