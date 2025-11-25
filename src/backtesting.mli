type test_result = {
  date: string;
  actual_price: float;
  predicted_price: float;
  error: float;
  relative_error: float;
}

type backtest_stats = {
  num_tests: int;
  mean_absolute_error: float;
  mean_relative_error: float;
  rmse: float;
  max_error: float;
  correlation: float;
  results: test_result array;
}

val run_backtest :
  Market_data.t -> Bs_params.t -> float -> Payoff.kind -> 
  float -> Time_stepper.scheme -> backtest_stats

val print_summary : backtest_stats -> unit

val export_to_csv : string -> backtest_stats -> unit
