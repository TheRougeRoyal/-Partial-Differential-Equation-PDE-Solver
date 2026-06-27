import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Toaster } from 'sonner';
import './Layout.css';

export const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-testid="layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <header className="platform-header">
        <div className="header-left">
          <span className="header-platform-name">PDE Quant Dashboard</span>
          <div className="header-divider" />
          <div className="header-market-status">
            <span>Execution Online</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span>{formatDate(currentTime)}</span>
          </div>
        </div>

        <div className="header-right">
          <div>
            <span className="header-clock">{formatTime(currentTime)}</span>
            <span className="header-clock-label">UTC</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
    </div>
  );
};
