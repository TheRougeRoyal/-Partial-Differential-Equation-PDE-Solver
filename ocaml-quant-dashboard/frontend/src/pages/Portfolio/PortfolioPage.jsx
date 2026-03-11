import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, BarChart3, Percent, Download } from 'lucide-react';
import { generatePortfolioSummary, generatePositions, generateAllocation } from '../../utils/mockData';
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './PortfolioPage.css';

export const PortfolioPage = () => {
  const [summary, setSummary] = useState(null);
  const [positions, setPositions] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    setSummary(generatePortfolioSummary());
    setPositions(generatePositions());
    setAllocation(generateAllocation());
  }, []);

  const handleExportCSV = () => {
    const exportData = positions.map(p => ({
      asset: p.asset,
      type: p.type,
      quantity: p.qty,
      entryPrice: p.entryPrice,
      currentPrice: p.currentPrice,
      pnl: p.pnl,
      pnlPercent: p.pnlPercent,
    }));
    exportToCSV(exportData, 'portfolio-positions');
    toast.success('Exported positions to CSV');
  };

  const handleExportJSON = () => {
    exportToJSON({ summary, positions, allocation }, 'portfolio-data');
    toast.success('Exported portfolio to JSON');
  };

  useKeyboardShortcuts({
    toggleTheme,
    exportCSV: handleExportCSV,
    exportJSON: handleExportJSON,
  });

  if (!summary) return null;

  return (
    <div className="portfolio-page" data-testid="portfolio-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-subtitle">Holdings overview and asset allocation</p>
        </div>
        <div className="page-actions">
          <button className="asset-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={14} /> CSV
          </button>
          <button className="asset-btn" onClick={handleExportJSON} data-testid="export-json-btn">
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card" data-testid="summary-total-value">
          <div className="summary-label">
            <Wallet size={12} />
            Total Value
          </div>
          <div className="summary-value">{formatCurrency(summary.totalValue)}</div>
        </div>

        <div className="summary-card" data-testid="summary-pnl">
          <div className="summary-label">
            <TrendingUp size={12} />
            Today's P&L
          </div>
          <div className={`summary-value ${summary.todayPnL >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(Math.abs(summary.todayPnL))}
          </div>
          <div className={`summary-change ${summary.todayPnLPercent >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(summary.todayPnLPercent)}
          </div>
        </div>

        <div className="summary-card" data-testid="summary-positions">
          <div className="summary-label">
            <BarChart3 size={12} />
            Open Positions
          </div>
          <div className="summary-value">{summary.openPositions}</div>
        </div>

        <div className="summary-card" data-testid="summary-winrate">
          <div className="summary-label">
            <Percent size={12} />
            Win Rate
          </div>
          <div className="summary-value">{summary.winRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="allocation-section" data-testid="allocation-section">
          <div className="section-title">Asset Allocation</div>
          <div className="allocation-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="allocation-legend">
            {allocation.map((item, index) => (
              <div className="allocation-item" key={index}>
                <div className="allocation-dot" style={{ background: item.color }} />
                <span className="allocation-name">{item.name}</span>
                <span className="allocation-percent">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="positions-section" data-testid="positions-section">
          <div className="section-header">
            <div className="section-title">Positions</div>
          </div>
          <div className="positions-table">
            <div className="positions-header">
              <div className="positions-header-cell">Asset</div>
              <div className="positions-header-cell">Type</div>
              <div className="positions-header-cell right">Qty</div>
              <div className="positions-header-cell right">Entry</div>
              <div className="positions-header-cell right">Current</div>
              <div className="positions-header-cell right">P&L</div>
              <div className="positions-header-cell right">P&L %</div>
            </div>
            {positions.map((position, index) => (
              <div className="positions-row" key={index} data-testid={`position-row-${index}`}>
                <div className="position-cell">
                  <div className="asset-name">{position.asset}</div>
                </div>
                <div className="position-cell">
                  <span className={`type-badge ${position.type}`}>{position.type}</span>
                </div>
                <div className="position-cell right secondary">
                  {formatNumber(position.qty, position.type === 'crypto' ? 4 : 0)}
                </div>
                <div className="position-cell right">{formatCurrency(position.entryPrice)}</div>
                <div className="position-cell right">{formatCurrency(position.currentPrice)}</div>
                <div className={`position-cell right ${position.pnl >= 0 ? 'positive' : 'negative'}`}>
                  {position.pnl >= 0 ? '+' : ''}{formatCurrency(position.pnl)}
                </div>
                <div className={`position-cell right ${position.pnlPercent >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(position.pnlPercent)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
