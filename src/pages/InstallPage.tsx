import { useEffect, useState } from "react";
import { Loader, CheckCircle, XCircle, Cpu, Zap, Play, Square, RotateCw, Download, ExternalLink } from "lucide-react";
import { AppButton } from "@/components/AppButton";
import { platform } from "@/openclaw/platform";
import { detectNode, detectOpenClaw } from "@/openclaw/detect";
import { getGatewayStatus, startGateway, stopGateway, installGateway } from "@/openclaw/gateway";

interface NodeInfo {
  version: string;
  path: string;
}

interface OpenClawInfo {
  version: string;
  path: string;
}

interface GatewayInfo {
  running: boolean;
  pid: number | null;
}

export function InstallPage() {
  const [nodeStatus, setNodeStatus] = useState<"checking" | "installed" | "missing">("checking");
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [openclawStatus, setOpenclawStatus] = useState<"checking" | "installed" | "missing">("checking");
  const [openclawInfo, setOpenClawnInfo] = useState<OpenClawInfo | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayInfo>({ running: false, pid: null });
  const [gatewayLoading, setGatewayLoading] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setNodeStatus("checking");
    setOpenclawStatus("checking");

    try {
      const nodeResult = await detectNode();
      if (nodeResult.installed) {
        setNodeStatus("installed");
        setNodeInfo({ version: nodeResult.version ?? "unknown", path: nodeResult.path ?? "" });
      } else {
        setNodeStatus("missing");
      }
    } catch {
      setNodeStatus("missing");
    }

    try {
      const ocResult = await detectOpenClaw();
      if (ocResult.installed) {
        setOpenclawStatus("installed");
        setOpenClawnInfo({ version: ocResult.version ?? "unknown", path: ocResult.path ?? "" });
        setGatewayStatus({ running: ocResult.gatewayRunning, pid: ocResult.gatewayPid });
      } else {
        setOpenclawStatus("missing");
      }
    } catch {
      setOpenclawStatus("missing");
    }

    try {
      const gs = await getGatewayStatus();
      setGatewayStatus({ running: gs.running, pid: gs.pid });
    } catch {
      setGatewayStatus({ running: false, pid: null });
    }
  };

  const handleGatewayAction = async (action: "start" | "stop" | "restart" | "install") => {
    setGatewayLoading(true);
    try {
      if (action === "start") {
        await startGateway();
      } else if (action === "stop") {
        await stopGateway();
      } else if (action === "restart") {
        await stopGateway();
        await new Promise(r => setTimeout(r, 500));
        await startGateway();
      } else if (action === "install") {
        await installGateway();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGatewayLoading(false);
      await checkStatus();
    }
  };

  const StatusIndicator = ({ status, label, sublabel }: { status: "checking" | "installed" | "missing"; label: string; sublabel?: string }) => {
    if (status === "checking") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Loader size={16} style={{ color: "var(--accent-orange)", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>检测中...</span>
        </div>
      );
    }
    if (status === "installed") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle size={16} style={{ color: "var(--accent-green)" }} />
          <div>
            <span style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 500 }}>{label}</span>
            {sublabel && <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: 8 }}>{sublabel}</span>}
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <XCircle size={16} style={{ color: "var(--accent-red)" }} />
        <span style={{ fontSize: 13, color: "var(--accent-red)" }}>{label}</span>
      </div>
    );
  };

  // Get download URL based on platform
  const getDownloadUrl = () => {
    return "https://github.com/qingchencloud/openclaw-standalone/releases/latest";
  };

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0" }}>环境安装</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>管理 OpenClaw 运行环境和网关服务</p>
      </div>

      <div>
        <div className="section-title">运行环境</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Cpu size={18} style={{ color: "var(--accent-blue)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Node.js</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {nodeInfo ? `v${nodeInfo.version}` : platform.isWindows ? "Windows" : "macOS / Linux"}
                </div>
              </div>
            </div>
            <StatusIndicator status={nodeStatus} label={nodeStatus === "installed" ? "已安装" : "未安装"} />
          </div>

          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Zap size={18} style={{ color: "var(--accent-purple)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>OpenClaw</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {openclawInfo ? `v${openclawInfo.version}` : "消息渠道核心"}
                </div>
              </div>
            </div>
            <StatusIndicator status={openclawStatus} label={openclawStatus === "installed" ? "已安装" : "未安装"} />
          </div>
        </div>
      </div>

      <div>
        <div className="section-title">网关服务</div>
        <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className={`status-dot ${gatewayStatus.running ? "running" : "stopped"}`} style={{ margin: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Gateway</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {gatewayStatus.running ? `PID: ${gatewayStatus.pid}` : "未运行"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!gatewayStatus.running ? (
              <>
                <AppButton size="sm" tone="secondary" onClick={() => handleGatewayAction("install")} disabled={gatewayLoading || openclawStatus !== "installed"}>
                  <Download size={13} />
                  安装
                </AppButton>
                <AppButton size="sm" onClick={() => handleGatewayAction("start")} disabled={gatewayLoading || openclawStatus !== "installed"}>
                  <Play size={13} />
                  启动
                </AppButton>
              </>
            ) : (
              <>
                <AppButton size="sm" tone="secondary" onClick={() => handleGatewayAction("restart")} disabled={gatewayLoading}>
                  <RotateCw size={13} />
                  重启
                </AppButton>
                <AppButton size="sm" tone="redSubtle" onClick={() => handleGatewayAction("stop")} disabled={gatewayLoading}>
                  <Square size={13} />
                  停止
                </AppButton>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="section-title">下载 OpenClaw</div>
        <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            请下载并安装 OpenClaw 独立版本，内置运行时，解压即用。
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, minWidth: 70 }}>Windows:</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>下载 .exe 安装向导，双击即装</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, minWidth: 70 }}>macOS:</span>
              <code style={{ fontSize: 12, background: "var(--card-bg-hover)", padding: "4px 8px", borderRadius: "var(--radius-xs)", fontFamily: "var(--font-mono)" }}>
                curl -fsSL https://dl.qrj.ai/openclaw/install.sh | bash
              </code>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, minWidth: 70 }}>Linux:</span>
              <code style={{ fontSize: 12, background: "var(--card-bg-hover)", padding: "4px 8px", borderRadius: "var(--radius-xs)", fontFamily: "var(--font-mono)" }}>
                curl -fsSL https://dl.qrj.ai/openclaw/install.sh | bash
              </code>
            </div>
          </div>

          <AppButton onClick={() => window.open(getDownloadUrl(), "_blank")} style={{ alignSelf: "flex-start" }}>
            <ExternalLink size={14} />
            下载地址
          </AppButton>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
