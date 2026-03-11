import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard,
  Briefcase,
  Link2,
  Calculator,
  Signal,
  FileText,
  History,
  Radio,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'g→d' },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase, shortcut: 'g→p' },
  { path: '/options', label: 'Options Chain', icon: Link2, shortcut: 'g→o' },
  { path: '/pricing', label: 'Price Options', icon: Calculator, shortcut: 'g→r' },
  { path: '/signals', label: 'Signals', icon: Signal, shortcut: 'g→s' },
  { path: '/orders', label: 'Orders', icon: FileText, shortcut: 'g→x' },
  { path: '/backtest', label: 'Backtest', icon: History, shortcut: 'g→b' },
  { path: '/live', label: 'Live Trading', icon: Radio, shortcut: 'g→l' },
];

export const Sidebar = ({ collapsed, onToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} data-testid="sidebar">
      <div className="sidebar-brand">
        <Zap className="brand-icon" />
        <div className="brand-text">
          <span>AlgoTrader</span>
          <span className="brand-subtitle">PDE-Powered</span>
        </div>
      </div>

      <button
        className="sidebar-toggle"
        onClick={onToggle}
        data-testid="sidebar-toggle"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <item.icon className="nav-icon" size={18} />
              <span>{item.label}</span>
              <span className="nav-shortcut">{item.shortcut}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="connection-status">
          <span className="status-dot" data-testid="connection-status" />
          <span className="connection-text">Connected</span>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          data-testid="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
};
