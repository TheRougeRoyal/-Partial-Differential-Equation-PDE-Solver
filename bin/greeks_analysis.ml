open Pde_opt

let () =
  Printf.printf "=== Greeks Analysis for ATM Call Option ===\n\n";
  
  let base_input = Pricing.{
    spot = 100.0;
    strike = 100.0;
    maturity = 1.0;
    rate = 0.05;
    volatility = 0.2;
    option_type = Call;
  } in
  
  Printf.printf "Base Parameters:\n";
  Printf.printf "  S = %.2f, K = %.2f, T = %.2f years\n" 
    base_input.spot base_input.strike base_input.maturity;
  Printf.printf "  r = %.1f%%, σ = %.1f%%\n\n"
    (base_input.rate *. 100.0) (base_input.volatility *. 100.0);
  
  Printf.printf "=== Delta Analysis (∂V/∂S) ===\n\n";
  Printf.printf "Spot    Price    Delta    Interpretation\n";
  Printf.printf "----    -----    -----    --------------\n";
  
  let spots = [80.0; 90.0; 100.0; 110.0; 120.0] in
  List.iter (fun s ->
    let input = Pricing.{ base_input with spot = s } in
    let result = Pricing.price_option input in
    let interp = 
      if result.Pricing.delta > 0.8 then "Deep ITM - High sensitivity"
      else if result.Pricing.delta > 0.6 then "ITM - Good hedge ratio"
      else if result.Pricing.delta > 0.4 then "ATM - Maximum gamma"
      else if result.Pricing.delta > 0.2 then "OTM - Low sensitivity"
      else "Deep OTM - Minimal movement"
    in
    Printf.printf "%.0f     %.2f    %.4f   %s\n"
      s result.Pricing.price result.Pricing.delta interp
  ) spots;
  
  Printf.printf "\n=== Gamma Analysis (∂²V/∂S²) ===\n\n";
  Printf.printf "Volatility  Gamma    Interpretation\n";
  Printf.printf "----------  -----    --------------\n";
  
  let vols = [0.1; 0.15; 0.2; 0.25; 0.3] in
  List.iter (fun vol ->
    let input = Pricing.{ base_input with volatility = vol } in
    let result = Pricing.price_option input in
    let interp =
      if result.Pricing.gamma > 0.025 then "High convexity - Active hedging needed"
      else if result.Pricing.gamma > 0.015 then "Moderate convexity - Regular rebalancing"
      else "Low convexity - Stable delta"
    in
    Printf.printf "%.1f%%       %.5f  %s\n"
      (vol *. 100.0) result.Pricing.gamma interp
  ) vols;
  
  Printf.printf "\n=== Theta Analysis (∂V/∂t) ===\n\n";
  Printf.printf "Time to Maturity  Theta      Daily Decay\n";
  Printf.printf "----------------  -----      -----------\n";
  
  let times = [1.0; 0.5; 0.25; 0.1; 0.05] in
  List.iter (fun t ->
    let input = Pricing.{ base_input with maturity = t } in
    let result = Pricing.price_option input in
    let daily_decay = result.Pricing.theta /. 365.0 in
    Printf.printf "%.2f years        %.2f      %.4f\n"
      t result.Pricing.theta daily_decay
  ) times;
  
  Printf.printf "\n=== Vega Analysis (∂V/∂σ) ===\n\n";
  Printf.printf "Moneyness  Vega     Sensitivity\n";
  Printf.printf "---------  -----    -----------\n";
  
  let strikes = [90.0; 95.0; 100.0; 105.0; 110.0] in
  List.iter (fun k ->
    let input = Pricing.{ base_input with strike = k } in
    let result = Pricing.price_option input in
    let moneyness = base_input.spot /. k in
    let sens = 
      if moneyness > 1.05 then "ITM - Lower vol sensitivity"
      else if moneyness > 0.95 then "ATM - Maximum vol sensitivity"
      else "OTM - Lower vol sensitivity"
    in
    Printf.printf "%.2f       %.2f    %s\n"
      moneyness result.Pricing.vega sens
  ) strikes;
  
  Printf.printf "\n=== Risk Reversal (Put-Call Greeks) ===\n\n";
  
  let call_result = Pricing.price_option base_input in
  let put_input = Pricing.{ base_input with option_type = Put } in
  let put_result = Pricing.price_option put_input in
  
  Printf.printf "Greek     Call      Put       Difference\n";
  Printf.printf "-----     ----      ---       ----------\n";
  Printf.printf "Delta     %.4f    %.4f    %.4f\n"
    call_result.Pricing.delta put_result.Pricing.delta
    (call_result.Pricing.delta -. put_result.Pricing.delta);
  Printf.printf "Gamma     %.5f   %.5f   %.5f\n"
    call_result.Pricing.gamma put_result.Pricing.gamma
    (call_result.Pricing.gamma -. put_result.Pricing.gamma);
  Printf.printf "Theta     %.2f    %.2f     %.2f\n"
    call_result.Pricing.theta put_result.Pricing.theta
    (call_result.Pricing.theta -. put_result.Pricing.theta);
  Printf.printf "Vega      %.2f    %.2f     %.2f\n"
    call_result.Pricing.vega put_result.Pricing.vega
    (call_result.Pricing.vega -. put_result.Pricing.vega);
  
  Printf.printf "\n=== Put-Call Parity Check ===\n\n";
  let parity_lhs = call_result.Pricing.price -. put_result.Pricing.price in
  let parity_rhs = base_input.spot -. base_input.strike *. 
    (Float.exp (-. base_input.rate *. base_input.maturity)) in
  Printf.printf "C - P = %.4f\n" parity_lhs;
  Printf.printf "S - Ke^(-rT) = %.4f\n" parity_rhs;
  Printf.printf "Difference = %.6f\n" (Float.abs (parity_lhs -. parity_rhs));
  Printf.printf "Parity holds: %s\n" 
    (if Float.abs (parity_lhs -. parity_rhs) < 0.01 then "✓ Yes" else "✗ No")
