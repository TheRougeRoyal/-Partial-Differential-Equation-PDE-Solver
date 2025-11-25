open Pde_opt

let () =
  let csv_file = "NIFTY FINANCIAL SERVICES-25-11-2024-to-25-11-2025.csv" in
  
  if not (Sys.file_exists csv_file) then (
    Printf.printf "Market data file not found: %s\n" csv_file;
    Printf.printf "Using synthetic data instead.\n\n";
    
    let input = Pricing.{
      spot = 23500.0;
      strike = 24000.0;
      maturity = 0.25;
      rate = 0.065;
      volatility = 0.18;
      option_type = Call;
    } in
    
    Printf.printf "=== Synthetic Market Pricing ===\n\n";
    Printf.printf "Parameters:\n";
    Printf.printf "  Spot: %.2f\n" input.spot;
    Printf.printf "  Strike: %.2f\n" input.strike;
    Printf.printf "  Maturity: %.2f years\n" input.maturity;
    Printf.printf "  Rate: %.2f%%\n" (input.rate *. 100.0);
    Printf.printf "  Volatility: %.2f%%\n\n" (input.volatility *. 100.0);
    
    let result = Pricing.price_option ~n_s:300 ~n_t:300 input in
    Pricing.print_output result;
    
  ) else (
    Printf.printf "=== Market Data Pricing ===\n\n";
    
    let market_data = Market_data.parse_csv csv_file in
    let current_spot = Market_data.latest_close market_data in
    
    Printf.printf "Latest spot price: %.2f\n\n" current_spot;
    
    let strikes = [
      current_spot *. 0.95;
      current_spot;
      current_spot *. 1.05;
    ] in
    
    let maturities = [0.25; 0.5; 1.0] in
    
    Printf.printf "Strike  Maturity  Call Price  Put Price   Call Delta  Put Delta\n";
    Printf.printf "------  --------  ----------  ----------  ----------  ---------\n";
    
    List.iter (fun maturity ->
      List.iter (fun strike ->
        let call_result = Pricing.price_from_csv 
          ~n_s:250 
          ~n_t:250
          csv_file strike maturity Pricing.Call in
        
        let put_result = Pricing.price_from_csv 
          ~n_s:250 
          ~n_t:250
          csv_file strike maturity Pricing.Put in
        
        Printf.printf "%.0f    %.2f      %.2f        %.2f        %.4f      %.4f\n"
          strike maturity 
          call_result.Pricing.price put_result.Pricing.price
          call_result.Pricing.delta put_result.Pricing.delta;
      ) strikes;
      Printf.printf "\n";
    ) maturities;
  )
