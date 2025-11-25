open Pde_opt

let () =
  Printf.printf "=== Crypto Model API Example ===\n\n";
  
  let market_data = Market_data.parse_csv "coin_Bitcoin.csv" in
  
  Printf.printf "1. Market Data Analysis\n";
  let (min_p, max_p, mean_p, std_p) = Market_data.price_statistics market_data in
  Printf.printf "   Range: $%.2f - $%.2f\n" min_p max_p;
  Printf.printf "   Mean: $%.2f (σ=$%.2f)\n\n" mean_p std_p;
  
  Printf.printf "2. Parameter Calibration\n";
  let calibrated = Calibration.calibrate market_data Calibration.Combined in
  Printf.printf "   Volatility: %.1f%%\n" (calibrated.volatility *. 100.0);
  Printf.printf "   Drift: %.1f%%\n\n" (calibrated.drift *. 100.0);
  
  Printf.printf "3. Technical Analysis\n";
  let signal = Crypto_analytics.analyze_signal market_data in
  Printf.printf "   Trend: %s\n" (match signal.trend with
    | Bullish -> "Bullish" | Bearish -> "Bearish" | Neutral -> "Neutral");
  Printf.printf "   Momentum: %.2f\n\n" signal.momentum;
  
  Printf.printf "4. Price Prediction\n";
  let params = Crypto_model.{ lookback_window = 30; forecast_horizon = 3; confidence_level = 0.95 } in
  let predictions = Crypto_model.predict market_data params in
  Array.iter (fun p ->
    Printf.printf "   %s: $%.2f\n" p.Crypto_model.timestamp p.predicted_price
  ) predictions;
  
  Printf.printf "\n5. Option Pricing\n";
  let spot = Market_data.latest_close market_data in
  let rate = Calibration.estimate_risk_free_rate calibrated () in
  let input = Pricing.{
    spot;
    strike = spot *. 1.1;
    maturity = 30.0 /. 365.0;
    rate;
    volatility = calibrated.volatility;
    option_type = Call;
  } in
  let result = Pricing.price_option input in
  Printf.printf "   Call Price: $%.2f\n" result.price;
  Printf.printf "   Delta: %.3f\n" result.delta
