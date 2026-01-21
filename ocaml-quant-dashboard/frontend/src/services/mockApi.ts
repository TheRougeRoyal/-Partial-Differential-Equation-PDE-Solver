import axios from 'axios'

// Generate mock data for demonstration
export const generateMockBacktestData = () => {
  const data = []
  for (let i = 0; i < 30; i++) {
    data.push({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      portfolio_value: 100000 + Math.random() * 10000 + i * 500,
      daily_return: (Math.random() - 0.5) * 2,
      cumulative_return: i * 0.5 + Math.random() * 2,
    })
  }
  return data
}

export const generateMockPredictionData = () => {
  const data = []
  for (let i = 0; i < 20; i++) {
    data.push({
      time: `${String(i + 1).padStart(2, '0')}:00`,
      predicted_price: 50000 + Math.random() * 5000 + i * 100,
      actual_price: 50000 + Math.random() * 5000 + i * 120,
      confidence: 0.7 + Math.random() * 0.3,
    })
  }
  return data
}

export const generateMockGreeksData = () => {
  const greeks = ['delta', 'gamma', 'vega', 'theta', 'rho']
  const data = []
  greeks.forEach((greek) => {
    data.push({
      greek: greek,
      value: Math.random() * 2,
      change: (Math.random() - 0.5) * 0.5,
    })
  })
  return data
}

// Mock API service
export const mockApi = {
  health: async () => ({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }),
  predict: async () => generateMockPredictionData(),
  backtest: async () => generateMockBacktestData(),
  greeks: async () => generateMockGreeksData(),
}
