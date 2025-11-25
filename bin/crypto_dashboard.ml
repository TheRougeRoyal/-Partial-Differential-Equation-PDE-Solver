open Pde_opt

let print_header title =
  Printf.printf "\n%s\n" (String.make 70 '=');
  Printf.printf "%s\n" title;
  Printf.printf "%s\n\n" (String.make 70 '=')

let analyze_asset csv_file =
  let market_data = Market_data.parse_csv csv_file in
  let symbol = market_data.symbol in
  let current = Market_data.latest_close market_data in
  let (start_date, end_date) = Market_data.date_range market_data in
  let n = Array.length market_data.data in
  
  print_header (Printf.sprintf "📊 %s Analysis" symbol);
  
  Printf.printf "Current Price: $%.2f\n" current;
  Printf.printf "Data: %s to %s (%d days)\n\n" start_date end_date n;
  
  let calibrated = Calibration.calibrate market_data Calibration.Combined in
  Printf.printf "📈 Market Parameters:\n";
  Printf.printf "  Volatility: %.1f%%\n" (calibrated.volatility *. 100.0);
  Printf.printf "  Annual Drift: %.1f%%\n" (calibrated.drift *. 100.0);
  Printf.printf "  Confidence: %.0f%%\n\n" (calibrated.vol_confidence *. 100.0);
  
  let signal = Crypto_analytics.analyze_signal market_data in
  let trend_emoji = match signal.trend with
    | Bullish -> "🟢"
    | Bearish -> "🔴"
    | Neutral -> "⚪" in
  let trend_text = match signal.trend with
    | Bullish -> "Bullish"
    | Bearish -> "Bearish"
    | Neutral -> "Neutral" in
  
  Printf.printf "🎯 Trading Signal:\n";
  Printf.printf "  %s %s (strength: %.1f%%)\n" 
    trend_emoji trend_text (signal.strength *. 100.0);
  Printf.printf "  Momentum: %.2f\n" signal.momentum;
  Printf.printf "  Mean Reversion: %.2f\n\n" signal.mean_reversion_score;
  
  let params = Crypto_model.default_params in
  let predictions = Crypto_model.predict market_data params in
  
  Printf.printf "🔮 7-Day Forecast:\n";
  Array.iteri (fun i pred ->
    Printf.printf "  Day %d: $%.2f [%.2f - %.2f]\n"
      (i + 1)
      pred.Crypto_model.predicted_price
      pred.confidence_lower
      pred.confidence_upper
  ) predictions;
  
  let option_strike = current *. 1.05 in
  let option_maturity = 7.0 /. 365.0 in
  let rate = Calibration.estimate_risk_free_rate calibrated () in
  
  Printf.printf "\n💰 Option Pricing (K=$%.2f, T=7d):\n" option_strike;
  
  let call_input = Pricing.{
    spot = current;
    strike = option_strike;
    maturity = option_maturity;
    rate;
    volatility = calibrated.volatility;
    option_type = Call;
  } in
  
  let call_result = Pricing.price_option call_input in
  Printf.printf "  Call: $%.4f (Δ=%.3f)\n" 
    call_result.price call_result.delta;
  
  let put_input = Pricing.{ call_input with option_type = Put } in
  let put_result = Pricing.price_option put_input in
  Printf.printf "  Put:  $%.4f (Δ=%.3f)\n" 
    put_result.price put_result.delta

let () =
  print_header "🚀 Crypto Trading Dashboard";
  
  let assets = [
    ("coin_Bitcoin.csv", "Bitcoin");
    ("coin_Solana.csv", "Solana");
    ("coin_Dogecoin.csv", "Dogecoin");
  ] in
  
  List.iter (fun (file, name) ->
    if Sys.file_exists file then
      analyze_asset file
    else
      Printf.printf "⚠️  %s data not found\n" name
  ) assets;
  
  Printf.printf "\n%s\n" (String.make 70 '=');
  Printf.printf "Dashboard complete\n"
