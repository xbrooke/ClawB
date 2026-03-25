import { useState, useEffect } from 'react';
import { DashboardPage } from './renderer/pages/DashboardPage';
import { InstallPage } from './renderer/pages/InstallPage';
import { ChannelsPage } from './renderer/pages/ChannelsPage';
import { SettingsPage } from './renderer/pages/SettingsPage';

export type Page = 'dashboard' | 'install' | 'channels' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">ClawB</h1>
        </div>
        <ul className="nav-list">
          <li>
            <button
              className={`nav-item ${page === 'dashboard' ? 'active' : ''}`}
              onClick={() => setPage('dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${page === 'install' ? 'active' : ''}`}
              onClick={() => setPage('install')}
            >
              安装
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${page === 'channels' ? 'active' : ''}`}
              onClick={() => setPage('channels')}
            >
              渠道
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${page === 'settings' ? 'active' : ''}`}
              onClick={() => setPage('settings')}
            >
              设置
            </button>
          </li>
        </ul>
      </nav>
      <main className="content">
        {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
        {page === 'install' && <InstallPage />}
        {page === 'channels' && <ChannelsPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}