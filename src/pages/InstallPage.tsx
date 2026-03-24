import { useEffect, useState, useCallback } from "react";
import { Loader, CheckCircle, XCircle, Cpu, Zap, Play, Square, RotateCw, Download, ExternalLink, AlertCircle } from "lucide-react";
import { AppButton } from "@/components/AppButton";
import { platform } from "@/openclaw/platform";
import {
  detectNode,
  detectOpenClaw,
  detectGateway,
  InstallState,
} from "@/openclaw/detect";
import {
  installOpenClaw,
  onboardOpenClaw,
  startGatewayService,
  stopGatewayService,
  restartGatewayService,
  getRequiredActions,
  InstallStage,
  type InstallResult,
} from "@/openclaw/install";


interface NodeInfo {
  version: string | null;
  path: string | null;
}

interface OpenClawInfo {
  version: string | null;
  path: string | null;
  hasConfig: boolean;
}

interface GatewayInfo {
  running: boolean;
  pid: number | null;
}

export function InstallPage() {
  const [detecting, setDetecting] = useState(true);
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [openclawInfo, setOpenclawInfo] = useState<OpenClawInfo | null>(null);
  const [gatewayInfo, setGatewayInfo] = useState<GatewayInfo>({ running: false, pid: null });
  const [installState, setInstallState] = useState<InstallState>(InstallState.UNKNOWN);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [issues, setIssues] = useState<string[]>([]);

  // Progress callback for installation
  const handleProgress = useCallback((_stage: InstallStage, message: string) => {
    setProgress(message);
  }, []);

  // Detect current status
  const checkStatus = useCallback(async () => {
    setDetecting(true);
    try {
      const [node, openclaw, gateway] = await Promise.all([
        detectNode(),
        detectOpenClaw(),
        detectGateway(),
      ]);

      setNodeInfo({
        version: node.version,
        path: node.path,
      });

      setOpenclawInfo({
        version: openclaw.version,
        path: openclaw.path,
        hasConfig: openclaw.hasConfig,
      });

      setGatewayInfo({
        running: gateway.running,
        pid: gateway.pid,
      });

      // Determine state
      if (!node.exists || !openclaw.exists) {
        setInstallState(InstallState.NOT_INSTALLED);
      } else if (!openclaw.hasConfig) {
        setInstallState(InstallState.CONFIG_MISSING);
      } else if (!gateway.running) {
        setInstallState(InstallState.INSTALLED);
      } else {
        setInstallState(InstallState.READY);
      }

      // Get issues
      const actions = await getRequiredActions();
      setIssues(actions.issues);
    } catch (e) {
      console.error("Status check failed:", e);
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Handle Install button
  const handleInstall = async () => {
    setActionLoading("install");
    setProgress("开始安装...");
    try {
      const result = await installOpenClaw(handleProgress);
      if (result.success) {
        setProgress("安装完成！");
      } else {
        setProgress(`安装失败: ${result.error}`);
      }
    } catch (e) {
      setProgress(`安装失败: ${e}`);
    } finally {
      setActionLoading(null);
      await checkStatus();
    }
  };

  // Handle Onboard button
  const handleOnboard = async () => {
    setActionLoading("onboard");
    setProgress("正在初始化...");
    try {
      const result = await onboardOpenClaw(handleProgress);
      if (result.success) {
        setProgress("初始化完成！");
      } else {
        setProgress(`初始化失败: ${result.error}`);
      }
    } catch (e) {
      setProgress(`初始化失败: ${e}`);
    } finally {
      setActionLoading(null);
      await checkStatus();
    }
  };

  // Handle Gateway action
  const handleGatewayAction = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);
    setProgress("");
    try {
      let result: InstallResult;
      if (action === "start") {
        result = await startGatewayService();
      } else if (action === "stop") {
        result = await stopGatewayService();
      } else {
        result = await restartGatewayService();
      }
      if (result.success) {
        setProgress(result.message || "操作完成");
      } else {
        setProgress(`操作失败: ${result.error}`);
      }
    } catch (e) {
      setProgress(`操作失败: ${e}`);
    } finally {
      setActionLoading(null);
      await checkStatus();
    }
  };

  // Render status indicator
  const StatusIndicator = ({ status, label, sublabel }: {
    status: "checking" | "installed" | "missing" | "ready";
    label: string;
    sublabel?: string;
  }) => {
    if (status === "checking") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Loader size={16} style={{ color: "var(--accent-orange)", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>检测中...</span>
        </div>
      );
    }
    if (status === "installed" || status === "ready") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={16} style={{ color: "var(--accent-green)" }} />
          <span style={{ fontSize: 13, color: "var(--accent-green)", fontWeight: 500 }}>{label}</span>
          {sublabel && <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: 4 }}>{sublabel}</span>}
        </div>
      );
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <XCircle size={16} style={{ color: "var(--accent-red)" }} />
        <span style={{ fontSize: 13, color: "var(--accent-red)" }}>{label}</span>
      </div>
    );
  };

  // Get download URL
  const getDownloadUrl = () => {
    return "https://github.com/qingchencloud/openclaw-standalone/releases/latest";
  };

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px 0" }}>环境安装</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          {detecting ? "正在检测环境..." : `当前状态: ${installState}`}
        </p>
      </div>

      {/* Status Cards */}
      <div>
        <div className="section-title">环境状态</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Node.js Status */}
          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Cpu size={18} style={{ color: "var(--accent-blue)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Node.js</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {nodeInfo?.version ? `v${nodeInfo.version}` : (platform.isWindows ? "Windows" : "macOS / Linux")}
                </div>
              </div>
            </div>
            <StatusIndicator
              status={nodeInfo?.version ? "installed" : "missing"}
              label={nodeInfo?.version ? "已安装" : "未安装"}
            />
          </div>

          {/* OpenClaw Status */}
          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Zap size={18} style={{ color: "var(--accent-purple)" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>OpenClaw</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {openclawInfo?.version ? `v${openclawInfo.version}` : "消息渠道核心"}
                  {openclawInfo?.hasConfig === false && <span style={{ color: "var(--accent-orange)" }}> (未初始化)</span>}
                </div>
              </div>
            </div>
            <StatusIndicator
              status={openclawInfo?.version ? (openclawInfo.hasConfig ? "ready" : "installed") : "missing"}
              label={!openclawInfo?.version ? "未安装" : openclawInfo.hasConfig ? "就绪" : "已安装"}
            />
          </div>

          {/* Gateway Status */}
          <div className="glass-card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                className={`status-dot ${gatewayInfo.running ? "running" : "stopped"}`}
                style={{ margin: 0 }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Gateway</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {gatewayInfo.running ? `运行中 (PID: ${gatewayInfo.pid})` : "未运行"}
                </div>
              </div>
            </div>
            <StatusIndicator
              status={gatewayInfo.running ? "ready" : "missing"}
              label={gatewayInfo.running ? "运行中" : "已停止"}
            />
          </div>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <div className="section-title">待处理问题</div>
          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {issues.map((issue, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={14} style={{ color: "var(--accent-orange)" }} />
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{issue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <div className="section-title">操作</div>
        <div className="glass-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Progress output */}
          {progress && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                background: "var(--card-bg-hover)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                maxHeight: 100,
                overflow: "auto",
              }}
            >
              {progress}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Install button - show when not installed or config missing */}
            {(installState === InstallState.NOT_INSTALLED || installState === InstallState.CONFIG_MISSING) && (
              <AppButton
                onClick={handleInstall}
                disabled={actionLoading !== null}
              >
                {actionLoading === "install" ? (
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Download size={14} />
                )}
                {installState === InstallState.NOT_INSTALLED ? "安装 OpenClaw" : "重新安装"}
              </AppButton>
            )}

            {/* Onboard button - show when installed but no config */}
            {installState === InstallState.INSTALLED && (
              <AppButton
                onClick={handleOnboard}
                disabled={actionLoading !== null}
              >
                {actionLoading === "onboard" ? (
                  <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Zap size={14} />
                )}
                初始化 OpenClaw
              </AppButton>
            )}

            {/* Gateway controls - show when ready */}
            {installState === InstallState.READY && (
              <>
                {!gatewayInfo.running ? (
                  <AppButton onClick={() => handleGatewayAction("start")} disabled={actionLoading !== null}>
                    <Play size={14} />
                    启动 Gateway
                  </AppButton>
                ) : (
                  <>
                    <AppButton
                      tone="secondary"
                      onClick={() => handleGatewayAction("restart")}
                      disabled={actionLoading !== null}
                    >
                      <RotateCw size={14} />
                      重启
                    </AppButton>
                    <AppButton
                      tone="redSubtle"
                      onClick={() => handleGatewayAction("stop")}
                      disabled={actionLoading !== null}
                    >
                      <Square size={14} />
                      停止
                    </AppButton>
                  </>
                )}
              </>
            )}

            {/* Refresh button */}
            <AppButton tone="secondary" onClick={checkStatus} disabled={actionLoading !== null || detecting}>
              <Loader size={14} />
              刷新状态
            </AppButton>
          </div>

          {/* Help text */}
          <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {installState === InstallState.NOT_INSTALLED && "点击上方按钮安装 OpenClaw"}
            {installState === InstallState.CONFIG_MISSING && "OpenClaw 已安装，需要初始化配置"}
            {installState === InstallState.INSTALLED && "Gateway 未运行，请先初始化或启动"}
            {installState === InstallState.READY && gatewayInfo.running && "一切就绪！Gateway 正在运行"}
            {installState === InstallState.READY && !gatewayInfo.running && "Gateway 未运行"}
          </div>
        </div>
      </div>

      {/* Manual Download */}
      <div>
        <div className="section-title">手动下载</div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {platform.isWindows
                ? "下载 Windows 独立安装包"
                : "使用终端命令安装"}
            </div>
            <AppButton
              tone="secondary"
              size="sm"
              onClick={() => window.open(getDownloadUrl(), "_blank")}
            >
              <ExternalLink size={13} />
              下载地址
            </AppButton>
          </div>
          {platform.isWindows && (
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>
              Windows 用户也可以双击 .exe 文件进行安装
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
