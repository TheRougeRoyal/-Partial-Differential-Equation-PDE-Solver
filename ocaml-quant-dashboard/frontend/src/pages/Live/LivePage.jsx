import { useState, useEffect, useRef, useCallback } from 'react';
import { Radio, BookOpen, Activity, Zap } from 'lucide-react';
import { generateOrderBook, generateRecentTrades, generateTickerData } from '../../utils/mockData';
import { formatCurrency, formatNumber, formatTimestamp } from '../../utils/formatters';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './LivePage.css';

export const LivePage = () => {
  const [tickers, setTickers] = useState([]);
  const [selectedPair, setSelectedPair] = useState('BTC-USD');
  const [orderBook, setOrderBook] = useState({ asks: [], bids: [], spread: 0 });
  const [trades, setTrades] = useState([]);
  const [connected, setConnected] = useState(true);
  const [flashStates, setFlashStates] = useState({});
  const [tradeForm, setTradeForm] = useState({
    amount: '',
    priceType: 'market',
  });
  const prevPrices = useRef({});
  const { toggleTheme } = useTheme();

  const updateData = useCallback(() => {
    const newTickers = generateTickerData();
    
    // Check for price changes and set flash states
    const newFlashStates = {};
    newTickers.forEach(ticker => {
      const prevPrice = prevPrices.current[ticker.asset];
      if (prevPrice) {
        if (ticker.price > prevPrice) {
          newFlashStates[ticker.asset] = 'up';
        } else if (ticker.price < prevPrice) {
          newFlashStates[ticker.asset] = 'down';
        }
      }
      prevPrices.current[ticker.asset] = ticker.price;
    });

    setFlashStates(newFlashStates);
    setTimeout(() => setFlashStates({}), 300);

    setTickers(newTickers);
    setOrderBook(generateOrderBook());
    setTrades(prev => {
      const newTrades = generateRecentTrades(3);
      return [...newTrades, ...prev].slice(0, 20);
    });
  }, []);

  useEffect(() => {
    // Initial load
    setTickers(generateTickerData());
    setOrderBook(generateOrderBook());
    setTrades(generateRecentTrades(20));

    // Simulated WebSocket updates every 2 seconds
    const interval = setInterval(updateData, 2000);

    // Simulate connection status
    const connectionCheck = setInterval(() => {
      setConnected(Math.random() > 0.05);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(connectionCheck);
    };
  }, [updateData]);

  const handleTrade = (side) => {
    if (!tradeForm.amount) {
      toast.error('Please enter an amount');
      return;
    }

    toast.success(`${side.toUpperCase()} order placed for ${tradeForm.amount} ${selectedPair}`);
    setTradeForm({ amount: '', priceType: 'market' });
  };

  useKeyboardShortcuts({
    toggleTheme,
    b: () => handleTrade('buy'),
    s: () => handleTrade('sell'),
  });

  const selectedTicker = tickers.find(t => t.asset === selectedPair) || tickers[0];

  return (
    <div className="live-page" data-testid="live-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Trading</h1>
          <p className="page-subtitle">Real-time market data and execution</p>
        </div>
        <div className="page-actions">
          <div className="connection-indicator" data-testid="connection-indicator">
            <span className={`connection-dot ${connected ? '' : 'disconnected'}`} />
            <span>{connected ? 'Connected' : 'Reconnecting...'}</span>
          </div>
        </div>
      </div>

      <div className="tickers-grid">
        {tickers.map((ticker) => (
          <div
            key={ticker.asset}
            className={`ticker-card ${selectedPair === ticker.asset ? 'selected' : ''} ${
              flashStates[ticker.asset] ? `flash-${flashStates[ticker.asset]}` : ''
            }`}
            onClick={() => setSelectedPair(ticker.asset)}
            data-testid={`ticker-card-${ticker.asset}`}
          >
            <div className="ticker-header">
              <span className="ticker-symbol">{ticker.asset}</span>
              <span className={`ticker-change ${ticker.change >= 0 ? 'positive' : 'negative'}`}>
                {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
              </span>
            </div>
            <div className="ticker-price">{formatCurrency(ticker.price)}</div>
            <div className="ticker-details">
              <div className="ticker-detail">
                <span className="ticker-detail-label">High</span>
                <span className="ticker-detail-value">{formatCurrency(ticker.high)}</span>
              </div>
              <div className="ticker-detail">
                <span className="ticker-detail-label">Low</span>
                <span className="ticker-detail-value">{formatCurrency(ticker.low)}</span>
              </div>
              <div className="ticker-detail">
                <span className="ticker-detail-label">Volume</span>
                <span className="ticker-detail-value">{formatNumber(ticker.volume, 0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="trading-grid">
        <div className="trading-panel" data-testid="order-book">
          <div className="panel-header">
            <BookOpen size={14} />
            Order Book
          </div>
          <div className="panel-content">
            {orderBook.asks.map((ask, index) => (
              <div className="orderbook-row ask" key={`ask-${index}`}>
                <div className="depth-bar" style={{ width: `${ask.depth}%` }} />
                <span>{formatCurrency(ask.price)}</span>
                <span>{formatNumber(ask.size, 4)}</span>
                <span>{formatNumber(ask.total, 4)}</span>
              </div>
            ))}
            <div className="spread-row">
              Spread: {formatCurrency(orderBook.spread)}
            </div>
            {orderBook.bids.map((bid, index) => (
              <div className="orderbook-row bid" key={`bid-${index}`}>
                <div className="depth-bar" style={{ width: `${bid.depth}%` }} />
                <span>{formatCurrency(bid.price)}</span>
                <span>{formatNumber(bid.size, 4)}</span>
                <span>{formatNumber(bid.total, 4)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="trading-panel" data-testid="recent-trades">
          <div className="panel-header">
            <Activity size={14} />
            Recent Trades
          </div>
          <div className="panel-content">
            {trades.map((trade, index) => (
              <div className={`trade-row ${trade.side}`} key={trade.id || index}>
                <span className="trade-price">{formatCurrency(trade.price)}</span>
                <span>{formatNumber(trade.size, 4)}</span>
                <span>{formatTimestamp(trade.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="trading-panel" data-testid="quick-trade">
          <div className="panel-header">
            <Zap size={14} />
            Quick Trade - {selectedPair}
          </div>
          <div className="quick-trade">
            <div className="quick-trade-row">
              <label className="quick-trade-label">Amount</label>
              <input
                type="number"
                className="quick-trade-input"
                placeholder="0.0000"
                value={tradeForm.amount}
                onChange={(e) => setTradeForm(prev => ({ ...prev, amount: e.target.value }))}
                data-testid="trade-amount-input"
              />
            </div>

            <div className="quick-trade-row">
              <label className="quick-trade-label">Price Type</label>
              <div className="price-type-toggle">
                <button
                  className={`price-type-btn ${tradeForm.priceType === 'market' ? 'active' : ''}`}
                  onClick={() => setTradeForm(prev => ({ ...prev, priceType: 'market' }))}
                  data-testid="price-type-market"
                >
                  Market
                </button>
                <button
                  className={`price-type-btn ${tradeForm.priceType === 'limit' ? 'active' : ''}`}
                  onClick={() => setTradeForm(prev => ({ ...prev, priceType: 'limit' }))}
                  data-testid="price-type-limit"
                >
                  Limit
                </button>
              </div>
            </div>

            {selectedTicker && (
              <div className="quick-trade-row">
                <label className="quick-trade-label">Current Price</label>
                <div className="quick-trade-input" style={{ cursor: 'default' }}>
                  {formatCurrency(selectedTicker.price)}
                </div>
              </div>
            )}

            <div className="trade-buttons">
              <button
                className="trade-btn buy"
                onClick={() => handleTrade('buy')}
                data-testid="quick-buy-btn"
              >
                Buy
              </button>
              <button
                className="trade-btn sell"
                onClick={() => handleTrade('sell')}
                data-testid="quick-sell-btn"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
