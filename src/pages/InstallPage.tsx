import { useEffect, useState } from "react";
import { Loader, CheckCircle, XCircle, Cpu, Zap, Play, Square, RotateCw, Download, AlertCircle } from "lucide-react";
import { AppButton } from "@/components/AppButton";
import { detect, InstallState, type DetectionResult } from "@/openclaw/detect";
import { installOpenClaw, onboardOpenClaw, startGateway, stopGateway, restartGateway, installGateway } from "@/openclaw/install";

export function InstallPage() {
  const [detecting, setDetecting] = useState(true);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  // Detect on mount
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setDetecting(true);
    try {
      const status = await detect();
      setResult(status);
    } catch (e) {
      setMessage(`检测失败: ${e}`);
    }
    setDetecting(false);
  }

  async function handleInstall() {
    setLoading("install");
    setMessage("正在安装 OpenClaw...");
    const res = await installOpenClaw();
    if (res.success) {
      setMessage("安装完成");
    } else {
      setMessage(`安装失败: ${res.error}`);
    }
    setLoading(null);
    await checkStatus();
  }

  async function handleOnboard() {
    setLoading("onboard");
    setMessage("正在初始化 OpenClaw...");
    const res = await onboardOpenClaw();
    if (res.success) {
      setMessage("初始化完成");
    } else {
      setMessage(`初始化失败: ${res.error}`);
    }
    setLoading(null);
    await checkStatus();
  }

  async function handleStartGateway() {
    setLoading("start");
    setMessage("正在启动 Gateway...");
    // First try to install gateway service
    await installGateway();
    const res = await startGateway();
    if (res.success) {
      setMessage("Gateway 启动成功");
    } else {
      setMessage(`启动失败: ${res.error}`);
    }
    setLoading(null);
    await checkStatus();
  }

  async function handleStopGateway() {
    setLoading("stop");
    setMessage("正在停止 Gateway...");
    const res = await stopGateway();
    if (res.success) {
      setMessage("Gateway 已停止");
    } else {
      setMessage(`停止失败: ${res.error}`);
    }
    setLoading(null);
    await checkStatus();
  }

  async function handleRestartGateway() {
    setLoading("restart");
    setMessage("正在重启 Gateway...");
    const res = await restartGateway();
    if (res.success) {
      setMessage("Gateway 重启成功");
    } else {
      setMessage(`重启失败: ${res.error}`);
    }
    setLoading(null);
    await checkStatus();
  }

  function getStatusIcon(condition: boolean) {
    if (condition) {
      return <CheckCircle size={16} style={{ color: "var(--accent-green)" }} />;
    }
    return <XCircle size={16} style={{ color: "var(--accent-red)" }} />;
  }

  function isLoading(action: string) {
    return loading === action;
  }

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0" }}>
          环境安装
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          {detecting ? "检测中..." : `状态: ${result?.state || "未知"}`}
        </p>
      </div>

      {/* Status Cards */}
      <div>
        <div className="section-title">环境状态</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Cpu size={18} style={{ color: "var(--accent-blue)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Node.js</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {result?.node.version ? `v${result.node.version}` : "未安装"}
                </div>
              </div>
            </div>
            {getStatusIcon(result?.node.exists || false)}
          </div>

          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Zap size={18} style={{ color: "var(--accent-purple)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>OpenClaw</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {result?.openclaw.version ? `v${result.openclaw.version}` : "未安装"}
                </div>
              </div>
            </div>
            {getStatusIcon(result?.openclaw.exists || false)}
          </div>

          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className={`status-dot ${result?.gateway.running ? "running" : "stopped"}`} style={{ margin: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Gateway</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {result?.gateway.running ? `运行中 (PID: ${result.gateway.pid})` : "未运行"}
                </div>
              </div>
            </div>
            {getStatusIcon(result?.gateway.running || false)}
          </div>
        </div>
      </div>

      {/* Issues */}
      {result && result.state !== InstallState.READY && (
        <div>
          <div className="section-title">待处理</div>
          <div className="glass-card" style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertCircle size={16} style={{ color: "var(--accent-orange)", marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {!result.node.exists && <div>• Node.js 未安装</div>}
              {!result.openclaw.exists && <div>• OpenClaw 未安装</div>}
              {result.openclaw.exists && !result.gateway.running && <div>• Gateway 未运行</div>}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <div className="section-title">操作</div>
        <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {message && (
            <div style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              background: message.includes("失败") ? "var(--accent-red)" : "var(--card-bg-hover)",
              color: message.includes("失败") ? "white" : "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}>
              {message}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Install button - show when OpenClaw not installed */}
            {!result?.openclaw.exists && (
              <AppButton onClick={handleInstall} disabled={loading !== null}>
                {isLoading("install") ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={14} />}
                安装 OpenClaw
              </AppButton>
            )}

            {/* Onboard button - show when OpenClaw installed but gateway not running */}
            {result?.openclaw.exists && !result?.gateway.running && (
              <>
                <AppButton onClick={handleOnboard} disabled={loading !== null}>
                  {isLoading("onboard") ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
                  初始化
                </AppButton>
                <AppButton onClick={handleStartGateway} disabled={loading !== null}>
                  {isLoading("start") ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
                  启动 Gateway
                </AppButton>
              </>
            )}

            {/* Gateway controls - show when ready */}
            {result?.gateway.running && (
              <>
                <AppButton tone="secondary" onClick={handleRestartGateway} disabled={loading !== null}>
                  {isLoading("restart") ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RotateCw size={14} />}
                  重启
                </AppButton>
                <AppButton tone="redSubtle" onClick={handleStopGateway} disabled={loading !== null}>
                  {isLoading("stop") ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Square size={14} />}
                  停止
                </AppButton>
              </>
            )}

            {/* Refresh */}
            <AppButton tone="secondary" onClick={checkStatus} disabled={loading !== null}>
              <Loader size={14} />
              刷新
            </AppButton>
          </div>
        </div>
      </div>

      {/* Help */}
      <div>
        <div className="section-title">说明</div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {result?.state === InstallState.READY
              ? "✓ 环境就绪，Gateway 运行中"
              : result?.state === InstallState.INSTALLED
                ? "OpenClaw 已安装，点击「初始化」然后「启动 Gateway」"
                : "点击「安装 OpenClaw」开始安装"}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
