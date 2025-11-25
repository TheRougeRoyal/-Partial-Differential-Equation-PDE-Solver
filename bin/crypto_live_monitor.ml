open Pde_opt

let monitor_interval = 5.0

let print_option_chain spot volatility =
  let rate = 0.05 in
  let maturity = 30.0 /. 365.0 in
  
  Printf.printf "\n  Strike    Call      Put       Delta\n";
  Printf.printf "  ------    ----      ---       -----\n";
  
  List.iter (fun strike_pct ->
    let strike = spot *. strike_pct in
    let call_input = Pricing.{ spot; strike; maturity; rate; volatility; option_type = Call } in
    let put_input = Pricing.{ spot; strike; maturity; rate; volatility; option_type = Put } in
    
    let call_result = Pricing.price_option call_input in
    let put_result = Pricing.price_option put_input in
    
    Printf.printf "  $%-7.0f  $%-7.2f  $%-7.2f  %.3f\n"
      strike call_result.price put_result.price call_result.delta
  ) [0.9; 0.95; 1.0; 1.05; 1.1]

let () =
  Printf.printf "=== Live Options Monitor ===\n";
  Printf.printf "Refreshing every %.0f seconds. Press Ctrl+C to stop.\n\n" monitor_interval;
  
  let market_data = Market_data.parse_csv "coin_Bitcoin.csv" in
  let calibrated = Calibration.calibrate market_data Calibration.Combined in
  
  while true do
    match Live_data.get_latest "Bitcoin" with
    | None -> 
        Printf.printf "Waiting for live data...\n";
        Unix.sleep (int_of_float monitor_interval)
    | Some spot ->
        let time = Unix.time () |> Unix.localtime in
        Printf.printf "[%02d:%02d:%02d] Bitcoin: $%.2f\n"
          time.tm_hour time.tm_min time.tm_sec spot;
        
        print_option_chain spot calibrated.volatility;
        Printf.printf "\n";
        Unix.sleep (int_of_float monitor_interval)
  done
