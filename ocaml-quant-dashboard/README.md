# OCaml Quant Dashboard

A modern web dashboard for visualizing quantitative finance data from the OCaml PDE solver. Features real-time updates via WebSocket, interactive charts, and comprehensive data exploration.

![Dashboard Preview](docs/preview.png)

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │     │                     │
│   React Frontend    │────▶│   Node.js Bridge    │────▶│   OCaml Backend     │
│   (Port 5173)       │     │   (Port 3001)       │     │   (CSV files)       │
│                     │     │                     │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │
         └───── WebSocket ◀──────────┘
                (Real-time)
```

## Features

### 📊 Dashboard
- Summary metrics (returns, Sharpe ratio, win rate)
- Price prediction vs actual charts
- Residuals distribution
- Accuracy metrics (MAE, RMSE, MAPE)

### 📈 Greeks Analysis
- Interactive time-series charts for Delta, Gamma, Theta, Vega, Rho
- Toggle individual Greeks on/off
- Filter by asset and date range
- Data table with full Greek values

### 📉 Backtesting
- Equity curve visualization
- Drawdown analysis
- Performance metrics cards
- Trade-by-trade breakdown

### 🔴 Live Monitor
- Real-time WebSocket updates
- Live price predictions with sparklines
- Connection status indicator
- Update history table

### 📁 Data Explorer
- Browse predictions, Greeks, and backtest data
- Filter by asset and model
- Pagination support
- CSV upload and export

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Start the Bridge Server

```bash
cd bridge
npm install
npm start
```

The bridge will run at `http://localhost:3001`.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be at `http://localhost:5173`.

### 3. (Optional) Simulate Live Data

```bash
cd bridge
node simulate_live.js
```

This sends mock real-time updates to test the Live Monitor.

## Project Structure

```
ocaml-quant-dashboard/
├── bridge/                 # Node.js API bridge
│   ├── src/
│   │   ├── index.ts       # Express + WebSocket server
│   │   ├── csvParser.ts   # CSV parsing with caching
│   │   └── types.ts       # TypeScript types
│   ├── simulate_live.js   # WebSocket test script
│   └── package.json
│
├── frontend/              # React dashboard
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # API & formatting
│   │   └── types/         # TypeScript interfaces
│   └── package.json
│
└── sample_data/           # Example CSV files
    ├── predictions.csv
    ├── greeks.csv
    └── backtest_results.csv
```

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/backtests` | Get backtest results |
| GET | `/api/v1/predictions` | Get price predictions |
| GET | `/api/v1/greeks` | Get Greeks data |
| GET | `/api/v1/filters` | Get available filters |
| GET | `/api/v1/metrics` | Get summary metrics |
| POST | `/api/v1/upload` | Upload CSV file |
| GET | `/health` | Health check |

### Query Parameters

All data endpoints support:
- `asset` - Filter by asset name
- `model` - Filter by model type
- `from` / `to` - Date range (ISO format)
- `page` / `limit` - Pagination

### WebSocket

Connect to `ws://localhost:3001/ws/live` for real-time updates.

Message format:
```json
{
  "type": "prediction_update",
  "timestamp": "2024-01-15T10:30:00Z",
  "asset": "Bitcoin",
  "model": "Black-Scholes",
  "predicted_price": 45234.56,
  "actual_price": 45100.00,
  "confidence": 0.85
}
```

## Configuration

### Environment Variables

**Bridge:**
```bash
PORT=3001          # Server port
DATA_DIR=../sample_data  # CSV data directory
```

**Frontend:**
Edit `vite.config.ts` to change proxy settings:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
  },
}
```

## Development

### Running Tests

```bash
# Bridge tests
cd bridge
npm test

# Frontend type checking
cd frontend
npm run type-check
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Serve with bridge
cd bridge
npm start
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Bridge**: Node.js, Express, WebSocket (ws), csv-parse
- **Backend**: OCaml PDE solver (existing)

## License

MIT
