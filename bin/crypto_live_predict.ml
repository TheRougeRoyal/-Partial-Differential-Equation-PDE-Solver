open Pde_opt

let () =
  Printf.printf "=== Live Crypto Analysis & Prediction ===\n\n";
  
  let prices = Live_data.fetch () in
  
  if prices = [] then begin
    Printf.printf "No live data. Start bridge: ./start_live_feed.sh\n";
    exit 1
  end;
  
  match Live_data.get_latest "Bitcoin" with
  | None -> Printf.printf "Bitcoin not available\n"
  | Some live_spot ->
      let market_data = Market_data.parse_csv "coin_Bitcoin.csv" in
      let calibrated = Calibration.calibrate market_data Calibration.Combined in
      let historical_spot = Market_data.latest_close market_data in
      
      Printf.printf "Bitcoin Analysis\n";
      Printf.printf "  Live Price: $%.2f\n" live_spot;
      Printf.printf "  Historical: $%.2f\n" historical_spot;
      Printf.printf "  Change: %.2f%%\n\n" 
        ((live_spot -. historical_spot) /. historical_spot *. 100.0);
      
      Printf.printf "Market Parameters\n";
      Printf.printf "  Volatility: %.1f%%\n" (calibrated.volatility *. 100.0);
      Printf.printf "  Drift: %.1f%%\n\n" (calibrated.drift *. 100.0);
      
      let params = Crypto_model.{ 
        lookback_window = 30; 
        forecast_horizon = 7; 
        confidence_level = 0.95 
      } in
      
      let predictions = Crypto_model.predict market_data params in
      
      Printf.printf "7-Day Forecast\n";
      Array.iter (fun p ->
        Printf.printf "  %s: $%.2f [%.2f - %.2f]\n" 
          p.Crypto_model.timestamp 
          p.predicted_price
          p.confidence_lower
          p.confidence_upper
      ) predictions;
      
      Printf.printf "\nOption Pricing (30-day ATM Call)\n";
      let rate = Calibration.estimate_risk_free_rate calibrated () in
      let input = Pricing.{
        spot = live_spot;
        strike = live_spot;
        maturity = 30.0 /. 365.0;
        rate;
        volatility = calibrated.volatility;
        option_type = Call;
      } in
      
      let result = Pricing.price_option input in
      Printf.printf "  Premium: $%.2f\n" result.price;
      Printf.printf "  Delta: %.3f\n" result.delta;
      Printf.printf "  Gamma: %.6f\n" result.gamma;
      Printf.printf "  Vega: %.2f\n" result.vega;
      Printf.printf "  Theta: %.2f\n" result.theta
