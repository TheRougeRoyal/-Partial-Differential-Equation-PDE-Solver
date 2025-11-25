open Pde_opt

let backtest_predictions csv_file =
  let market_data = Market_data.parse_csv csv_file in
  let data = market_data.data in
  let n = Array.length data in
  
  if n < 60 then begin
    Printf.printf "Insufficient data for backtesting (need at least 60 days)\n";
    exit 1
  end;
  
  Printf.printf "=== Backtesting %s ===\n\n" market_data.symbol;
  
  let test_points = 20 in
  let train_size = n - test_points in
  
  let errors = ref [] in
  let predictions_list = ref [] in
  
  for i = 0 to test_points - 1 do
    let train_end = train_size + i in
    let train_data = Array.sub data 0 train_end in
    let train_market = { market_data with data = train_data } in
    
    let calibrated = Calibration.calibrate train_market Calibration.Combined in
    let spot = Market_data.latest_close train_market in
    
    let (pred, _, _) = Crypto_model.monte_carlo_forecast
      ~spot
      ~drift:calibrated.Calibration.drift
      ~volatility:calibrated.Calibration.volatility
      ~days:1
      ~n_simulations:500 in
    
    let actual = data.(train_end).Market_data.close in
    let error = Float.abs (pred -. actual) /. actual in
    
    errors := error :: !errors;
    predictions_list := (pred, actual) :: !predictions_list;
    
    if i mod 5 = 0 then
      Printf.printf "Day %d: Predicted=%.2f, Actual=%.2f, Error=%.1f%%\n"
        (i + 1) pred actual (error *. 100.0)
  done;
  
  let mean_error = List.fold_left (+.) 0.0 !errors /. float_of_int test_points in
  let rmse = Float.sqrt (
    List.fold_left (fun acc e -> acc +. e *. e) 0.0 !errors /. float_of_int test_points
  ) in
  
  Printf.printf "\nBacktest Results:\n";
  Printf.printf "  Mean Absolute Error: %.2f%%\n" (mean_error *. 100.0);
  Printf.printf "  RMSE: %.2f%%\n" (rmse *. 100.0);
  Printf.printf "  Test Points: %d\n" test_points;
  
  let pred_array = Array.of_list (List.rev_map fst !predictions_list) in
  let actual_array = Array.of_list (List.rev_map snd !predictions_list) in
  
  let pred_mean = Array.fold_left (+.) 0.0 pred_array /. float_of_int test_points in
  let actual_mean = Array.fold_left (+.) 0.0 actual_array /. float_of_int test_points in
  
  let numerator = ref 0.0 in
  let pred_var = ref 0.0 in
  let actual_var = ref 0.0 in
  
  for i = 0 to test_points - 1 do
    let pred_dev = pred_array.(i) -. pred_mean in
    let actual_dev = actual_array.(i) -. actual_mean in
    numerator := !numerator +. pred_dev *. actual_dev;
    pred_var := !pred_var +. pred_dev *. pred_dev;
    actual_var := !actual_var +. actual_dev *. actual_dev
  done;
  
  let correlation = !numerator /. Float.sqrt (!pred_var *. !actual_var) in
  Printf.printf "  Correlation: %.3f\n\n" correlation

let () =
  let files = ["coin_Bitcoin.csv"; "coin_Solana.csv"; "coin_Dogecoin.csv"] in
  List.iter (fun file ->
    if Sys.file_exists file then begin
      backtest_predictions file;
      Printf.printf "%s\n\n" (String.make 60 '=')
    end
  ) files
