# Pricing Model

A simple and elegant European option pricing model built on PDE solvers.

## Features

- **Simple Interface**: Price options with minimal setup
- **Greeks Calculation**: Automatic computation of Delta, Gamma, Theta, and Vega
- **Batch Processing**: Price multiple options efficiently
- **Market Data Integration**: Calibrate parameters from CSV files
- **High Accuracy**: PDE-based pricing with Crank-Nicolson scheme

## Quick Start

### Basic Usage

```ocaml
open Pde_opt

let call_input = Pricing.{
  spot = 100.0;
  strike = 100.0;
  maturity = 1.0;
  rate = 0.05;
  volatility = 0.2;
  option_type = Call;
}

let result = Pricing.price_option call_input in
Pricing.print_output result
```

### Output

```
Price: 10.45042
Analytic: 10.45058
Error: 0.00015
Delta: 0.63792
Gamma: 0.02016
Theta: -6.42444
Vega: 37.57397
```

### Pricing from Market Data

```ocaml
let result = Pricing.price_from_csv 
  "market_data.csv" 
  100.0          
  1.0            
  Pricing.Call   
in
Pricing.print_output result
```

### Batch Pricing

```ocaml
let strikes = [90.0; 95.0; 100.0; 105.0; 110.0] in
let inputs = List.map (fun k -> 
  Pricing.{ call_input with strike = k }
) strikes in

let results = Pricing.batch_price inputs () in
List.iter Pricing.print_output results
```

## API Reference

### Types

```ocaml
type option_type = Call | Put

type pricing_input = {
  spot: float;
  strike: float;
  maturity: float;
  rate: float;
  volatility: float;
  option_type: option_type;
}

type pricing_output = {
  price: float;
  analytic_price: float;
  error: float;
  delta: float;
  gamma: float;
  theta: float;
  vega: float;
}
```

### Functions

#### `price_option`

```ocaml
val price_option : 
  ?n_s:int -> 
  ?n_t:int -> 
  ?scheme:[`BE | `CN] -> 
  pricing_input -> 
  pricing_output
```

Price a single option with PDE solver.

Parameters:
- `n_s`: Spatial grid points (default: 200)
- `n_t`: Time grid points (default: 200)
- `scheme`: Time-stepping scheme - `BE` (Backward Euler) or `CN` (Crank-Nicolson, default)
- `pricing_input`: Option parameters

Returns: `pricing_output` with price and Greeks

#### `price_from_csv`

```ocaml
val price_from_csv : 
  ?n_s:int -> 
  ?n_t:int -> 
  ?scheme:[`BE | `CN] -> 
  ?vol_method:Calibration.vol_method -> 
  string -> 
  float -> 
  float -> 
  option_type -> 
  pricing_output
```

Price option using parameters calibrated from market data.

Parameters:
- `n_s`, `n_t`, `scheme`: Same as `price_option`
- `vol_method`: Volatility calibration method
  - `Simple n`: Historical volatility with window size `n`
  - `EWMA lambda`: Exponentially weighted moving average
  - `Combined`: Weighted combination (default)
- `csv_file`: Path to market data CSV
- `strike`: Strike price
- `maturity`: Time to maturity
- `option_type`: `Call` or `Put`

#### `batch_price`

```ocaml
val batch_price : 
  pricing_input list -> 
  ?n_s:int -> 
  ?n_t:int -> 
  ?scheme:[`BE | `CN] -> 
  unit -> 
  pricing_output list
```

Price multiple options with same grid settings.

#### `surface_volatility`

```ocaml
val surface_volatility : 
  float list -> 
  float list -> 
  float -> 
  float -> 
  string -> 
  (float * float * float) list
```

Generate volatility surface from market data.

Parameters:
- `spots`: List of spot prices
- `strikes`: List of strike prices
- `maturity`: Time to maturity
- `rate`: Risk-free rate
- `csv_file`: Market data file

Returns: List of `(spot, strike, volatility)` tuples

## Examples

### Put Option

```ocaml
let put_input = Pricing.{
  spot = 100.0;
  strike = 105.0;
  maturity = 0.5;
  rate = 0.03;
  volatility = 0.25;
  option_type = Put;
}

let result = Pricing.price_option put_input
```

### High Precision Pricing

```ocaml
let result = Pricing.price_option 
  ~n_s:500 
  ~n_t:500 
  ~scheme:`CN 
  input
```

### Market Data Calibration

```ocaml
let result = Pricing.price_from_csv 
  ~vol_method:(Calibration.EWMA 0.94)
  "NIFTY FINANCIAL SERVICES-25-11-2024-to-25-11-2025.csv"
  23000.0
  0.25
  Pricing.Call
```

## Running Examples

Build and run the example program:

```bash
dune build
dune exec example_pricing
```

## Implementation Details

The pricing model uses:
- **PDE Solver**: Finite difference method with Crank-Nicolson scheme
- **Boundary Conditions**: Analytic boundaries for accuracy
- **Greeks**: Finite difference approximation on solution surface
- **Grid Adaptation**: Automatic domain selection based on spot and strike

## Performance

- Typical pricing time: <50ms for 200x200 grid
- Accuracy: Errors typically <0.001 vs analytical Black-Scholes
- Memory: O(n_s × n_t) for grid storage

## Integration

The pricing model integrates seamlessly with existing modules:
- `Bs_params`: Parameter management
- `Grid`: Spatial/temporal discretization
- `Pde1d`: Core PDE solver
- `Market_data`: CSV data parsing
- `Calibration`: Parameter estimation
