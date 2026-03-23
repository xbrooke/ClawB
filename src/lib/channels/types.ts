export type ChannelType = "config" | "bind";

export type ChannelStatus = "inactive" | "active" | "error";

export type BindStatus = "unbound" | "binding" | "bound" | "error";

export interface ChannelConfig {
  enabled?: boolean;
  [key: string]: unknown;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  type: ChannelType;
  status: ChannelStatus;
  getStatus(): Promise<ChannelStatus>;
  validate(): Promise<boolean>;
  send?(payload: SendPayload): Promise<void>;
}

export interface ConfigChannel extends Channel {
  type: "config";
  config: ChannelConfig;
  saveConfig(config: ChannelConfig): Promise<void>;
  loadConfig(): Promise<ChannelConfig>;
  test?(): Promise<boolean>;
}

export interface BindChannel extends Channel {
  type: "bind";
  bindStatus: BindStatus;
  getBindStatus(): Promise<BindStatus>;
  bind(onOutput?: (line: string) => void, onDone?: (result: string) => void): Promise<void>;
  unbind(): Promise<void>;
}

export interface SendPayload {
  content: string;
  userId?: string;
  [key: string]: unknown;
}
