import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Loader, QrCode, Unlink, MessageSquare } from "lucide-react";
import { FaWeixin, FaTelegramPlane, FaDiscord, FaQq } from "react-icons/fa";
import { AppButton } from "@/components/AppButton";
import { channelRegistry } from "@/lib/channels/registry";
import { invoke } from "@tauri-apps/api/core";
import type { BindChannel, BindStatus, ChannelStatus } from "@/lib/channels/types";

const CHANNEL_META: Record<string, { label: string; Icon: typeof FaWeixin; type: "config" | "bind" }> = {
  weixin:   { label: "微信",    Icon: FaWeixin,       type: "bind" },
  feishu:   { label: "飞书",    Icon: MessageSquare,   type: "config" },
  telegram: { label: "Telegram", Icon: FaTelegramPlane, type: "config" },
  discord:  { label: "Discord",  Icon: FaDiscord,     type: "config" },
  dingtalk: { label: "钉钉",    Icon: MessageSquare,  type: "config" },
  qq:       { label: "QQ",      Icon: FaQq,          type: "bind" },
};

function StatusBadge({ status, bindStatus }: { status: ChannelStatus; bindStatus?: BindStatus }) {
  let Icon: typeof CheckCircle;
  let label: string;
  let color: string;

  if (bindStatus) {
    const map: Record<BindStatus, { icon: typeof CheckCircle; label: string; color: string }> = {
      unbound:  { icon: XCircle,    label: "未绑定", color: "var(--text-tertiary)" },
      binding:  { icon: Loader,    label: "扫码中", color: "var(--accent-blue)" },
      bound:    { icon: CheckCircle, label: "已绑定", color: "var(--accent-green)" },
      error:    { icon: XCircle,   label: "异常",   color: "var(--accent-red)" },
    };
    const c = map[bindStatus];
    Icon = c.icon; label = c.label; color = c.color;
  } else {
    const map: Record<ChannelStatus, { icon: typeof CheckCircle; label: string; color: string }> = {
      inactive: { icon: XCircle,    label: "未配置", color: "var(--text-tertiary)" },
      active:   { icon: CheckCircle, label: "已配置", color: "var(--accent-green)" },
      error:    { icon: XCircle,    label: "异常",    color: "var(--accent-red)" },
    };
    const c = map[status];
    Icon = c.icon; label = c.label; color = c.color;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color }}>
      <Icon size={14} />
      {label}
    </div>
  );
}

function ConfigPanel({ channelId }: { channelId: string }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [botToken, setBotToken]     = useState("");
  const [chatId, setChatId]         = useState("");
  const [secret, setSecret]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    invoke<Record<string, unknown>>("read_config").then((cfg) => {
      if (channelId === "feishu") {
        setBotToken((cfg.feishu_app_id as string) ?? "");
        setChatId((cfg.feishu_app_secret as string) ?? "");
      } else if (channelId === "telegram") {
        setBotToken((cfg.telegram_bot_token as string) ?? "");
        setChatId((cfg.telegram_chat_id as string) ?? "");
      } else if (channelId === "discord") {
        setWebhookUrl((cfg.discord_webhook_url as string) ?? "");
      } else if (channelId === "dingtalk") {
        setWebhookUrl((cfg.dingtalk_webhook_url as string) ?? "");
        setSecret((cfg.dingtalk_secret as string) ?? "");
      }
    });
  }, [channelId]);

  const save = async () => {
    setSaving(true);
    try {
      const configKeyMap: Record<string, Record<string, string>> = {
        feishu:   { feishu_app_id: botToken, feishu_app_secret: chatId },
        telegram: { telegram_bot_token: botToken, telegram_chat_id: chatId },
        discord:  { discord_webhook_url: webhookUrl },
        dingtalk: { dingtalk_webhook_url: webhookUrl, dingtalk_secret: secret },
      };
      await invoke("write_config", { config: configKeyMap[channelId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => { void save(); }, 800);
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  }, [webhookUrl, botToken, chatId, secret]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await invoke<boolean>(`test_${channelId}_connection`, {
        webhookUrl,
        botToken,
        chatId,
        secret,
      });
      setTestResult(ok);
    } catch {
      setTestResult(false);
    } finally {
      setTesting(false);
    }
  };

  const fields: { label: string; key: string; placeholder: string; type?: string }[] = [
    ...(channelId === "feishu" || channelId === "telegram"
      ? [
          { label: channelId === "feishu" ? "App ID" : "Bot Token", key: "token", placeholder: channelId === "feishu" ? "cli_xxx" : "123456:ABC-DEF" },
          { label: channelId === "feishu" ? "App Secret" : "Chat ID", key: "secret", placeholder: "••••••••", type: "password" },
        ]
      : []),
    ...(channelId === "discord" || channelId === "dingtalk"
      ? [
          { label: "Webhook URL", key: "webhook", placeholder: "https://..." },
          ...(channelId === "dingtalk" ? [{ label: "加签密钥", key: "secret", placeholder: "SEC..." }] : []),
        ]
      : []),
  ];

  const values: Record<string, string> = { token: botToken, secret, webhook: webhookUrl };
  const setters: Record<string, (v: string) => void> = { token: setBotToken, secret: setSecret, webhook: setWebhookUrl };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
        {fields.map((f, i) => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < fields.length - 1 ? "1px solid var(--card-border)" : "none" }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{f.label}</label>
            <input
              type={f.type ?? "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setters[f.key]?.(e.target.value)}
              placeholder={f.placeholder}
              style={{ width: 280, padding: "6px 12px", borderRadius: 8, fontSize: 13, background: "var(--card-bg)", border: "none", color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-mono)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)", textAlign: "right" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid var(--card-border)" }}>
          <div style={{ fontSize: 12, color: saving ? "var(--text-secondary)" : saved ? "var(--accent-green)" : "var(--text-tertiary)" }}>
            {saving ? "保存中…" : saved ? "已保存" : "自动保存"}
          </div>
          <AppButton onClick={handleTest} disabled={testing} tone="secondary" size="sm">
            {testing ? "测试中..." : "测试连接"}
          </AppButton>
        </div>
      </div>

      {testResult !== null && (
        <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, background: testResult ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)", color: testResult ? "var(--accent-green)" : "var(--accent-red)", border: testResult ? "1px solid rgba(52,199,89,0.2)" : "1px solid rgba(255,59,48,0.2)" }}>
          {testResult ? "连接成功" : "连接失败，请检查配置"}
        </div>
      )}
    </div>
  );
}

