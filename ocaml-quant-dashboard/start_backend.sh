#!/bin/bash

# PDE Quant Backend Server Setup
# This script helps set up and start the backend API server

echo "🚀 PDE Quant Backend Server"
echo "============================"
echo ""

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 8000 is already in use. Trying to kill existing process..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Create a simple Node.js backend server for testing
cat > /tmp/backend_server.js << 'EOF'
const http = require('http');

const PORT = 8000;

// Mock data generators
const generateBacktestData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      portfolio_value: 100000 + Math.random() * 10000 + i * 500,
      daily_return: (Math.random() - 0.5) * 2,
      cumulative_return: i * 0.5 + Math.random() * 2,
    });
  }
  return data;
};

const generatePredictionData = () => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      time: `${String(i + 1).padStart(2, '0')}:00`,
      predicted_price: 50000 + Math.random() * 5000 + i * 100,
      actual_price: 50000 + Math.random() * 5000 + i * 120,
      confidence: 0.7 + Math.random() * 0.3,
    });
  }
  return data;
};

const generateGreeksData = () => {
  const greeks = ['delta', 'gamma', 'vega', 'theta', 'rho'];
  const data = [];
  greeks.forEach((greek) => {
    data.push({
      greek: greek,
      value: Math.random() * 2,
      change: (Math.random() - 0.5) * 0.5,
    });
  });
  return data;
};

// Request handler
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let responseData = null;

  if (req.url === '/api/health') {
    responseData = {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      backend: 'Node.js HTTP Server',
    };
  } else if (req.url === '/api/predict') {
    responseData = generatePredictionData();
  } else if (req.url === '/api/backtest') {
    responseData = generateBacktestData();
  } else if (req.url === '/api/greeks') {
    responseData = generateGreeksData();
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify(responseData));
});

server.listen(PORT, () => {
  console.log(`✅ Backend API Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  - GET /api/health');
  console.log('  - GET /api/predict');
  console.log('  - GET /api/backtest');
  console.log('  - GET /api/greeks');
});
EOF

# Start the server
echo "Starting backend server..."
node /tmp/backend_server.js
