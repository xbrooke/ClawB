import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, ArrowRightCircle, Cpu, Zap, Server, Play, Square, RotateCw } from "lucide-react";
import { AppButton } from "@/components/AppButton";
import { getServiceStatus, startService, stopService, restartService, type ServiceStatus, type AppState } from "@/openclaw";
import type { Page } from "@/components/Sidebar";

interface StatusPageProps {
  onNavigate: (page: Page) => void;
}

function StatusBadge({ state }: { state: AppState }) {
  const config: Record<AppState, { color: string; bg: string; label: string }> = {
    NOT_READY: { color: "var(--accent-red)", bg: "rgba(239, 68, 68, 0.1)", label: "未就绪" },
    READY: { color: "var(--accent-yellow)", bg: "rgba(234, 179, 8, 0.1)", label: "已就绪" },
    RUNNING: { color: "var(--accent-green)", bg: "rgba(34, 197, 94, 0.1)", label: "运行中" },
  };
  const { color, bg, label } = config[state];
  return (
    <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, color, background: bg }}>
      {label}
    </span>
  );
}

function ServiceCard({ status }: { status: ServiceStatus }) {
  const cards = [
    {
      icon: Cpu,
      label: "Node.js",
      value: status.nodeVersion ? `v${status.nodeVersion}` : "未安装",
      ok: status.nodeInstalled,
    },
    {
      icon: Zap,
      label: "OpenClaw CLI",
      value: status.openclawVersion ? `v${status.openclawVersion}` : "未安装",
      ok: status.openclawInstalled,
    },
    {
      icon: Server,
      label: "Gateway",
      value: status.gatewayRunning ? `PID ${status.gatewayPid}` : "已停止",
      ok: status.gatewayRunning,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="glass-card"
          style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <card.icon size={18} style={{ color: card.ok ? "var(--accent-green)" : "var(--text-tertiary)" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{card.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{card.value}</div>
            </div>
          </div>
          {card.ok ? (
            <CheckCircle2 size={16} style={{ color: "var(--accent-green)" }} />
          ) : (
            <Circle size={16} style={{ color: "var(--text-tertiary)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function FlowStep({ label, state }: { label: string; state: "done" | "current" | "pending" }) {
  const colors = { done: "var(--accent-green)", current: "var(--accent-blue)", pending: "var(--text-tertiary)" };
  const Icon = state === "done" ? CheckCircle2 : state === "current" ? ArrowRightCircle : Circle;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={14} style={{ color: colors[state] }} />
      <span style={{ fontSize: 13, color: colors[state] }}>{label}</span>
    </div>
  );
}

function ServiceControls({ status, onRefresh, onNavigate }: { status: ServiceStatus; onRefresh: () => void; onNavigate: (page: Page) => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleStart() {
    setLoading("start");
    await startService();
    onRefresh();
    setLoading(null);
  }

  async function handleStop() {
    setLoading("stop");
    await stopService();
    onRefresh();
    setLoading(null);
  }

  async function handleRestart() {
    setLoading("restart");
    await restartService();
    onRefresh();
    setLoading(null);
  }

  if (status.state === "RUNNING") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <AppButton onClick={handleRestart} disabled={!!loading} size="sm">
          <RotateCw size={14} /> 重启
        </AppButton>
        <AppButton onClick={handleStop} disabled={!!loading} tone="secondary" size="sm">
          <Square size={14} /> 停止
        </AppButton>
      </div>
    );
  }

  if (status.state === "READY") {
    return (
      <AppButton onClick={handleStart} disabled={!!loading} size="sm">
        <Play size={14} /> 启动服务
      </AppButton>
    );
  }

  return (
    <AppButton onClick={() => onNavigate("install")} size="sm">
      去安装
    </AppButton>
  );
}

export function StatusPage({ onNavigate }: StatusPageProps) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getServiceStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading || !status) {
    return (
      <div className="page-container">
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>加载中...</div>
      </div>
    );
  }

  const flowSteps = [
    { label: "Node.js", state: status.nodeInstalled ? "done" as const : "pending" as const },
    { label: "OpenClaw CLI", state: status.openclawInstalled ? "done" as const : "pending" as const },
    { label: "Gateway", state: status.gatewayRunning ? "done" as const : status.openclawInstalled ? "current" as const : "pending" as const },
  ];

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>仪表盘</h1>
          <StatusBadge state={status.state} />
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          {status.state === "RUNNING" ? "所有服务运行正常" : status.state === "READY" ? "请启动服务" : "请完成环境安装"}
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {flowSteps.map((step, i) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FlowStep label={step.label} state={step.state} />
            {i < flowSteps.length - 1 && (
              <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>→</span>
            )}
          </div>
        ))}
      </div>

      <div className="section-title">服务状态</div>
      <ServiceCard status={status} />

      <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
        <ServiceControls status={status} onRefresh={fetchStatus} onNavigate={onNavigate} />
        <AppButton onClick={fetchStatus} tone="secondary" size="sm">
          刷新
        </AppButton>
      </div>
    </div>
  );
}