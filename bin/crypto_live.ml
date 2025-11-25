open Pde_opt

let () =
  Printf.printf "=== Live Crypto Prices ===\n\n";
  
  let prices = Live_data.fetch () in
  
  if prices = [] then
    Printf.printf "No live data available. Start the bridge: cd tradingview_bridge && npm start\n"
  else begin
    List.iter (fun (_, price) ->
      Printf.printf "%s: $%.2f (Vol: %.0f)\n" 
        price.Live_data.symbol 
        price.price 
        price.volume
    ) prices;
    
    Printf.printf "\n=== Live Option Pricing ===\n\n";
    
    match Live_data.get_latest "Bitcoin" with
    | None -> Printf.printf "Bitcoin price not available\n"
    | Some spot ->
        let market_data = Market_data.parse_csv "coin_Bitcoin.csv" in
        let calibrated = Calibration.calibrate market_data Calibration.Combined in
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
        Printf.printf "Spot: $%.2f\n" spot;
        Printf.printf "Strike: $%.2f\n" input.strike;
        Printf.printf "Call Price: $%.2f\n" result.price;
        Printf.printf "Delta: %.3f\n" result.delta
  end
