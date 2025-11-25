# Partial Differential Equation (PDE) Solver for Option Pricing

A sophisticated PDE solver project (OCaml / Dune-based) for pricing financial derivatives using finite difference methods. Implements Black-Scholes PDE with **data-driven parameter calibration** from historical market data.

## Features
- **Black-Scholes PDE Solver**: European call/put option pricing with multiple numerical schemes (Backward Euler, Crank-Nicolson)
- **Data-Driven Calibration**: Automatic parameter estimation from historical CSV data
  - Multiple volatility estimation methods (Simple, EWMA, Combined)
  - Drift and risk-free rate estimation
  - Adaptive grid boundary selection
- **Backtesting Framework**: Validate model accuracy against historical data
- **Comprehensive Test Suite**: Unit tests, integration tests, convergence analysis
- **Production-Ready**: Robust error handling, parameter validation, detailed diagnostics

## Repository layout
- src/          — source code
- examples/     — example problem setups and input files
- tests/        — unit / example tests
- dune, dune-project — build configuration
- README.md     — this file

(Adjust paths above to match the actual tree if different.)

## Requirements
- Linux (development tested on Ubuntu)
- OCaml (>= 4.12 recommended)
- opam (OCaml package manager)
- dune (build system)
- pkg-config and any system libs required by dependencies

## Quick start (install prerequisites)
Install opam, OCaml and dune (Ubuntu example):
sudo apt update
sudo apt install -y opam build-essential pkg-config
opam init --reinit -y
opam switch create 4.14.0   # or desired OCaml version
eval $(opam env)
opam install dune core  # add other dependencies as required

## Build
From the project root:
dune build

To clean build artifacts:
dune clean

## Run

### Basic Usage (Manual Parameters)
```bash
dune exec ./bin/main.exe -- \
  --s0 27500 \
  --k 27000 \
  --t 0.25 \
  --r 0.05 \
  --sigma 0.15 \
  --payoff call \
  --scheme CN
```

### Data-Driven Mode (Recommended)
```bash
# Calibrate from historical CSV data
dune exec ./bin/main.exe -- \
  --csv "NIFTY FINANCIAL SERVICES-25-11-2024-to-25-11-2025.csv" \
  --k 27000 \
  --t 0.25 \
  --adaptive \
  --vol-method combined
```

### With Backtesting
```bash
dune exec ./bin/main.exe -- \
  --csv "market_data.csv" \
  --k 27000 \
  --t 0.25 \
  --adaptive \
  --backtest \
  --backtest-output results.csv
```

### Command-Line Options
- `--s0 <price>`: Current asset price (default: from CSV or 100.0)
- `--k <strike>`: Strike price (default: 100.0)
- `--t <time>`: Time to maturity in years (default: 1.0)
- `--r <rate>`: Risk-free rate (default: calibrated or 0.05)
- `--sigma <vol>`: Volatility (default: calibrated or 0.2)
- `--payoff <type>`: Option type: call|put (default: call)
- `--scheme <method>`: Numerical scheme: BE|CN (default: CN)
- `--ns <int>`: Number of spatial intervals (default: 200)
- `--nt <int>`: Number of time intervals (default: 200)
- `--csv <file>`: Path to historical data CSV
- `--adaptive`: Use adaptive grid boundaries
- `--vol-method <method>`: Calibration method: simple|ewma|combined (default: combined)
- `--backtest`: Run backtesting on historical data
- `--backtest-output <file>`: Export backtest results to CSV
- `--verbose`: Show detailed diagnostics

## Tests
If tests are present, run:
dune runtest

## Data-Driven Features

The solver now supports automatic calibration from historical market data. See [DATA_DRIVEN_ENHANCEMENTS.md](DATA_DRIVEN_ENHANCEMENTS.md) for comprehensive documentation.

### Key Capabilities
1. **Historical Data Analysis**: Parse CSV files and compute statistics
2. **Volatility Calibration**: Multiple methods (Simple, EWMA, Combined)
3. **Adaptive Grids**: Automatic domain boundary selection
4. **Backtesting**: Validate model against historical prices
5. **Risk-Free Rate Estimation**: Derive from historical drift

### Example Results (NIFTY Financial Services)
```
Calibrated from NIFTY FINANCIAL SERVICES: 249 data points
Method: Combined(30d/60d/EWMA), Confidence: 90.0%
Volatility: 13.42%, Drift: -13.58%, Estimated r: 0.00%

PDE CN Call price: 30.60
Analytic Call price: 29.82
Abs error: 0.79 (2.6%)

Backtesting: RMSE: 398.98, Correlation: 0.68
```

## Contributing
1. Fork the repository
2. Create a feature branch: git checkout -b feature/your-feature
3. Implement changes, add tests
4. Commit with clear messages and push
5. Open a PR and describe changes

Notes
- Update this README with specific solver details, algorithms, parameter descriptions, and example commands once the codebase specifics are finalized.
