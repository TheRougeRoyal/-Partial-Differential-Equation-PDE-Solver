import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { History, TrendingUp, Download } from 'lucide-react';
import { generateBacktestResults, generateEquityCurve, generateMonthlyReturns } from '../../utils/mockData';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './BacktestPage.css';

const PERIODS = ['1M', '3M', '6M', '1Y'];

export const BacktestPage = () => {
  const [period, setPeriod] = useState('1Y');
  const [results, setResults] = useState(null);
  const [equityCurve, setEquityCurve] = useState([]);
  const [monthlyReturns, setMonthlyReturns] = useState([]);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const periodDays = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period];
    setResults(generateBacktestResults(period));
    setEquityCurve(generateEquityCurve(periodDays));
    setMonthlyReturns(generateMonthlyReturns());
  }, [period]);

  const handleExportCSV = () => {
    exportToCSV(equityCurve, `backtest-equity-${period}`);
    toast.success('Exported equity curve to CSV');
  };

  const handleExportJSON = () => {
    exportToJSON({ results, equityCurve, monthlyReturns }, `backtest-data-${period}`);
    toast.success('Exported backtest data to JSON');
  };

  useKeyboardShortcuts({
    toggleTheme,
    exportCSV: handleExportCSV,
    exportJSON: handleExportJSON,
  });

  if (!results) return null;

  return (
    <div className="backtest-page" data-testid="backtest-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backtest Results</h1>
          <p className="page-subtitle">Historical strategy performance analysis</p>
        </div>
        <div className="page-actions">
          <div className="period-selector">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
                data-testid={`period-btn-${p}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="asset-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" data-testid="metric-return">
          <div className="metric-label">Total Return</div>
          <div className={`metric-value ${results.totalReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(results.totalReturn)}
          </div>
        </div>
        <div className="metric-card" data-testid="metric-sharpe">
          <div className="metric-label">Sharpe Ratio</div>
          <div className="metric-value accent">{results.sharpe.toFixed(2)}</div>
        </div>
        <div className="metric-card" data-testid="metric-sortino">
          <div className="metric-label">Sortino Ratio</div>
          <div className="metric-value">{results.sortino.toFixed(2)}</div>
        </div>
        <div className="metric-card" data-testid="metric-drawdown">
          <div className="metric-label">Max Drawdown</div>
          <div className="metric-value negative">{formatPercent(results.maxDrawdown)}</div>
        </div>
        <div className="metric-card" data-testid="metric-winrate">
          <div className="metric-label">Win Rate</div>
          <div className="metric-value">{results.winRate.toFixed(1)}%</div>
        </div>
        <div className="metric-card" data-testid="metric-trades">
          <div className="metric-label">Total Trades</div>
          <div className="metric-value">{results.totalTrades}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-section">
          <div className="section-title">
            <TrendingUp size={16} />
            Equity Curve
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short' })}
                  stroke="var(--text-secondary)"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#1f6feb"
                  strokeWidth={2}
                  dot={false}
                  name="Strategy"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#8b949e"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Benchmark"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-container">
            <div className="legend-item">
              <div className="legend-line strategy" />
              <span>Strategy</span>
            </div>
            <div className="legend-item">
              <div className="legend-line benchmark" />
              <span>Benchmark</span>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <div className="section-title">
            <History size={16} />
            Monthly Returns
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-secondary)"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={10}
                  fontFamily="JetBrains Mono"
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {monthlyReturns.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.return >= 0 ? '#3fb950' : '#f85149'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="detailed-metrics" data-testid="detailed-metrics">
        <div className="section-title">Detailed Metrics</div>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Avg Win</span>
            <span className="detail-value positive">{formatPercent(results.avgWin)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Avg Loss</span>
            <span className="detail-value negative">{formatPercent(results.avgLoss)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Profit Factor</span>
            <span className="detail-value">{results.profitFactor.toFixed(2)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Calmar Ratio</span>
            <span className="detail-value">{results.calmarRatio.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
