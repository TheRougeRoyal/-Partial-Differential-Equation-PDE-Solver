import { useState, useEffect, useMemo } from 'react';
import { Signal, Download } from 'lucide-react';
import { generateSignals } from '../../utils/mockData';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './SignalsPage.css';

const ASSETS = ['all', 'BTC-USD', 'ETH-USD', 'SOL-USD'];
const ACTIONS = ['all', 'buy', 'sell', 'hold'];

export const SignalsPage = () => {
  const [signals, setSignals] = useState([]);
  const [assetFilter, setAssetFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const { toggleTheme } = useTheme();

  useEffect(() => {
    setSignals(generateSignals(30));
    const interval = setInterval(() => {
      setSignals(prev => {
        const newSignal = generateSignals(1)[0];
        return [newSignal, ...prev.slice(0, 29)];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      const assetMatch = assetFilter === 'all' || signal.asset === assetFilter;
      const actionMatch = actionFilter === 'all' || signal.action === actionFilter;
      return assetMatch && actionMatch;
    });
  }, [signals, assetFilter, actionFilter]);

  const stats = useMemo(() => {
    const buyCount = signals.filter(s => s.action === 'buy').length;
    const sellCount = signals.filter(s => s.action === 'sell').length;
    const holdCount = signals.filter(s => s.action === 'hold').length;
    const avgConfidence = signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length || 0;
    return { buyCount, sellCount, holdCount, avgConfidence };
  }, [signals]);

  const handleExportCSV = () => {
    const exportData = filteredSignals.map(s => ({
      timestamp: s.timestamp.toISOString(),
      asset: s.asset,
      action: s.action,
      price: s.price,
      confidence: s.confidence,
      reason: s.reason,
      model: s.model,
    }));
    exportToCSV(exportData, 'trading-signals');
    toast.success('Exported signals to CSV');
  };

  const handleExportJSON = () => {
    exportToJSON(filteredSignals, 'trading-signals');
    toast.success('Exported signals to JSON');
  };

  useKeyboardShortcuts({
    toggleTheme,
    exportCSV: handleExportCSV,
    exportJSON: handleExportJSON,
  });

  const getConfidenceClass = (confidence) => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  };

  return (
    <div className="signals-page" data-testid="signals-page">
      {/* ── Header ── */}
      <div className="signals-page-header">
        <div className="signals-title-group">
          <div className="signals-icon-wrap">
            <Signal size={20} className="signals-radar-icon" />
            <span className="signals-radar-ping" />
          </div>
          <div>
            <h1 className="signals-page-title">Signal Feed</h1>
            <p className="signals-page-subtitle">Strategy-ranked trade signals and model conviction · live</p>
          </div>
        </div>
        <div className="signals-header-actions">
          <button className="signals-export-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={13} />
            <span>CSV</span>
          </button>
          <button className="signals-export-btn" onClick={handleExportJSON}>
            <Download size={13} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="signals-stats-strip">
        <div className="signals-stat-card" data-testid="stat-buy">
          <span className="signals-stat-dot dot-buy" />
          <div className="signals-stat-info">
            <span className="signals-stat-label">BUY</span>
            <span className="signals-stat-value value-buy">{stats.buyCount}</span>
          </div>
        </div>
        <div className="signals-stat-card" data-testid="stat-sell">
          <span className="signals-stat-dot dot-sell" />
          <div className="signals-stat-info">
            <span className="signals-stat-label">SELL</span>
            <span className="signals-stat-value value-sell">{stats.sellCount}</span>
          </div>
        </div>
        <div className="signals-stat-card" data-testid="stat-hold">
          <span className="signals-stat-dot dot-hold" />
          <div className="signals-stat-info">
            <span className="signals-stat-label">HOLD</span>
            <span className="signals-stat-value value-hold">{stats.holdCount}</span>
          </div>
        </div>
        <div className="signals-stat-card" data-testid="stat-confidence">
          <span className="signals-stat-dot dot-conf" />
          <div className="signals-stat-info">
            <span className="signals-stat-label">AVG CONF</span>
            <span className="signals-stat-value">{stats.avgConfidence.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* ── Floating Filter Toolbar ── */}
      <div className="signals-toolbar">
        <div className="signals-filter-section">
          <span className="signals-filter-label">ASSET</span>
          <select
            className="signals-filter-select"
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            data-testid="asset-filter"
          >
            {ASSETS.map(a => (
              <option key={a} value={a}>{a === 'all' ? 'All Assets' : a}</option>
            ))}
          </select>
        </div>

        <div className="signals-filter-divider" />

        <div className="signals-filter-section">
          <span className="signals-filter-label">SIGNAL</span>
          <div className="signals-toggle-group">
            {ACTIONS.map(action => (
              <button
                key={action}
                className={`signals-toggle-btn ${actionFilter === action ? 'active' : ''} ${action !== 'all' ? action : ''}`}
                onClick={() => setActionFilter(action)}
                data-testid={`action-toggle-${action}`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Signal Feed ── */}
      <div className="signals-feed">
        {filteredSignals.map((signal, index) => (
          <div
            className={`signal-row ${signal.action}`}
            key={signal.id}
            data-testid={`signal-card-${index}`}
            style={{ animationDelay: `${Math.min(index * 0.04, 0.8)}s` }}
          >
            <div className={`signal-row-bar bar-${signal.action}`} />

            <div className="signal-row-content">
              <div className="signal-row-top">
                <span className={`signal-action-badge badge-${signal.action}`}>{signal.action}</span>
                <span className="signal-row-asset">{signal.asset}</span>
                <span className="signal-row-time">{formatDateTime(signal.timestamp)}</span>
              </div>
              <div className="signal-row-middle">
                <p className="signal-row-reason">{signal.reason}</p>
              </div>
              <div className="signal-row-bottom">
                <span className="signal-row-price">{formatCurrency(signal.price)}</span>
                <div className="signal-row-confidence">
                  <span className="confidence-lbl">CONF</span>
                  <div className="confidence-track">
                    <div
                      className={`confidence-bar-fill ${getConfidenceClass(signal.confidence)}`}
                      style={{ width: `${signal.confidence}%` }}
                    />
                  </div>
                  <span className="confidence-pct">{signal.confidence.toFixed(0)}%</span>
                </div>
                <span className="signal-row-model">{signal.model}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
