import { useState, useEffect, useRef } from 'react';
import { Download, Play, Square, Terminal } from 'lucide-react';

interface ServiceStatus {
  state: 'NOT_READY' | 'READY' | 'RUNNING';
  openclawInstalled: boolean;
  openclawVersion: string | null;
  gatewayRunning: boolean;
  gatewayPid: number | null;
  nodeInstalled: boolean;
  nodeVersion: string | null;
  configExists: boolean;
}

export function InstallPage() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  async function fetchStatus() {
    try {
      const result = await window.electronAPI.invoke('state:get') as ServiceStatus;
      setStatus(result);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  function addLog(msg: string) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  async function handleInstall() {
    setPreparing(true);
    setLogs([]);
    addLog('开始安装 OpenClaw...');

    try {
      const result = await window.electronAPI.invoke('openclaw:install') as { success: boolean; message: string };
      if (result.success) {
        addLog('✅ ' + result.message);
      } else {
        addLog('❌ ' + result.message);
      }
    } catch (e) {
      addLog('❌ 安装失败: ' + String(e));
    }

    setPreparing(false);
    await fetchStatus();
  }

  async function handleStart() {
    setActionLoading('start');
    addLog('正在启动 Gateway...');

    try {
      const result = await window.electronAPI.invoke('gateway:start') as { success: boolean; message: string };
      if (result.success) {
        addLog('✅ ' + result.message);
      } else {
        addLog('❌ ' + result.message);
      }
    } catch (e) {
      addLog('❌ 启动失败: ' + String(e));
    }

    setActionLoading(null);
    await fetchStatus();
  }

  async function handleStop() {
    setActionLoading('stop');
    addLog('正在停止 Gateway...');

    try {
      const result = await window.electronAPI.invoke('gateway:stop') as { success: boolean; message: string };
      if (result.success) {
        addLog('✅ ' + result.message);
      } else {
        addLog('❌ ' + result.message);
      }
    } catch (e) {
      addLog('❌ 停止失败: ' + String(e));
    }

    setActionLoading(null);
    await fetchStatus();
  }

  function getMainButton() {
    if (!status) return null;

    if (preparing) {
      return <button className="btn btn-primary" disabled>准备中...</button>;
    }

    switch (status.state) {
      case 'NOT_READY':
        return (
          <button className="btn btn-primary" onClick={handleInstall}>
            <Download size={16} /> 一键安装
          </button>
        );
      case 'READY':
        return (
          <button className="btn btn-primary" onClick={handleStart} disabled={actionLoading === 'start'}>
            <Play size={16} /> 启动服务
          </button>
        );
      case 'RUNNING':
        return (
          <button className="btn btn-secondary" onClick={handleStop} disabled={actionLoading === 'stop'}>
            <Square size={16} /> 停止服务
          </button>
        );
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">环境安装</h1>
        <p className="page-desc">
          {status?.state === 'RUNNING'
            ? '服务运行中'
            : status?.state === 'READY'
              ? '环境就绪，可以启动服务'
              : '点击一键安装 OpenClaw 环境'}
        </p>
      </div>

      <div className="card-grid">
        <div className="card card-stat">
          <div className="card-stat-icon">
            {status?.nodeInstalled ? (
              <span style={{ color: 'var(--accent-green)' }}>✓</span>
            ) : (
              <span style={{ color: 'var(--accent-red)' }}>✗</span>
            )}
          </div>
          <div className="card-stat-label">Node.js</div>
          <div className="card-stat-value">{status?.nodeVersion || '未安装'}</div>
        </div>

        <div className="card card-stat">
          <div className="card-stat-icon">
            {status?.openclawInstalled ? (
              <span style={{ color: 'var(--accent-green)' }}>✓</span>
            ) : (
              <span style={{ color: 'var(--accent-red)' }}>✗</span>
            )}
          </div>
          <div className="card-stat-label">OpenClaw</div>
          <div className="card-stat-value">{status?.openclawVersion || '未安装'}</div>
        </div>

        <div className="card card-stat">
          <div className="card-stat-icon">
            {status?.gatewayRunning ? (
              <span style={{ color: 'var(--accent-green)' }}>✓</span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>○</span>
            )}
          </div>
          <div className="card-stat-label">Gateway</div>
          <div className="card-stat-value">{status?.gatewayRunning ? '运行中' : '已停止'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {getMainButton()}
      </div>

      {logs.length > 0 && (
        <div className="log-panel">
          <div className="log-header">
            <Terminal size={14} /> 日志
          </div>
          <div className="log-content">
            {logs.map((log, i) => (
              <div key={i} className="log-line">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}