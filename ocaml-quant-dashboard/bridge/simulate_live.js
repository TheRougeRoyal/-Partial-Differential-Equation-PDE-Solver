#!/usr/bin/env node

/**
 * Live Data Simulator for OCaml Quant Dashboard
 * 
 * This script simulates real-time price predictions and market data
 * by sending WebSocket messages to connected clients through the bridge server.
 * 
 * Usage:
 *   node simulate_live.js [interval_ms]
 * 
 * Example:
 *   node simulate_live.js 2000  # Send updates every 2 seconds
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:3001/ws/live';
const INTERVAL = parseInt(process.argv[2]) || 3000; // Default 3 seconds

// Simulated assets with base prices
const assets = [
  { name: 'Bitcoin', basePrice: 45000, volatility: 0.02 },
  { name: 'Ethereum', basePrice: 2800, volatility: 0.025 },
  { name: 'Solana', basePrice: 120, volatility: 0.035 },
  { name: 'Cardano', basePrice: 0.55, volatility: 0.03 },
  { name: 'Polkadot', basePrice: 8.50, volatility: 0.028 },
];

// Models for prediction
const models = ['Black-Scholes', 'Monte-Carlo', 'GARCH', 'Neural-Net', 'ARIMA'];

// Current prices (will drift over time)
const currentPrices = {};
assets.forEach(asset => {
  currentPrices[asset.name] = asset.basePrice;
});

/**
 * Generate a random price movement using geometric brownian motion
 */
function generatePriceMovement(asset) {
  const dt = INTERVAL / 1000 / 86400; // Time step in days
  const drift = 0.0001; // Small upward drift
  const randomShock = (Math.random() - 0.5) * 2;
  
  const dPrice = currentPrices[asset.name] * (
    drift * dt + 
    asset.volatility * Math.sqrt(dt) * randomShock
  );
  
  currentPrices[asset.name] += dPrice;
  return currentPrices[asset.name];
}

/**
 * Generate a prediction with some error margin
 */
function generatePrediction(actualPrice, confidence) {
  const errorMargin = (1 - confidence) * 0.05; // Lower confidence = more error
  const predictionError = (Math.random() - 0.5) * 2 * errorMargin * actualPrice;
  return actualPrice + predictionError;
}

/**
 * Create a prediction update message
 */
function createPredictionUpdate() {
  const asset = assets[Math.floor(Math.random() * assets.length)];
  const model = models[Math.floor(Math.random() * models.length)];
  const confidence = 0.6 + Math.random() * 0.35; // 60-95% confidence
  
  const actualPrice = generatePriceMovement(asset);
  const predictedPrice = generatePrediction(actualPrice, confidence);
  
  return {
    type: 'prediction_update',
    timestamp: new Date().toISOString(),
    asset: asset.name,
    model: model,
    predicted_price: Math.round(predictedPrice * 100) / 100,
    actual_price: Math.round(actualPrice * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Connect to WebSocket server and start sending updates
 */
function startSimulation() {
  console.log(`🚀 Starting Live Data Simulator`);
  console.log(`   Target: ${WS_URL}`);
  console.log(`   Interval: ${INTERVAL}ms`);
  console.log('');
  
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    console.log('📊 Sending live updates...\n');
    
    // Send initial batch of updates
    for (let i = 0; i < 5; i++) {
      const update = createPredictionUpdate();
      ws.send(JSON.stringify(update));
      console.log(`[${update.timestamp}] ${update.asset}: $${update.actual_price} → $${update.predicted_price} (${update.model})`);
    }
    
    // Continue sending updates at interval
    const intervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const update = createPredictionUpdate();
        ws.send(JSON.stringify(update));
        console.log(`[${update.timestamp}] ${update.asset}: $${update.actual_price} → $${update.predicted_price} (${update.model})`);
      } else {
        clearInterval(intervalId);
      }
    }, INTERVAL);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping simulation...');
      clearInterval(intervalId);
      ws.close();
      process.exit(0);
    });
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    console.log('\nMake sure the bridge server is running:');
    console.log('  cd bridge && npm start');
    process.exit(1);
  });
  
  ws.on('close', () => {
    console.log('🔌 Disconnected from server');
  });
  
  ws.on('message', (data) => {
    console.log('📥 Received:', data.toString());
  });
}

// Run simulation
startSimulation();
