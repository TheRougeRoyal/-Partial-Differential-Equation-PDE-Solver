# PDE Option Pricing Dashboard

A full-stack quantitative finance platform that prices European options using **Partial Differential Equations** solved via finite difference methods in OCaml, served through a TypeScript/Express bridge, and visualized in a React dashboard.

Built to demonstrate systems-level thinking across numerical computing, backend engineering, and modern frontend development.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Core Engine** | OCaml 4.x, Dune, Yojson |
| **Numerical Methods** | Crank-Nicolson, Backward Euler, Thomas Algorithm, Monte Carlo (GBM) |
| **Backend** | TypeScript, Express, WebSocket (`ws`), CSV parsing |
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Lucide Icons |
| **Data** | CSV ingestion, real-time WebSocket streaming, REST API |
| **DevOps** | Concurrent process management, Dune build system, Vite bundler |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React Frontend                      │
│   Dashboard · Pricing · Portfolio · Signals · Live    │
│   Vite dev server (port 3001)                         │
└──────────────┬───────────────────────────┬────────────┘
               │ REST + WebSocket          │
               ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────┐
│   Express Bridge (TS)    │   │   WebSocket Server   │
│   Port 3002              │◄──┤   /ws/live           │
│   REST API + CSV parsing │   │   Real-time streaming │
└──────────┬───────────────┘   └──────────────────────┘
           │ execFile (stdin/stdout JSON)
           ▼
┌──────────────────────────┐
│   OCaml PDE Engine       │
│   pricing_api.exe        │
│   Finite difference solver│
│   Greeks · Calibration   │
└──────────────────────────┘
```

---

## Key Features

### Numerical Computing
- **1D European Option PDE Solver** — Crank-Nicolson and Backward Euler finite difference schemes
- **Tridiagonal Matrix Solver** — Thomas algorithm for O(n) linear system solves
- **Greeks Computation** — Delta, Gamma, Theta, Vega, Rho via finite difference approximations
- **Volatility Calibration** — Simple, EWMA, and Combined calibration methods from historical CSV data
- **Monte Carlo Simulation** — Geometric Brownian Motion for price forecasting with confidence intervals
- **Technical Analysis** — Moving averages, RSI, Bollinger Bands, trend detection

### Backend Engineering
- **TypeScript Bridge Server** — Express REST API with structured error handling and input validation
- **WebSocket Real-time** — Live price streaming with client auto-reconnect
- **CSV Data Pipeline** — Parse, cache (TTL-based), filter, and paginate historical data
- **File Upload** — Multer-based CSV upload with 50MB limit and schema inference
- **Process Management** — OCaml binary invocation via stdin/stdout JSON IPC with timeout handling

### Frontend Development
- **React 19 with Vite** — Fast HMR, modern bundling, optimized production builds
- **8-Page Dashboard** — Dashboard, Portfolio, Options Chain, Pricing Engine, Signals, Orders, Backtest, Live Trading Desk
- **Recharts Visualization** — Area charts, line charts, bar charts, pie charts with custom tooltips
- **Responsive Design** — Mobile-first with collapsible sidebar, adaptive layouts
- **Dark/Light Theme** — CSS custom properties with localStorage persistence
- **Keyboard Shortcuts** — `g+{key}` navigation, export shortcuts, theme toggle
- **API Resilience** — Graceful fallback from live API to mock data when backend is unavailable

---

## Quick Start

```bash
# Install all dependencies
npm install

# Build OCaml engine
dune build

# Start everything (bridge + frontend)
npm run dev
```

Frontend: `http://localhost:3001`  
Bridge API: `http://localhost:3002/api/v1`  
WebSocket: `ws://localhost:3002/ws/live`

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | System health check |
| `GET` | `/api/v1/backtests` | Backtest results (filterable, paginated) |
| `GET` | `/api/v1/predictions` | Price predictions with confidence |
| `GET` | `/api/v1/greeks` | Greek values for options |
| `GET` | `/api/v1/metrics` | Sharpe, Sortino, drawdown, win rate |
| `GET` | `/api/v1/prediction-accuracy` | MAE, RMSE, MAPE, direction accuracy |
| `POST` | `/api/v1/pricing` | PDE option pricing (calls OCaml engine) |
| `POST` | `/api/v1/upload` | Upload CSV data |
| `GET` | `/api/v1/filters` | Available filter options |

### Pricing Example

```bash
curl -X POST http://localhost:3002/api/v1/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "spot": 67500,
    "strike": 68000,
    "maturity": 0.25,
    "rate": 0.05,
    "volatility": 0.45,
    "optionType": "call",
    "scheme": "CN"
  }'
```

---

## Project Structure

```
├── src/                          # OCaml core library
│   ├── pde1d.ml                  # 1D PDE finite difference solver
│   ├── tridiag.ml                # Thomas algorithm
│   ├── time_stepper.ml           # Crank-Nicolson / Backward Euler
│   ├── pricing.ml                # Greeks + batch pricing
│   ├── calibration.ml            # Volatility calibration
│   ├── market_data.ml            # CSV parsing + statistics
│   └── crypto_model.ml           # Monte Carlo simulation
├── bin/                          # OCaml executables
│   ├── pricing_api.exe           # JSON IPC pricing binary
│   └── main.ml                   # CLI entry point
├── test/                         # OCaml test suite
├── ocaml-quant-dashboard/
│   ├── bridge/                   # TypeScript Express server
│   │   └── src/
│   │       ├── index.ts          # REST + WebSocket server
│   │       ├── csvParser.ts      # Data layer
│   │       └── types.ts          # TypeScript interfaces
│   ├── sample_data/              # CSV test data
│   └── frontend/                 # React application
│       └── src/
│           ├── pages/            # 8 dashboard pages
│           ├── components/       # Layout + shadcn/ui
│           ├── utils/            # API client, formatters
│           └── hooks/            # Keyboard shortcuts, toast
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start bridge + frontend concurrently |
| `npm run check` | Full quality gate (build + lint + typecheck) |
| `npm run build` | Production build |
| `npm run lint` | Lint all packages |
| `dune build` | Build OCaml engine |
| `dune runtest` | Run OCaml test suite |

---

## Engineering Highlights

- **Polyglot codebase** — OCaml for numerical performance, TypeScript for API layer, React for UX
- **IPC via stdin/stdout** — OCaml binary communicates JSON through process pipes, avoiding FFI complexity
- **Graceful degradation** — Frontend falls back to client-side Black-Scholes when OCaml backend is unavailable
- **Type-safe data flow** — TypeScript interfaces for all API contracts, Zod validation on inputs
- **Real-time architecture** — WebSocket server broadcasts price updates, frontend auto-reconnects on disconnect
- **Testable design** — OCaml test suite, TypeScript type checking, Vite production build verification

---

## License

MIT
