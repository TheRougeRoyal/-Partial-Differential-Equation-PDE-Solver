import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity, Target, Percent, Download } from 'lucide-react';
import { generatePrediction, generatePredictionHistory, ApiClient } from '../../utils/mockData';
import { formatCurrency, formatPercent, formatTimestamp } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './DashboardPage.css';

const ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

export const DashboardPage = () => {
  const [selectedAsset, setSelectedAsset] = useState('BTC-USD');
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const { toggleTheme } = useTheme();

  const loadData = useCallback(async () => {
    try {
      const data = await ApiClient.get('/predictions');
      if (data?.current) {
        setPrediction(data.current);
        setHistory(data.history || generatePredictionHistory(selectedAsset));
        return;
      }
    } catch {}
    setPrediction(generatePrediction(selectedAsset));
    setHistory(generatePredictionHistory(selectedAsset));
  }, [selectedAsset]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleExportCSV = () => {
    exportToCSV(history, `predictions-${selectedAsset}`);
    toast.success('Exported to CSV');
  };

  const handleExportJSON = () => {
    exportToJSON({ prediction, history }, `predictions-${selectedAsset}`);
    toast.success('Exported to JSON');
  };

  useKeyboardShortcuts({
    toggleTheme,
    exportCSV: handleExportCSV,
    exportJSON: handleExportJSON,
  });

  if (!prediction) return null;

  const getConfidenceClass = (confidence) => {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  };

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Live market signals, model conviction, and execution-ready price targets</p>
        </div>
        <div className="page-actions">
          <div className="asset-selector">
            {ASSETS.map((asset) => (
              <button
                key={asset}
                className={`asset-btn ${selectedAsset === asset ? 'active' : ''}`}
                onClick={() => setSelectedAsset(asset)}
                data-testid={`asset-btn-${asset}`}
              >
                {asset}
              </button>
            ))}
          </div>
          <button className="asset-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" data-testid="metric-current-price">
          <div className="metric-card-header">
            <div className="metric-icon cyan">
              <TrendingUp size={14} />
            </div>
            <span className="metric-label">Market Price</span>
          </div>
          <div className="metric-value">{formatCurrency(prediction.currentPrice)}</div>
          <div className="metric-sparkline">
            <div className="metric-sparkline-fill cyan" style={{ width: '72%' }} />
          </div>
        </div>

        <div className="metric-card" data-testid="metric-predicted-price">
          <div className="metric-card-header">
            <div className="metric-icon green">
              <Target size={14} />
            </div>
            <span className="metric-label">Algo Target</span>
          </div>
          <div className={`metric-value ${prediction.predictedPrice >= prediction.currentPrice ? 'positive' : 'negative'}`}>
            {formatCurrency(prediction.predictedPrice)}
          </div>
          <div className={`metric-change ${prediction.predictedPrice >= prediction.currentPrice ? 'positive' : 'negative'}`}>
            {formatPercent((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100)}
          </div>
          <div className="metric-sparkline">
            <div
              className={`metric-sparkline-fill ${prediction.predictedPrice >= prediction.currentPrice ? 'green' : 'red'}`}
              style={{ width: '85%' }}
            />
          </div>
        </div>

        <div className="metric-card" data-testid="metric-confidence">
          <div className="metric-card-header">
            <div className="metric-icon amber">
              <Percent size={14} />
            </div>
            <span className="metric-label">Signal Conviction</span>
          </div>
          <div className="metric-value">{prediction.confidence.toFixed(1)}%</div>
          <div className="confidence-bar">
            <div
              className={`confidence-fill ${getConfidenceClass(prediction.confidence)}`}
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>
          <div className="metric-sparkline">
            <div className="metric-sparkline-fill amber" style={{ width: `${prediction.confidence}%` }} />
          </div>
        </div>

        <div className="metric-card" data-testid="metric-accuracy">
          <div className="metric-card-header">
            <div className="metric-icon purple">
              <Activity size={14} />
            </div>
            <span className="metric-label">Strategy Accuracy</span>
          </div>
          <div className="metric-value">{prediction.accuracy.toFixed(1)}%</div>
          <div className="metric-sparkline">
            <div className="metric-sparkline-fill green" style={{ width: `${prediction.accuracy}%` }} />
          </div>
        </div>
      </div>

      <div className="section-divider" />

      <div className="chart-section">
        <div className="section-title">
          <Activity size={14} />
          Price: Actual vs Predicted
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                stroke="var(--text-secondary)"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="var(--text-secondary)"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                tick={{ fill: 'var(--text-secondary)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  boxShadow: 'var(--shadow-md)',
                }}
                labelStyle={{ color: 'var(--text-secondary)', fontSize: '10px' }}
                formatter={(value) => [formatCurrency(value), '']}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#00b4d8"
                strokeWidth={1.5}
                fill="url(#actualGradient)"
                name="Actual"
                dot={false}
                activeDot={{ r: 3, stroke: '#00b4d8', strokeWidth: 2, fill: '#0a0e17' }}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#00d4aa"
                strokeWidth={1.5}
                fill="url(#predictedGradient)"
                name="Algo Target"
                dot={false}
                activeDot={{ r: 3, stroke: '#00d4aa', strokeWidth: 2, fill: '#0a0e17' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="legend-container">
          <div className="legend-item">
            <div className="legend-dot actual" />
            <span>Market Price</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot predicted" />
            <span>Algo Target</span>
          </div>
        </div>
      </div>

      <div className="section-divider" />

      <div className="predictions-table" data-testid="predictions-table">
        <div className="section-title" style={{ padding: '14px 16px 0' }}>
          Recent Signal Targets
        </div>
        <div className="table-header">
          <div className="table-header-cell">Time</div>
          <div className="table-header-cell">Market</div>
          <div className="table-header-cell">Target</div>
          <div className="table-header-cell">Slippage %</div>
          <div className="table-header-cell">Conviction</div>
        </div>
        {history.slice(-10).reverse().map((item, index) => (
          <div className="table-row" key={index} data-testid={`prediction-row-${index}`}>
            <div className="table-cell secondary">
              {new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="table-cell">{formatCurrency(item.actual)}</div>
            <div className="table-cell">{formatCurrency(item.predicted)}</div>
            <div className="table-cell">{item.error.toFixed(2)}%</div>
            <div className="table-cell">
              <div className="confidence-bar">
                <div
                  className={`confidence-fill ${getConfidenceClass(item.confidence)}`}
                  style={{ width: `${item.confidence}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
