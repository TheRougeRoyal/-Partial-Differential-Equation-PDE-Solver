// Mock data generators for AlgoTrader dashboard

const ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];

const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(randomBetween(min, max));

// Base prices for assets
const BASE_PRICES = {
  'BTC-USD': 67500,
  'ETH-USD': 3450,
  'SOL-USD': 145,
};

export const generateCurrentPrice = (asset) => {
  const base = BASE_PRICES[asset] || 100;
  return base * (1 + randomBetween(-0.02, 0.02));
};

export const generatePrediction = (asset) => {
  const currentPrice = generateCurrentPrice(asset);
  const predictedPrice = currentPrice * (1 + randomBetween(-0.03, 0.03));
  const confidence = randomBetween(65, 95);
  const accuracy = randomBetween(70, 92);
  const error = Math.abs((predictedPrice - currentPrice) / currentPrice * 100);

  return {
    asset,
    currentPrice,
    predictedPrice,
    confidence,
    accuracy,
    error,
    timestamp: new Date(),
  };
};

export const generatePredictionHistory = (asset, count = 24) => {
  const history = [];
  const basePrice = BASE_PRICES[asset];
  let price = basePrice;

  for (let i = count - 1; i >= 0; i--) {
    const change = randomBetween(-0.005, 0.005);
    price = price * (1 + change);
    const predicted = price * (1 + randomBetween(-0.01, 0.01));
    const confidence = randomBetween(65, 95);
    const error = Math.abs((predicted - price) / price * 100);

    history.push({
      time: new Date(Date.now() - i * 3600000).toISOString(),
      actual: price,
      predicted,
      confidence,
      error,
    });
  }

  return history;
};

export const generatePortfolioSummary = () => ({
  totalValue: randomBetween(150000, 250000),
  todayPnL: randomBetween(-5000, 8000),
  todayPnLPercent: randomBetween(-2, 4),
  openPositions: randomInt(5, 12),
  winRate: randomBetween(55, 72),
});

export const generatePositions = () => {
  const positions = [
    { asset: 'BTC', type: 'crypto', qty: randomBetween(0.5, 2), entryPrice: randomBetween(62000, 68000) },
    { asset: 'ETH', type: 'crypto', qty: randomBetween(5, 20), entryPrice: randomBetween(3200, 3600) },
    { asset: 'SOL', type: 'crypto', qty: randomBetween(50, 200), entryPrice: randomBetween(130, 160) },
    { asset: 'BTC CALL 70K', type: 'option', qty: randomInt(2, 10), entryPrice: randomBetween(1500, 3000) },
    { asset: 'ETH PUT 3200', type: 'option', qty: randomInt(5, 15), entryPrice: randomBetween(100, 300) },
  ];

  return positions.map(pos => {
    let currentPrice;
    if (pos.type === 'crypto') {
      currentPrice = generateCurrentPrice(`${pos.asset}-USD`);
    } else {
      currentPrice = pos.entryPrice * (1 + randomBetween(-0.3, 0.5));
    }
    const pnl = (currentPrice - pos.entryPrice) * pos.qty;
    const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;

    return {
      ...pos,
      currentPrice,
      pnl,
      pnlPercent,
    };
  });
};

export const generateAllocation = () => [
  { name: 'BTC', value: randomBetween(35, 45), color: '#f7931a' },
  { name: 'ETH', value: randomBetween(20, 30), color: '#627eea' },
  { name: 'SOL', value: randomBetween(10, 20), color: '#00ffa3' },
  { name: 'Options', value: randomBetween(5, 15), color: '#1f6feb' },
  { name: 'Cash', value: randomBetween(5, 15), color: '#8b949e' },
];

