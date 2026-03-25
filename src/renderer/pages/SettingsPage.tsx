import { useState, useEffect } from 'react';

interface Config {
  apiKey?: string;
  provider?: string;
  model?: string;
}

export function SettingsPage() {
  const [config, setConfig] = useState<Config>({});
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const result = await window.electronAPI.invoke('config:read') as Config | null;
      if (result) {
        setConfig(result);
        setApiKey(result.apiKey || '');
        setProvider(result.provider || 'openai');
        setModel(result.model || 'gpt-4');
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const result = await window.electronAPI.invoke('config:write', {
        apiKey,
        provider,
        model,
      }) as { success: boolean; message: string };
      if (result.success) {
        setMessage('配置已保存');
      } else {
        setMessage('保存失败: ' + result.message);
      }
    } catch (e) {
      setMessage('保存失败: ' + String(e));
    }
    setSaving(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">设置</h1>
        <p className="page-desc">配置 API 和模型参数</p>
      </div>

      <div className="card">
        <div className="form-group">
          <label className="form-label">API Key</label>
          <input
            type="password"
            className="form-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Provider</label>
          <select
            className="form-input"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="azure">Azure OpenAI</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Model</label>
          <input
            type="text"
            className="form-input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存配置'}
        </button>

        {message && (
          <p style={{ marginTop: 12, fontSize: 13, color: message.includes('失败') ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}