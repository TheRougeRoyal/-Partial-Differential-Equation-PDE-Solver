import { useState, useEffect, useMemo } from 'react';
import { Link2, Download } from 'lucide-react';
import { generateOptionsChain } from '../../utils/mockData';
import { formatCurrency, formatPercent, formatNumber, formatCompact } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './OptionsPage.css';

const ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];
const EXPIRIES = ['Jan 24', 'Feb 24', 'Mar 24', 'Jun 24'];
const TYPES = ['all', 'call', 'put'];

const GREEKS = [
  { symbol: 'Δ', name: 'Delta', desc: 'Price sensitivity' },
  { symbol: 'Γ', name: 'Gamma', desc: 'Delta sensitivity' },
  { symbol: 'Θ', name: 'Theta', desc: 'Time decay' },
  { symbol: 'ν', name: 'Vega', desc: 'Volatility sensitivity' },
  { symbol: 'ρ', name: 'Rho', desc: 'Rate sensitivity' },
];

export const OptionsPage = () => {
  const [asset, setAsset] = useState('BTC-USD');
  const [expiry, setExpiry] = useState('Jan 24');
  const [optionType, setOptionType] = useState('all');
  const [options, setOptions] = useState([]);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    setOptions(generateOptionsChain(asset));
  }, [asset]);

  const filteredOptions = useMemo(() => {
    if (optionType === 'all') return options;
    return options.filter(opt => opt.type === optionType);
  }, [options, optionType]);

  const handleExportCSV = () => {
    exportToCSV(filteredOptions, `options-chain-${asset}`);
    toast.success('Exported options to CSV');
  };

  const handleExportJSON = () => {
    exportToJSON(filteredOptions, `options-chain-${asset}`);
    toast.success('Exported options to JSON');
  };

  useKeyboardShortcuts({
    toggleTheme,
    exportCSV: handleExportCSV,
    exportJSON: handleExportJSON,
  });

  return (
    <div className="options-page" data-testid="options-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Options Chain</h1>
          <p className="page-subtitle">Full options data with Greeks analysis</p>
        </div>
        <div className="page-actions">
          <button className="asset-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <span className="filter-label">Asset</span>
          <select
            className="filter-select"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            data-testid="asset-filter"
          >
            {ASSETS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Expiry</span>
          <select
            className="filter-select"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            data-testid="expiry-filter"
          >
            {EXPIRIES.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Type</span>
          <div className="toggle-group">
            {TYPES.map(type => (
              <button
                key={type}
                className={`toggle-btn ${optionType === type ? 'active' : ''}`}
                onClick={() => setOptionType(type)}
                data-testid={`type-toggle-${type}`}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="options-table-container" data-testid="options-table">
        <div className="options-table">
          <div className="options-header">
            <div className="options-header-cell">Symbol</div>
            <div className="options-header-cell right">Strike</div>
            <div className="options-header-cell">Type</div>
            <div className="options-header-cell right">Bid</div>
            <div className="options-header-cell right">Ask</div>
            <div className="options-header-cell right">Last</div>
            <div className="options-header-cell right">Chg%</div>
            <div className="options-header-cell right">Vol</div>
            <div className="options-header-cell right">OI</div>
            <div className="options-header-cell right">IV%</div>
            <div className="options-header-cell right">Delta</div>
            <div className="options-header-cell right">Gamma</div>
          </div>
          {filteredOptions.map((opt, index) => (
            <div className="options-row" key={index} data-testid={`options-row-${index}`}>
              <div className="options-cell">{opt.symbol}</div>
              <div className="options-cell right">{formatCurrency(opt.strike, 0)}</div>
              <div className="options-cell">
                <span className={`type-badge ${opt.type}`}>{opt.type}</span>
              </div>
              <div className="options-cell right">{formatCurrency(opt.bid)}</div>
              <div className="options-cell right">{formatCurrency(opt.ask)}</div>
              <div className="options-cell right">{formatCurrency(opt.last)}</div>
              <div className={`options-cell right ${opt.change >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(opt.change)}
              </div>
              <div className="options-cell right secondary">{formatCompact(opt.volume)}</div>
              <div className="options-cell right secondary">{formatCompact(opt.oi)}</div>
              <div className="options-cell right">{opt.iv.toFixed(1)}%</div>
              <div className="options-cell right">{opt.delta.toFixed(3)}</div>
              <div className="options-cell right secondary">{opt.gamma.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="greeks-legend" data-testid="greeks-legend">
        <div className="greeks-title">
          <Link2 size={14} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Greeks Reference
        </div>
        <div className="greeks-grid">
          {GREEKS.map((greek, index) => (
            <div className="greek-item" key={index}>
              <div className="greek-symbol">{greek.symbol}</div>
              <div className="greek-name">{greek.name}</div>
              <div className="greek-desc">{greek.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
