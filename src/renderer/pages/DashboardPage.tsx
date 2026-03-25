import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Server, Zap } from 'lucide-react';

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

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

interface DashboardPageProps {
  onNavigate: (page: 'dashboard' | 'install' | 'channels' | 'settings') => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  function getStatusBadge(state: ServiceStatus['state']) {
    switch (state) {
      case 'RUNNING':
        return <span className="status-badge status-running">运行中</span>;
      case 'READY':
        return <span className="status-badge" style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--accent-yellow)' }}>已就绪</span>;
      case 'NOT_READY':
        return <span className="status-badge status-not-ready">未就绪</span>;
    }
  }

  function getFlowSteps() {
    if (!status) return [];
    return [
      { label: 'Node.js', done: status.nodeInstalled, current: false },
      { label: 'OpenClaw', done: status.openclawInstalled, current: status.nodeInstalled && !status.openclawInstalled },
      { label: 'Gateway', done: status.gatewayRunning, current: status.openclawInstalled && !status.gatewayRunning },
    ];
  }

  if (loading) {
    return <div className="page"><div className="page-header"><p>加载中...</p></div></div>;
  }

  const steps = getFlowSteps();

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 className="page-title">仪表盘</h1>
          {status && getStatusBadge(status.state)}
        </div>
        <p className="page-desc">
          {status?.state === 'RUNNING'
            ? '所有服务运行正常'
            : status?.state === 'READY'
              ? '请启动服务'
              : '请完成环境安装'}
        </p>
      </div>

      <div className="flow-steps">
        {steps.map((step, i) => (
          <div key={step.label} className="flow-step">
            <div className={`flow-step-icon ${step.done ? 'done' : step.current ? 'current' : 'pending'}`}>
              {step.done ? <CheckCircle size={12} /> : i + 1}
            </div>
            <span className="flow-step-label">{step.label}</span>
            {i < steps.length - 1 && <span style={{ color: 'var(--text-secondary)', marginLeft: 16 }}>→</span>}
          </div>
        ))}
      </div>

      <div className="card-grid">
        <div className="card card-stat">
          <div className="card-stat-icon">
            {status?.nodeInstalled ? <CheckCircle size={24} color="var(--accent-green)" /> : <XCircle size={24} color="var(--accent-red)" />}
          </div>
          <div className="card-stat-label">Node.js</div>
          <div className="card-stat-value">{status?.nodeVersion || '未安装'}</div>
        </div>

        <div className="card card-stat">
          <div className="card-stat-icon">
            {status?.openclawInstalled ? <CheckCircle size={24} color="var(--accent-green)" /> : <XCircle size={24} color="var(--accent-red)" />}
          </div>
          <div className="card-stat-label">OpenClaw</div>
          <div className="card-stat-value">{status?.openclawVersion || '未安装'}</div>
        </div>

        <div className="card card-stat">
          <div className="card-stat-icon">
            {status?.gatewayRunning ? <Server size={24} color="var(--accent-green)" /> : <Server size={24} color="var(--text-secondary)" />}
          </div>
          <div className="card-stat-label">Gateway</div>
          <div className="card-stat-value">{status?.gatewayRunning ? `PID ${status.gatewayPid}` : '已停止'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {status?.state === 'NOT_READY' && (
          <button className="btn btn-primary" onClick={() => onNavigate('install')}>
            <Zap size={16} /> 前往安装
          </button>
        )}
        {status?.state === 'RUNNING' && (
          <button className="btn btn-secondary" onClick={() => onNavigate('channels')}>
            消息渠道
          </button>
        )}
      </div>
    </div>
  );
}