export const generateOptionsChain = (asset) => {
  const basePrice = BASE_PRICES[asset];
  const strikes = [];
  
  for (let i = -5; i <= 5; i++) {
    const strike = Math.round(basePrice * (1 + i * 0.03) / 100) * 100;
    
    ['call', 'put'].forEach(type => {
      const moneyness = type === 'call' ? (basePrice - strike) / strike : (strike - basePrice) / strike;
      const iv = randomBetween(25, 65);
      const delta = type === 'call' ? randomBetween(0.1, 0.9) : randomBetween(-0.9, -0.1);
      
      strikes.push({
        symbol: `${asset.split('-')[0]} ${strike} ${type.toUpperCase()}`,
        strike,
        type,
        bid: randomBetween(50, 2000),
        ask: randomBetween(50, 2000) * 1.02,
        last: randomBetween(50, 2000),
        change: randomBetween(-15, 15),
        volume: randomInt(100, 5000),
        oi: randomInt(500, 20000),
        iv,
        delta,
        gamma: randomBetween(0.001, 0.05),
        theta: -randomBetween(0.1, 5),
        vega: randomBetween(0.05, 0.3),
      });
    });
  }

  return strikes;
};

export const generateSignals = (count = 20) => {
  const signals = [];
  const actions = ['buy', 'sell', 'hold'];
  const models = ['LSTM-V3', 'XGBoost', 'RandomForest', 'GRU-Ensemble', 'Transformer'];
  const reasons = [
    'RSI oversold + MACD crossover',
    'Breakout above resistance level',
    'Volume surge detected',
    'Bullish divergence on momentum',
    'Support level test - reversal likely',
    'Bearish engulfing pattern',
    'Moving average death cross',
    'High volatility - risk reduction',
    'Consolidation - awaiting breakout',
    'Mean reversion opportunity',
  ];

  for (let i = 0; i < count; i++) {
    const asset = ASSETS[randomInt(0, 3)];
    const action = actions[randomInt(0, 3)];
    
    signals.push({
      id: `sig-${Date.now()}-${i}`,
      asset,
      action,
      price: generateCurrentPrice(asset),
      confidence: randomBetween(55, 95),
      reason: reasons[randomInt(0, reasons.length)],
      model: models[randomInt(0, models.length)],
      timestamp: new Date(Date.now() - i * randomInt(60000, 600000)),
    });
  }

  return signals.sort((a, b) => b.timestamp - a.timestamp);
};

export const generateOrders = () => {
  const orders = [];
  const statuses = ['filled', 'pending', 'cancelled'];
  const types = ['market', 'limit', 'stop'];
  const sides = ['buy', 'sell'];

  for (let i = 0; i < 15; i++) {
    const asset = ASSETS[randomInt(0, 3)];
    const side = sides[randomInt(0, 2)];
    const type = types[randomInt(0, 3)];
    const status = statuses[randomInt(0, 3)];

    orders.push({
      id: `ord-${Date.now()}-${i}`,
      asset,
      side,
      type,
      qty: randomBetween(0.01, 5),
      price: type === 'market' ? null : generateCurrentPrice(asset),
      status,
      timestamp: new Date(Date.now() - i * randomInt(60000, 3600000)),
    });
  }

  return orders.sort((a, b) => b.timestamp - a.timestamp);
};

export const generateBacktestResults = (period = '1Y') => {
  const periodDays = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period];
  
  return {
    totalReturn: randomBetween(15, 85),
    sharpe: randomBetween(1.2, 2.8),
    sortino: randomBetween(1.5, 3.5),
    maxDrawdown: -randomBetween(8, 25),
    winRate: randomBetween(52, 68),
    totalTrades: randomInt(150, 500),
    avgWin: randomBetween(2, 5),
    avgLoss: -randomBetween(1, 3),
    profitFactor: randomBetween(1.3, 2.2),
    calmarRatio: randomBetween(0.8, 2.5),
    period,
    periodDays,
  };
};

export const generateEquityCurve = (days = 365) => {
  const curve = [];
  let equity = 100000;

  for (let i = 0; i < days; i++) {
    const dailyReturn = randomBetween(-0.02, 0.025);
    equity = equity * (1 + dailyReturn);
    
    curve.push({
      date: new Date(Date.now() - (days - i) * 86400000).toISOString().split('T')[0],
      equity: Math.round(equity),
      benchmark: 100000 * Math.pow(1.0001, i),
    });
  }

  return curve;
};

