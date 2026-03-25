import { useState, useEffect } from 'react';
import { Link2, Unlink } from 'lucide-react';

type ChannelStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ChannelInfo {
  type: string;
  name: string;
  status: ChannelStatus;
}

export function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelInfo[]>([
    { type: 'wechat', name: '微信', status: 'disconnected' },
  ]);
  const [loading, setLoading] = useState<string | null>(null);

  async function fetchChannelStatus() {
    const statuses = await Promise.all(
      channels.map(async (ch) => {
        try {
          const status = await window.electronAPI.invoke('channel:status', ch.type) as ChannelStatus;
          return { ...ch, status };
        } catch {
          return { ...ch, status: 'error' as ChannelStatus };
        }
      })
    );
    setChannels(statuses);
  }

  useEffect(() => {
    fetchChannelStatus();
  }, []);

  async function handleConnect(type: string) {
    setLoading(type);
    try {
      const result = await window.electronAPI.invoke('channel:connect', type) as { success: boolean; message: string };
      if (result.success) {
        await fetchChannelStatus();
      } else {
        alert('连接失败: ' + result.message);
      }
    } catch (e) {
      alert('连接失败: ' + String(e));
    }
    setLoading(null);
  }

  async function handleDisconnect(type: string) {
    setLoading(type);
    try {
      const result = await window.electronAPI.invoke('channel:disconnect', type) as { success: boolean; message: string };
      if (result.success) {
        await fetchChannelStatus();
      } else {
        alert('断开失败: ' + result.message);
      }
    } catch (e) {
      alert('断开失败: ' + String(e));
    }
    setLoading(null);
  }

  function getStatusText(status: ChannelStatus): string {
    switch (status) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'error': return '异常';
      case 'disconnected': return '未连接';
    }
  }

  function getStatusClass(status: ChannelStatus): string {
    switch (status) {
      case 'connected': return 'status-running';
      case 'connecting': return 'status-connecting';
      case 'error': return 'status-not-ready';
      case 'disconnected': return '';
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">消息渠道</h1>
        <p className="page-desc">管理消息推送渠道</p>
      </div>

      <div className="channel-list">
        {channels.map((channel) => (
          <div key={channel.type} className="card channel-item">
            <div className="channel-info">
              <div className="channel-icon">
                {channel.type === 'wechat' ? '💬' : '📢'}
              </div>
              <div>
                <div className="channel-name">{channel.name}</div>
                <div className={`channel-status ${getStatusClass(channel.status)}`}>
                  {getStatusText(channel.status)}
                </div>
              </div>
            </div>
            <div className="channel-actions">
              {channel.status === 'connected' ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDisconnect(channel.type)}
                  disabled={loading === channel.type}
                >
                  <Unlink size={16} /> 断开
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleConnect(channel.type)}
                  disabled={loading === channel.type || channel.status === 'connecting'}
                >
                  <Link2 size={16} /> 连接
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}