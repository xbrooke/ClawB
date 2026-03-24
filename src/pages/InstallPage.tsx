import { useEffect, useState, useRef } from "react";
import { CheckCircle, XCircle, Loader, Play, Square, Download, Terminal } from "lucide-react";
import { AppButton } from "@/components/AppButton";
import { getServiceStatus, prepareEnvironment, startService, stopService, type ServiceStatus } from "@/openclaw";

export function InstallPage() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  async function checkStatus() {
    setLoading(true);
    try {
      const s = await getServiceStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }

  function addLog(msg: string) {
    setLogs((prev) => [...prev, msg]);
  }

  async function handlePrepare() {
    setPreparing(true);
    setLogs([]);
    addLog("开始准备环境...");

    const result = await prepareEnvironment((log) => addLog(log));

    if (result.success) {
      addLog("✅ " + result.message);
    } else {
      addLog("❌ " + result.message);
    }

    setPreparing(false);
    await checkStatus();
  }

  async function handleStart() {
    setActionLoading("start");
    addLog("正在启动 Gateway...");
    const res = await startService();
    if (res.success) {
      addLog("✅ Gateway 启动成功");
    } else {
      addLog("❌ 启动失败: " + res.message);
    }
    setActionLoading(null);
    await checkStatus();
  }

  async function handleStop() {
    setActionLoading("stop");
    addLog("正在停止 Gateway...");
    const res = await stopService();
    if (res.success) {
      addLog("✅ Gateway 已停止");
    } else {
      addLog("❌ 停止失败: " + res.message);
    }
    setActionLoading(null);
    await checkStatus();
  }

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
          <Loader size={24} className="spin" style={{ marginBottom: 8 }} />
          <div>加载中...</div>
        </div>
      </div>
    );
  }



  function getMainButton() {
    if (!status) return null;

    if (preparing) {
      return (
        <AppButton onClick={() => {}} disabled size="md">
          <Loader size={16} className="spin" /> 准备中...
        </AppButton>
      );
    }

    switch (status.state) {
      case "NOT_READY":
        return (
          <AppButton onClick={handlePrepare} size="md">
            <Download size={16} /> 一键安装
          </AppButton>
        );
      case "READY":
        return (
          <AppButton onClick={handleStart} disabled={actionLoading === "start"} size="md">
            {actionLoading === "start" ? <Loader size={16} className="spin" /> : <Play size={16} />}
            启动服务
          </AppButton>
        );
      case "RUNNING":
        return (
          <AppButton onClick={handleStop} disabled={actionLoading === "stop"} size="md" tone="secondary">
            {actionLoading === "stop" ? <Loader size={16} className="spin" /> : <Square size={16} />}
            停止服务
          </AppButton>
        );
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
          环境安装
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          {status?.state === "RUNNING"
            ? "服务运行中，可停止后重新安装"
            : status?.state === "READY"
              ? "环境就绪，可以启动服务"
              : "点击一键安装 OpenClaw 环境"}
        </p>
      </div>

      {/* Status Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>
            {status?.nodeInstalled ? (
              <CheckCircle size={24} style={{ color: "var(--accent-green)" }} />
            ) : (
              <XCircle size={24} style={{ color: "var(--accent-red)" }} />
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Node.js</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {status?.nodeVersion ? `v${status.nodeVersion}` : "未安装"}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>
            {status?.openclawInstalled ? (
              <CheckCircle size={24} style={{ color: "var(--accent-green)" }} />
            ) : (
              <XCircle size={24} style={{ color: "var(--accent-red)" }} />
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>OpenClaw</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {status?.openclawVersion ? `v${status.openclawVersion}` : "未安装"}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>
            {status?.gatewayRunning ? (
              <CheckCircle size={24} style={{ color: "var(--accent-green)" }} />
            ) : (
              <XCircle size={24} style={{ color: "var(--text-tertiary)" }} />
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Gateway</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {status?.gatewayRunning ? "运行中" : "已停止"}
          </div>
        </div>
      </div>

      {/* Main Action */}
      <div style={{ marginBottom: 24 }}>{getMainButton()}</div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--card-border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Terminal size={14} style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>日志</span>
          </div>
          <div
            style={{
              padding: 12,
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.6,
              maxHeight: 240,
              overflowY: "auto",
              background: "var(--window-bg)",
            }}
          >
            {logs.map((log, i) => (
              <div key={i} style={{ color: "var(--text-secondary)" }}>
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}