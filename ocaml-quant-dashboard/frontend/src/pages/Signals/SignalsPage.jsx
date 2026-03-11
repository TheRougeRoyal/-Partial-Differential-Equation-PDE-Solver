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
      <div className="page-header">
        <div>
          <h1 className="page-title">Trading Signals</h1>
          <p className="page-subtitle">AI-powered market signal feed</p>
        </div>
        <div className="page-actions">
          <button className="asset-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card buy" data-testid="stat-buy">
          <div className="stat-label">Buy Signals</div>
          <div className="stat-value buy">{stats.buyCount}</div>
        </div>
        <div className="stat-card sell" data-testid="stat-sell">
          <div className="stat-label">Sell Signals</div>
          <div className="stat-value sell">{stats.sellCount}</div>
        </div>
        <div className="stat-card hold" data-testid="stat-hold">
          <div className="stat-label">Hold Signals</div>
          <div className="stat-value hold">{stats.holdCount}</div>
        </div>
        <div className="stat-card" data-testid="stat-confidence">
          <div className="stat-label">Avg Confidence</div>
          <div className="stat-value">{stats.avgConfidence.toFixed(1)}%</div>
        </div>
      </div>

      <div className="signals-content">
        <div className="signals-filters">
          <div className="filter-group">
            <span className="filter-label">Asset</span>
            <select
              className="filter-select"
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              data-testid="asset-filter"
            >
              {ASSETS.map(a => (
                <option key={a} value={a}>{a === 'all' ? 'All Assets' : a}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Action</span>
            <div className="toggle-group">
              {ACTIONS.map(action => (
                <button
                  key={action}
                  className={`toggle-btn ${actionFilter === action ? 'active' : ''}`}
                  onClick={() => setActionFilter(action)}
                  data-testid={`action-toggle-${action}`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="signals-list">
          {filteredSignals.map((signal, index) => (
            <div className={`signal-card ${signal.action}`} key={signal.id} data-testid={`signal-card-${index}`}>
              <div className="signal-header">
                <div className="signal-meta">
                  <span className={`action-badge ${signal.action}`}>{signal.action}</span>
                  <span className="signal-asset">{signal.asset}</span>
                  <span className="signal-time">{formatDateTime(signal.timestamp)}</span>
                </div>
                <div className="signal-price">{formatCurrency(signal.price)}</div>
              </div>
              <div className="signal-body">
                <p className="signal-reason">{signal.reason}</p>
              </div>
              <div className="signal-footer">
                <div className="confidence-wrapper">
                  <span className="confidence-label">Confidence</span>
                  <div className="confidence-bar">
                    <div
                      className={`confidence-fill ${getConfidenceClass(signal.confidence)}`}
                      style={{ width: `${signal.confidence}%` }}
                    />
                  </div>
                  <span className="confidence-value">{signal.confidence.toFixed(0)}%</span>
                </div>
                <span className="model-tag">{signal.model}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