export const generateMonthlyReturns = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    return: randomBetween(-8, 15),
  }));
};

export const generateOrderBook = () => {
  const asks = [];
  const bids = [];
  const basePrice = 67500;
  const spread = 0.0001;

  for (let i = 0; i < 5; i++) {
    asks.push({
      price: basePrice * (1 + spread + i * 0.0002),
      size: randomBetween(0.1, 3),
      total: 0,
    });
    bids.push({
      price: basePrice * (1 - spread - i * 0.0002),
      size: randomBetween(0.1, 3),
      total: 0,
    });
  }

  // Calculate totals
  let askTotal = 0;
  let bidTotal = 0;
  
  asks.forEach(ask => {
    askTotal += ask.size;
    ask.total = askTotal;
  });

  bids.forEach(bid => {
    bidTotal += bid.size;
    bid.total = bidTotal;
  });

  const maxTotal = Math.max(askTotal, bidTotal);
  asks.forEach(ask => ask.depth = (ask.total / maxTotal) * 100);
  bids.forEach(bid => bid.depth = (bid.total / maxTotal) * 100);

  return { asks: asks.reverse(), bids, spread: basePrice * spread * 2 };
};

export const generateRecentTrades = (count = 20) => {
  const trades = [];
  let lastPrice = 67500;

  for (let i = 0; i < count; i++) {
    const change = randomBetween(-20, 20);
    lastPrice += change;
    const side = change >= 0 ? 'buy' : 'sell';

    trades.push({
      id: `trade-${Date.now()}-${i}`,
      price: lastPrice,
      size: randomBetween(0.001, 1),
      side,
      timestamp: new Date(Date.now() - i * randomInt(100, 2000)),
    });
  }

  return trades;
};

export const generateTickerData = () => {
  return ASSETS.map(asset => {
    const price = generateCurrentPrice(asset);
    const change = randomBetween(-5, 5);
    const high = price * (1 + Math.abs(change) / 100 + 0.02);
    const low = price * (1 - Math.abs(change) / 100 - 0.02);

    return {
      asset,
      price,
      change,
      high,
      low,
      volume: randomInt(100000, 1000000),
    };
  });
};

// API client that tries OCaml bridge backend first, then falls back to mock
export const ApiClient = {
  baseUrl: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/v1`
    : 'http://localhost:3001/api/v1',

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) throw new Error('API error');
      return await response.json();
    } catch (error) {
      console.log(`API unavailable, using mock data for ${endpoint}`);
      return this.getMockData(endpoint);
    }
  },

  getMockData(endpoint) {
    const mockHandlers = {
      '/predictions': () => ({
        current: generatePrediction('BTC-USD'),
        history: generatePredictionHistory('BTC-USD'),
      }),
      '/portfolio': () => ({
        summary: generatePortfolioSummary(),
        positions: generatePositions(),
        allocation: generateAllocation(),
      }),
      '/options': () => generateOptionsChain('BTC-USD'),
      '/signals': () => generateSignals(),
      '/orders': () => generateOrders(),
      '/backtest': () => ({
        results: generateBacktestResults(),
        equity: generateEquityCurve(),
        monthly: generateMonthlyReturns(),
      }),
      '/backtests': () => ({
        results: generateBacktestResults(),
        equity: generateEquityCurve(),
        monthly: generateMonthlyReturns(),
      }),
      '/metrics': () => ({
        totalReturn: 42.5,
        sharpeRatio: 1.85,
        sortinoRatio: 2.42,
        maxDrawdown: 12.3,
        winRate: 64.2,
        avgPnl: 1250,
        totalTrades: 156,
      }),
      '/live': () => ({
        orderBook: generateOrderBook(),
        trades: generateRecentTrades(),
        tickers: generateTickerData(),
      }),
      '/health': () => ({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }),
    };

    const handler = mockHandlers[endpoint];
    return handler ? handler() : null;
  },
};
