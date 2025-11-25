open Pde_opt

let () =
  Printf.printf "=== Simple European Option Pricing ===\n\n";
  
  let call_input = Pricing.{
    spot = 100.0;
    strike = 100.0;
    maturity = 1.0;
    rate = 0.05;
    volatility = 0.2;
    option_type = Call;
  } in
  
  Printf.printf "Call Option:\n";
  let call_result = Pricing.price_option call_input in
  Pricing.print_output call_result;
  
  Printf.printf "\n";
  
  let put_input = Pricing.{ call_input with option_type = Put } in
  
  Printf.printf "Put Option:\n";
  let put_result = Pricing.price_option put_input in
  Pricing.print_output put_result;
  
  Printf.printf "\n=== Batch Pricing ===\n\n";
  
  let strikes = [90.0; 95.0; 100.0; 105.0; 110.0] in
  let batch_inputs = List.map (fun k -> 
    Pricing.{ call_input with strike = k }
  ) strikes in
  
  let batch_results = Pricing.batch_price batch_inputs () in
  
  Printf.printf "Strike  Price    Delta    Gamma    Theta    Vega\n";
  Printf.printf "------  -------  -------  -------  -------  -------\n";
  List.iter2 (fun k result ->
    Printf.printf "%.2f    %.4f   %.4f   %.4f   %.4f   %.4f\n"
      k result.Pricing.price result.Pricing.delta result.Pricing.gamma
      result.Pricing.theta result.Pricing.vega
  ) strikes batch_results
