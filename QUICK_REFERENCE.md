# Pricing Model - Quick Reference

## Installation

```bash
cd -Partial-Differential-Equation-PDE-Solver
dune build
```

## Basic Usage

### Price a Call Option

```ocaml
open Pde_opt

let call = Pricing.{
  spot = 100.0;
  strike = 100.0;
  maturity = 1.0;
  rate = 0.05;
  volatility = 0.2;
  option_type = Call;
}

let result = Pricing.price_option call in
Printf.printf "Price: %.4f\n" result.Pricing.price;
Printf.printf "Delta: %.4f\n" result.Pricing.delta
```

### Price a Put Option

```ocaml
let put = Pricing.{ call with option_type = Put } in
let result = Pricing.price_option put
```

### Price from CSV

```ocaml
let result = Pricing.price_from_csv 
  "data.csv" 
  100.0 
  1.0 
  Pricing.Call
```

### Batch Pricing

```ocaml
let strikes = [90.0; 95.0; 100.0; 105.0; 110.0] in
let inputs = List.map (fun k -> 
  Pricing.{ call with strike = k }
) strikes in
let results = Pricing.batch_price inputs ()
```

## Command Line Examples

### Run Examples

```bash
dune exec example_pricing
dune exec market_pricing
dune exec greeks_analysis
```

### Original CLI

```bash
dune exec pde_opt -- --s0 100 --k 100 --t 1 --r 0.05 --sigma 0.2 --payoff call
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

```ocaml
val price_option : 
  ?n_s:int -> 
  ?n_t:int -> 
  ?scheme:[`BE | `CN] -> 
  pricing_input -> 
  pricing_output

val price_from_csv : 
  ?n_s:int -> 
  ?n_t:int -> 
  ?scheme:[`BE | `CN] -> 
  ?vol_method:Calibration.vol_method -> 
  string -> float -> float -> option_type -> 
  pricing_output

val batch_price : 
  pricing_input list -> 
  ?n_s:int -> ?n_t:int -> ?scheme:[`BE | `CN] -> 
  unit -> pricing_output list

val print_output : pricing_output -> unit
```

## Common Patterns

### Strike Sweep

```ocaml
List.iter (fun strike ->
  let input = Pricing.{ base with strike } in
  let result = Pricing.price_option input in
  Printf.printf "K=%.0f: Price=%.2f Delta=%.4f\n"
    strike result.Pricing.price result.Pricing.delta
) [90.0; 100.0; 110.0]
```

### Maturity Curve

```ocaml
List.iter (fun maturity ->
  let input = Pricing.{ base with maturity } in
  let result = Pricing.price_option input in
  Printf.printf "T=%.2f: Price=%.2f Theta=%.2f\n"
    maturity result.Pricing.price result.Pricing.theta
) [0.25; 0.5; 1.0]
```

### Vol Surface

```ocaml
List.iter (fun vol ->
  let input = Pricing.{ base with volatility = vol } in
  let result = Pricing.price_option input in
  Printf.printf "σ=%.0f%%: Price=%.2f Vega=%.2f\n"
    (vol *. 100.0) result.Pricing.price result.Pricing.vega
) [0.1; 0.2; 0.3]
```

## Parameters

### Optional Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `n_s` | 200 | Spatial grid points |
| `n_t` | 200 | Time grid points |
| `scheme` | `CN | Crank-Nicolson or `BE |
| `vol_method` | `Combined` | Volatility calibration |

### Grid Size Guidelines

- **100×100**: Quick estimates (~10ms)
- **200×200**: Standard pricing (~40ms)
- **500×500**: High precision (~250ms)

## Greeks Interpretation

| Greek | Meaning | Units |
|-------|---------|-------|
| Delta | ∂V/∂S | per point |
| Gamma | ∂²V/∂S² | per point² |
| Theta | ∂V/∂t | per year |
| Vega | ∂V/∂σ | per volatility point |

### Delta Ranges

- **0.0-0.2**: Deep OTM
- **0.2-0.4**: OTM
- **0.4-0.6**: ATM
- **0.6-0.8**: ITM
- **0.8-1.0**: Deep ITM

## Validation

### Check Accuracy

```ocaml
let result = Pricing.price_option input in
Printf.printf "PDE: %.5f\n" result.Pricing.price;
Printf.printf "BS:  %.5f\n" result.Pricing.analytic_price;
Printf.printf "Err: %.5f\n" result.Pricing.error
```

### Put-Call Parity

```ocaml
let call_result = Pricing.price_option call_input in
let put_result = Pricing.price_option put_input in
let lhs = call_result.Pricing.price -. put_result.Pricing.price in
let rhs = input.spot -. input.strike *. 
  exp(-. input.rate *. input.maturity) in
Printf.printf "C-P: %.4f, S-K: %.4f\n" lhs rhs
```

## Error Messages

| Error | Solution |
|-------|----------|
| "Spot price must be positive" | Set spot > 0 |
| "Volatility must be positive" | Set volatility > 0 |
| "Maturity must be non-negative" | Set maturity >= 0 |
| "Market data file not found" | Check CSV path |

## Performance Tips

1. Use default 200×200 grid for standard pricing
2. Batch similar options together
3. Reuse grid parameters when possible
4. Cache calibrated parameters

## Files

| File | Purpose |
|------|---------|
| `src/pricing.ml` | Main pricing module |
| `src/pricing.mli` | Interface |
| `bin/example_pricing.ml` | Basic examples |
| `bin/market_pricing.ml` | CSV integration |
| `bin/greeks_analysis.ml` | Greeks study |

## Documentation

- `PRICING_MODEL.md`: Comprehensive guide
- `IMPLEMENTATION_GUIDE.md`: Technical details
- `README.md`: Project overview
