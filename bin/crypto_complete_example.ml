open Pde_opt

let analyze_and_trade csv_file =
  let market_data = Market_data.parse_csv csv_file in
  let symbol = market_data.symbol in
  
  Printf.printf "\n=== %s Trading Strategy ===\n\n" symbol;
  
  let calibrated = Calibration.calibrate market_data Calibration.Combined in
  let spot = Market_data.latest_close market_data in
  let signal = Crypto_analytics.analyze_signal market_data in
  
  Printf.printf "Current: $%.2f | Vol: %.1f%% | Drift: %.1f%%\n"
    spot (calibrated.volatility *. 100.0) (calibrated.drift *. 100.0);
  
  let recommendation = match signal.trend with
    | Bullish when signal.momentum > 0.2 -> "STRONG BUY"
    | Bullish -> "BUY"
    | Bearish when signal.momentum < -0.2 -> "STRONG SELL"
    | Bearish -> "SELL"
    | Neutral -> "HOLD" in
  
  Printf.printf "Signal: %s (momentum: %.2f)\n\n" recommendation signal.momentum;
  
  let params = Crypto_model.default_params in
  let predictions = Crypto_model.predict market_data params in
  let day7 = predictions.(6) in
  
  let expected_return = (day7.predicted_price -. spot) /. spot in
  Printf.printf "7-Day Outlook:\n";
  Printf.printf "  Expected: $%.2f (%.1f%% return)\n" 
    day7.predicted_price (expected_return *. 100.0);
  Printf.printf "  Range: $%.2f - $%.2f\n\n" 
    day7.confidence_lower day7.confidence_upper;
  
  let rate = Calibration.estimate_risk_free_rate calibrated () in
  
  if expected_return > 0.05 then begin
    Printf.printf "Strategy: Buy Call Option\n";
    let call = Pricing.{
      spot;
      strike = spot *. 1.05;
      maturity = 7.0 /. 365.0;
      rate;
      volatility = calibrated.volatility;
      option_type = Call;
    } in
    let result = Pricing.price_option call in
    Printf.printf "  Strike: $%.2f\n" call.strike;
    Printf.printf "  Premium: $%.4f\n" result.price;
    Printf.printf "  Delta: %.3f\n" result.delta;
    Printf.printf "  Max Loss: $%.4f\n" result.price;
    Printf.printf "  Breakeven: $%.2f\n" (call.strike +. result.price)
  end else if expected_return < -0.05 then begin
    Printf.printf "Strategy: Buy Put Option\n";
    let put = Pricing.{
      spot;
      strike = spot *. 0.95;
      maturity = 7.0 /. 365.0;
      rate;
      volatility = calibrated.volatility;
      option_type = Put;
    } in
    let result = Pricing.price_option put in
    Printf.printf "  Strike: $%.2f\n" put.strike;
    Printf.printf "  Premium: $%.4f\n" result.price;
    Printf.printf "  Delta: %.3f\n" result.delta;
    Printf.printf "  Max Loss: $%.4f\n" result.price;
    Printf.printf "  Breakeven: $%.2f\n" (put.strike -. result.price)
  end else begin
    Printf.printf "Strategy: Hold / Neutral\n";
    Printf.printf "  Market shows no clear direction\n"
  end

let () =
  Printf.printf "=== Crypto Trading Strategies ===\n";
  
  ["coin_Bitcoin.csv"; "coin_Solana.csv"; "coin_Dogecoin.csv"]
  |> List.filter Sys.file_exists
  |> List.iter analyze_and_trade;
  
  Printf.printf "\n%s\n" (String.make 60 '=')
