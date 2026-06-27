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
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/options', label: 'Derivatives Chain', icon: Link2 },
  { path: '/pricing', label: 'Pricing Engine', icon: Calculator },
  { path: '/signals', label: 'Algo Signals', icon: Signal },
  { path: '/orders', label: 'Execution Blotter', icon: FileText },
  { path: '/backtest', label: 'Strategy Lab', icon: History },
  { path: '/live', label: 'Trading Desk', icon: Radio },
];

export const Sidebar = ({ collapsed, onToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        data-testid="sidebar"
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span className="brand-logo-symbol">∂</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">PDE Solver</span>
            <span className="brand-subtitle">Quant Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Navigation</div>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => setMobileOpen(false)}
              >
                <div className="nav-active-indicator" />
                <item.icon className="nav-icon" size={17} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom Status Section */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider" />

          <div className="sidebar-footer">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              data-testid="theme-toggle"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span className="theme-toggle-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
