import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { BindChannel, ChannelStatus, BindStatus, SendPayload } from "./types";

export class WeChatChannel implements BindChannel {
  readonly id = "weixin";
  readonly name = "微信";
  readonly icon = "wechat";
  readonly type: "bind" = "bind";
  status: ChannelStatus = "inactive";
  bindStatus: BindStatus = "unbound";
  private _installOutput: string[] = [];
  private _onOutput?: (line: string) => void;
  private _onDone?: (result: string) => void;

  async getStatus(): Promise<ChannelStatus> {
    try {
      const result = await invoke<string | null>("get_weixin_plugin_status");
      this.status = result === "active" ? "active" : "inactive";
      return this.status;
    } catch {
      this.status = "error";
      return "error";
    }
  }

  async getBindStatus(): Promise<BindStatus> {
    try {
      const result = await invoke<string | null>("get_weixin_plugin_status");
      if (!result) {
        this.bindStatus = "unbound";
      } else if (result === "active") {
        this.bindStatus = "bound";
      } else if (result === "error") {
        this.bindStatus = "error";
      } else {
        this.bindStatus = "unbound";
      }
      return this.bindStatus;
    } catch {
      this.bindStatus = "error";
      return "error";
    }
  }

  async validate(): Promise<boolean> {
    const status = await this.getBindStatus();
    return status === "bound";
  }

  async bind(onOutput?: (line: string) => void, onDone?: (result: string) => void): Promise<void> {
    this._onOutput = onOutput;
    this._onDone = onDone;
    this.bindStatus = "binding";
    this.status = "inactive";

    let unlistenLine: UnlistenFn | null = null;
    let unlistenDone: UnlistenFn | null = null;

    try {
      unlistenLine = await listen<string>("install-output", (e) => {
        this._installOutput.push(e.payload);
        this._onOutput?.(e.payload);
      });

      unlistenDone = await listen<string>("install-done", async (e) => {
        const result = e.payload;
        if (result === "success") {
          this.bindStatus = "bound";
          this.status = "active";
        } else {
          this.bindStatus = "error";
        }
        this._onDone?.(result);
        unlistenLine?.();
        unlistenDone?.();
      });

      await invoke("install_weixin_plugin");
    } catch (error) {
      this.bindStatus = "error";
      this._onDone?.("failed");
      unlistenLine?.();
      unlistenDone?.();
      throw error;
    }
  }

  async unbind(): Promise<void> {
    try {
      await invoke("run_shell_command", { command: "openclaw plugins uninstall weixin" });
      this.bindStatus = "unbound";
      this.status = "inactive";
    } catch {
      this.bindStatus = "error";
      throw new Error("卸载失败");
    }
  }

  async send(payload: SendPayload): Promise<void> {
    if (this.bindStatus !== "bound") {
      throw new Error("微信未绑定，无法发送消息");
    }
    if (!payload.content) {
      throw new Error("消息内容不能为空");
    }
  }
}
