(** Backtesting framework for validating option pricing models *)

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

let run_backtest market_data params strike payoff time_to_maturity scheme =
  let data_points = market_data.Market_data.data in
  let n = Array.length data_points in
  
  if n < 10 then
    invalid_arg "Insufficient data for backtesting (need at least 10 points)";
  
  (* Create grid for pricing *)
  let grid = Grid.make_adaptive market_data 
    (Market_data.latest_close market_data) params ~n_s:200 ~n_t:200 in
  
  (* Run pricing for each data point *)
  let results = Array.mapi (fun i dp ->
    let s0 = dp.Market_data.close in
    
    (* Price the option using the PDE solver *)
    let (predicted_price, _) = Api.price_euro 
      ~params ~grid ~s0 ~scheme ~payoff in
    
    (* For backtesting, we use the actual price as the intrinsic value
       (This is a simplification - in practice you'd use actual market option prices) *)
    let actual_price = Payoff.terminal payoff ~k:strike s0 in
    
    let error = predicted_price -. actual_price in
    let relative_error = 
      if Float.abs actual_price > 0.001 then
        error /. actual_price
      else
        0.0
    in
    
    {
      date = dp.Market_data.date;
      actual_price;
      predicted_price;
      error;
      relative_error;
    }
  ) data_points in
  
  (* Calculate aggregate statistics *)
  let sum_abs_error = Array.fold_left (fun acc r -> 
    acc +. Float.abs r.error) 0.0 results in
  let sum_rel_error = Array.fold_left (fun acc r -> 
    acc +. Float.abs r.relative_error) 0.0 results in
  let sum_sq_error = Array.fold_left (fun acc r -> 
    acc +. r.error *. r.error) 0.0 results in
  let max_error = Array.fold_left (fun acc r -> 
    Float.max acc (Float.abs r.error)) 0.0 results in
  
  let mean_abs_error = sum_abs_error /. float_of_int n in
  let mean_rel_error = sum_rel_error /. float_of_int n in
  let rmse = Float.sqrt (sum_sq_error /. float_of_int n) in
  
  (* Calculate correlation coefficient *)
  let actual_mean = Array.fold_left (fun acc r -> 
    acc +. r.actual_price) 0.0 results /. float_of_int n in
  let predicted_mean = Array.fold_left (fun acc r -> 
    acc +. r.predicted_price) 0.0 results /. float_of_int n in
  
  let numerator = Array.fold_left (fun acc r ->
    acc +. (r.actual_price -. actual_mean) *. (r.predicted_price -. predicted_mean)
  ) 0.0 results in
  
  let actual_var = Array.fold_left (fun acc r ->
    let diff = r.actual_price -. actual_mean in
    acc +. diff *. diff
  ) 0.0 results in
  
  let predicted_var = Array.fold_left (fun acc r ->
    let diff = r.predicted_price -. predicted_mean in
    acc +. diff *. diff
  ) 0.0 results in
  
  let correlation = 
    if actual_var > 0.0 && predicted_var > 0.0 then
      numerator /. Float.sqrt (actual_var *. predicted_var)
    else
      0.0
  in
  
  {
    num_tests = n;
    mean_absolute_error = mean_abs_error;
    mean_relative_error = mean_rel_error;
    rmse;
    max_error;
    correlation;
    results;
  }

let print_summary stats =
  Printf.printf "\n=== Backtesting Summary ===\n";
  Printf.printf "Number of tests: %d\n" stats.num_tests;
  Printf.printf "Mean Absolute Error: %.4f\n" stats.mean_absolute_error;
  Printf.printf "Mean Relative Error: %.2f%%\n" (stats.mean_relative_error *. 100.0);
  Printf.printf "RMSE: %.4f\n" stats.rmse;
  Printf.printf "Max Error: %.4f\n" stats.max_error;
  Printf.printf "Correlation: %.4f\n" stats.correlation;
  Printf.printf "========================\n\n"

let export_to_csv filename stats =
  let oc = open_out filename in
  
  (* Write header *)
  Printf.fprintf oc "Date,Actual,Predicted,Error,RelativeError\n";
  
  (* Write results *)
  Array.iter (fun r ->
    Printf.fprintf oc "%s,%.4f,%.4f,%.4f,%.4f\n"
      r.date r.actual_price r.predicted_price r.error r.relative_error
  ) stats.results;
  
  close_out oc;
  Printf.printf "Backtest results exported to %s\n" filename
