# Live Trading Integration Guide

Real-time cryptocurrency price feed integrated with your OCaml options pricing model.

## Architecture

```
TradingView API (Node.js)
    ↓ WebSocket
Live Prices → JSON File
    ↓ File Read
OCaml Model → Options Pricing
```

## Quick Start

### 1. Start Live Price Feed

```bash
./start_live_feed.sh
```

This connects to TradingView and streams live prices for:
- Bitcoin (BINANCE:BTCUSDT)
- Solana (BINANCE:SOLUSDT)
- Ethereum (BINANCE:ETHUSDT)

### 2. Run Live Analysis

```bash
dune exec bin/crypto_live.exe
```

Shows current prices and calculates option premiums using live spot prices.

### 3. Run Live Predictions

```bash
dune exec bin/crypto_live_predict.exe
```

Combines live prices with historical calibration for:
- 7-day price forecasts
- Option Greeks (Delta, Gamma, Vega, Theta)
- Confidence intervals

### 4. Monitor Options Chain

```bash
dune exec bin/crypto_live_monitor.exe
```

Real-time options chain monitor that refreshes every 5 seconds:
- Multiple strike prices (90%, 95%, 100%, 105%, 110%)
- Call and Put premiums
- Delta values

## API Usage

### OCaml Integration

```ocaml
open Pde_opt

let prices = Live_data.fetch ()

match Live_data.get_latest "Bitcoin" with
| Some spot ->
    let input = Pricing.{
      spot;
      strike = spot *. 1.1;
      maturity = 30.0 /. 365.0;
      rate = 0.05;
      volatility = 0.8;
      option_type = Call;
    } in
    let result = Pricing.price_option input in
    Printf.printf "Premium: $%.2f\n" result.price
| None -> ()
```

### Available Functions

- `Live_data.fetch ()` - Get all live prices
- `Live_data.get_latest symbol` - Get specific coin price
- `Live_data.get_price symbol prices` - Extract from fetched data
- `Live_data.to_market_data_point` - Convert to historical format

## Data Format

Live prices are stored in `tradingview_bridge/live_prices.json`:

```json
{
  "Bitcoin": {
    "symbol": "Bitcoin",
    "price": 88000.00,
    "open": 87500.00,
    "high": 88200.00,
    "low": 87300.00,
    "volume": 1234.56,
    "timestamp": "2025-11-25T17:00:00.000Z"
  }
}
```

## Adding New Symbols

Edit `tradingview_bridge/server.js`:

```javascript
const symbols = [
  { name: 'BINANCE:BTCUSDT', key: 'Bitcoin' },
  { name: 'BINANCE:ADAUSDT', key: 'Cardano' }
];
```

Restart the bridge to apply changes.

## Troubleshooting

**No live data available**
- Ensure bridge is running: `./start_live_feed.sh`
- Check `tradingview_bridge/live_prices.json` exists

**Symbol errors**
- Verify symbol format on TradingView
- Use format: `EXCHANGE:SYMBOL` (e.g., `BINANCE:BTCUSDT`)

**Connection issues**
- Check internet connection
- TradingView may rate-limit requests
