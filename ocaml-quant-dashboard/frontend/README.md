# PDE Quant Dashboard - Frontend

A minimal, clean React frontend for the PDE Quantitative Trading Dashboard.

## Features

- Simple, responsive design
- API integration for backtesting, predictions, and analysis
- Real-time data display
- Lightweight and fast

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

## API Endpoints

- `/health` - Health check
- `/predict` - Get predictions
- `/backtest` - Run backtest
- `/greeks` - Greeks analysis

## Structure

```
src/
├── components/
│   ├── Dashboard.tsx
│   └── Dashboard.css
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```
