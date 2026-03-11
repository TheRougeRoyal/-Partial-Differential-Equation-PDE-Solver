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
import { generatePrediction, generatePredictionHistory } from '../../utils/mockData';
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

  const loadData = useCallback(() => {
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
          <h1 className="page-title">Price Prediction</h1>
          <p className="page-subtitle">Real-time ML predictions with confidence intervals</p>
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
          <div className="metric-label">
            <TrendingUp size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Current Price
          </div>
          <div className="metric-value">{formatCurrency(prediction.currentPrice)}</div>
        </div>

        <div className="metric-card" data-testid="metric-predicted-price">
          <div className="metric-label">
            <Target size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Predicted Price
          </div>
          <div className={`metric-value ${prediction.predictedPrice >= prediction.currentPrice ? 'positive' : 'negative'}`}>
            {formatCurrency(prediction.predictedPrice)}
          </div>
          <div className={`metric-change ${prediction.predictedPrice >= prediction.currentPrice ? 'positive' : 'negative'}`}>
            {formatPercent((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100)}
          </div>
        </div>

        <div className="metric-card" data-testid="metric-confidence">
          <div className="metric-label">
            <Percent size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Confidence
          </div>
          <div className="metric-value">{prediction.confidence.toFixed(1)}%</div>
          <div className="confidence-bar">
            <div
              className={`confidence-fill ${getConfidenceClass(prediction.confidence)}`}
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>
        </div>

        <div className="metric-card" data-testid="metric-accuracy">
          <div className="metric-label">
            <Activity size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Model Accuracy
          </div>
          <div className="metric-value">{prediction.accuracy.toFixed(1)}%</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="section-title">
          <Activity size={16} />
          Predicted vs Actual Price
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f6feb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1f6feb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3fb950" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                stroke="var(--text-secondary)"
                fontSize={10}
                fontFamily="JetBrains Mono"
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="var(--text-secondary)"
                fontSize={10}
                fontFamily="JetBrains Mono"
                tickFormatter={(v) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--text-secondary)' }}
                formatter={(value) => [formatCurrency(value), '']}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#1f6feb"
                strokeWidth={2}
                fill="url(#actualGradient)"
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#3fb950"
                strokeWidth={2}
                fill="url(#predictedGradient)"
                name="Predicted"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="legend-container">
          <div className="legend-item">
            <div className="legend-dot actual" />
            <span>Actual Price</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot predicted" />
            <span>Predicted Price</span>
          </div>
        </div>
      </div>

      <div className="predictions-table" data-testid="predictions-table">
        <div className="section-title" style={{ padding: '16px 16px 0' }}>
          Recent Predictions
        </div>
        <div className="table-header">
          <div className="table-header-cell">Time</div>
          <div className="table-header-cell">Actual</div>
          <div className="table-header-cell">Predicted</div>
          <div className="table-header-cell">Error %</div>
          <div className="table-header-cell">Confidence</div>
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
