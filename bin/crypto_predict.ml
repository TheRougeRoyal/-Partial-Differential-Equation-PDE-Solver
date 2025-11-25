open Pde_opt

let print_prediction pred =
  Printf.printf "  %s: $%.2f [%.2f - %.2f] (σ=%.1f%%)\n"
    pred.Crypto_model.timestamp
    pred.predicted_price
    pred.confidence_lower
    pred.confidence_upper
    (pred.volatility *. 100.0)

let print_signal signal =
  let trend_str = match signal.Crypto_analytics.trend with
    | Bullish -> "🟢 Bullish"
    | Bearish -> "🔴 Bearish"
    | Neutral -> "⚪ Neutral" in
  
  Printf.printf "\nMarket Signal:\n";
  Printf.printf "  Trend: %s (strength: %.1f%%)\n" trend_str (signal.strength *. 100.0);
  Printf.printf "  Momentum: %.2f\n" signal.momentum;
  Printf.printf "  Mean Reversion: %.2f\n" signal.mean_reversion_score

let analyze_crypto csv_file =
  Printf.printf "=== Crypto Price Prediction ===\n\n";
  
  let market_data = Market_data.parse_csv csv_file in
  let symbol = market_data.symbol in
  let current_price = Market_data.latest_close market_data in
  let (start_date, end_date) = Market_data.date_range market_data in
  
  Printf.printf "Asset: %s\n" symbol;
  Printf.printf "Current Price: $%.2f\n" current_price;
  Printf.printf "Data Range: %s to %s\n" start_date end_date;
  Printf.printf "Data Points: %d\n\n" (Array.length market_data.data);
  
  let calibrated = Calibration.calibrate market_data Calibration.Combined in
  Printf.printf "Calibrated Parameters:\n";
  Printf.printf "  Volatility: %.2f%%\n" (calibrated.volatility *. 100.0);
  Printf.printf "  Drift: %.2f%%\n" (calibrated.drift *. 100.0);
  Printf.printf "  Confidence: %.1f%%\n\n" (calibrated.vol_confidence *. 100.0);
  
  let signal = Crypto_analytics.analyze_signal market_data in
  print_signal signal;
  
  Printf.printf "\n7-Day Forecast (95%% confidence):\n";
  let params = Crypto_model.default_params in
  let predictions = Crypto_model.predict market_data params in
  Array.iter print_prediction predictions;
  
  Printf.printf "\n"

let () =
  let crypto_files = [
    "coin_Bitcoin.csv";
    "coin_Solana.csv";
    "coin_Dogecoin.csv";
  ] in
  
  List.iter (fun file ->
    if Sys.file_exists file then begin
      analyze_crypto file;
      Printf.printf "%s\n" (String.make 60 '=');
      Printf.printf "\n"
    end
  ) crypto_files
