(** Backtesting framework for validating option pricing models against historical data *)

(** Backtesting result for a single observation *)
type test_result = {
  date: string;
  actual_price: float;
  predicted_price: float;
  error: float;
  relative_error: float;
}

(** Aggregate backtesting statistics *)
type backtest_stats = {
  num_tests: int;
  mean_absolute_error: float;
  mean_relative_error: float;
  rmse: float;
  max_error: float;
  correlation: float;
  results: test_result array;
}

(** Run backtest by comparing model predictions against historical prices
    @param market_data historical market data
    @param params Black-Scholes parameters to use
    @param strike strike price for the option
    @param payoff option type (call or put)
    @param time_to_maturity time horizon for pricing
    @param scheme numerical scheme to use
    @return backtesting statistics *)
val run_backtest :
  Market_data.t -> Bs_params.t -> float -> Payoff.kind -> 
  float -> Time_stepper.scheme -> backtest_stats

(** Print backtesting summary to stdout *)
val print_summary : backtest_stats -> unit

(** Export backtest results to CSV file *)
val export_to_csv : string -> backtest_stats -> unit