function BindPanel({ channelId }: { channelId: string }) {
  const [bindStatus, setBindStatus] = useState<BindStatus>("unbound");
  const [installOutput, setInstallOutput] = useState<string[]>([]);
  const [installStatus, setInstallStatus] = useState<"idle" | "binding" | "success" | "failed">("idle");
  const channel = channelRegistry.get(channelId) as BindChannel;

  useEffect(() => {
    channel?.getBindStatus().then(setBindStatus);
  }, [channel]);

  const handleBind = async () => {
    setInstallOutput([]);
    setInstallStatus("binding");
    setBindStatus("binding");

    try {
      await channel.bind(
        (line) => setInstallOutput((prev) => [...prev, line]),
        (result) => {
          if (result === "success") {
            setBindStatus("bound");
            setInstallStatus("success");
          } else {
            setBindStatus("error");
            setInstallStatus("failed");
          }
        }
      );
    } catch {
      setBindStatus("error");
      setInstallStatus("failed");
    }
  };

  const handleUnbind = async () => {
    try {
      await channel.unbind();
      setBindStatus("unbound");
    } catch {
      setBindStatus("error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
              {CHANNEL_META[channelId]?.label}
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>扫码绑定</p>
          </div>
          <StatusBadge status="inactive" bindStatus={bindStatus} />
        </div>

        {bindStatus === "unbound" || bindStatus === "error" ? (
          <AppButton onClick={handleBind} disabled={installStatus === "binding"}>
            <QrCode size={14} />
            {installStatus === "binding" ? "扫码中..." : `绑定${CHANNEL_META[channelId]?.label}`}
          </AppButton>
        ) : bindStatus === "bound" ? (
          <div style={{ display: "flex", gap: 12 }}>
            <AppButton onClick={handleBind} tone="secondary" size="sm">
              重新绑定
            </AppButton>
            <AppButton onClick={handleUnbind} tone="redSubtle" size="sm">
              <Unlink size={14} />
              解绑
            </AppButton>
          </div>
        ) : (
          <AppButton onClick={() => {}} disabled>
            <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
            扫码中...
          </AppButton>
        )}
      </div>

      {installOutput.length > 0 && (
        <div style={{ background: "var(--card-bg)", borderRadius: 8, padding: 16, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {installOutput.map((line, i) => <div key={i} style={{ lineHeight: 1.8 }}>{line}</div>)}
        </div>
      )}

      {installStatus === "success" && (
        <div style={{ padding: "12px 16px", borderRadius: 8, fontSize: 13, background: "rgba(52,199,89,0.1)", color: "var(--accent-green)", border: "1px solid rgba(52,199,89,0.2)" }}>
          {CHANNEL_META[channelId]?.label} 绑定成功！
        </div>
      )}

      {installStatus === "failed" && (
        <div style={{ padding: "12px 16px", borderRadius: 8, fontSize: 13, background: "rgba(255,59,48,0.1)", color: "var(--accent-red)", border: "1px solid rgba(255,59,48,0.2)" }}>
          绑定失败，请查看上方日志或重试。
        </div>
      )}
    </div>
  );
}

export function PlatformsPage() {
  const [activeId, setActiveId] = useState<string>("weixin");

  const allChannels = channelRegistry.list();

  const activeChannel = allChannels.find((c) => c.id === activeId);
  const meta = CHANNEL_META[activeId];

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0" }}>消息渠道</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>管理消息推送渠道和绑定状态</p>
      </div>

      <div className="section-title">渠道列表</div>
      <div className="glass-card" style={{ padding: 6, display: "flex", flexDirection: "column", gap: 2 }}>
        {allChannels.map((ch) => {
          const m = CHANNEL_META[ch.id];
          if (!m) return null;
          const isActive = activeId === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveId(ch.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                background: isActive ? "var(--accent-soft)" : "transparent",
                border: "none", cursor: "pointer", transition: "all 0.15s ease",
                width: "100%", textAlign: "left",
              }}
            >
              <m.Icon size={18} />
              <span style={{ flex: 1 }}>{m.label}</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: ch.type === "config" ? "var(--card-bg)" : "var(--accent-soft)", color: ch.type === "config" ? "var(--text-tertiary)" : "var(--accent-blue)" }}>
                {ch.type === "config" ? "配置型" : "绑定型"}
              </span>
              <StatusBadge status={ch.status as ChannelStatus} bindStatus={ch.type === "bind" ? (ch as BindChannel).bindStatus : undefined} />
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          {meta && <meta.Icon size={18} style={{ color: "var(--text-secondary)" }} />}
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            {meta?.label}
          </h2>
        </div>
        {activeChannel?.type === "config" ? (
          <ConfigPanel channelId={activeId} />
        ) : (
          <BindPanel channelId={activeId} />
        )}
      </div>
    </div>
  );
}
