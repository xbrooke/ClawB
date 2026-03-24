import { invoke } from "@tauri-apps/api/core";
import type { BindChannel, ChannelStatus, BindStatus } from "./types";
import { ChannelError } from "./types";

export class QQChannel implements BindChannel {
  readonly id = "qq";
  readonly name = "QQ";
  readonly icon = "qq";
  readonly type: "bind" = "bind";
  status: ChannelStatus = "inactive";
  bindStatus: BindStatus = "unbound";

  async getStatus(): Promise<ChannelStatus> {
    try {
      const isBound = await invoke<boolean>("check_qq_bind_status");
      this.bindStatus = isBound ? "bound" : "unbound";
      this.status = isBound ? "active" : "inactive";
      return this.status;
    } catch {
      this.bindStatus = "error";
      this.status = "error";
      return "error";
    }
  }

  async getBindStatus(): Promise<BindStatus> {
    return this.bindStatus;
  }

  async validate(): Promise<boolean> {
    return this.bindStatus === "bound";
  }

  async bind(
    onOutput?: (line: string) => void,
    onDone?: (result: string) => void
  ): Promise<void> {
    this.bindStatus = "binding";
    this.status = "active";

    try {
      await invoke("bind_qq", {
        onOutput: onOutput ? (line: string) => onOutput(line) : undefined,
        onDone: onDone ? (result: string) => onDone(result) : undefined,
      });
      this.bindStatus = "bound";
      this.status = "active";
    } catch (e) {
      this.bindStatus = "error";
      this.status = "error";
      throw e;
    }
  }

  async unbind(): Promise<void> {
    try {
      await invoke("unbind_qq");
      this.bindStatus = "unbound";
      this.status = "inactive";
    } catch (e) {
      this.bindStatus = "error";
      this.status = "error";
      throw e;
    }
  }

  async send(payload: { content: string; userId?: string }): Promise<void> {
    if (this.bindStatus !== "bound") {
      throw new ChannelError("QQ未绑定，请先绑定后再发送消息", this.id, "NOT_READY");
    }
    await invoke("send_qq_message", {
      content: payload.content,
      userId: payload.userId,
    });
  }
}
