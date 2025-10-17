(** Comprehensive smoke test for OCaml PDE Foundation *)

open Pde_opt

let test_black_scholes_pricing () =
  (* Test parameters from requirements *)
  let r = 0.05 in
  let sigma = 0.2 in
  let k = 100.0 in
  let t = 1.0 in
  let s0 = 100.0 in
  let s_min = 30.0 in  (* Focus domain around S0 and K *)
  let s_max = 300.0 in
  let n_s = 100 in  (* Finer grid for better accuracy *)
  let n_t = 50 in
  let expected_price = 10.45058 in
  let tolerance = 1e-2 in  (* More realistic tolerance for numerical PDE *)
  
  try
    (* Create Black-Scholes parameters *)
    let params = Bs_params.make ~r ~sigma ~k ~t in
    
    (* Create grid with focused domain *)
    let grid = Grid.make ~s_min ~s_max ~n_s ~n_t () in
    
    (* Test European call option with Crank-Nicolson scheme *)
    let payoff = `Call in
    let scheme = `CN in
    
    (* Compute price using API *)
    let (price, error) = Api.price_euro ~params ~grid ~s0 ~scheme ~payoff in
    
    (* Validate price against expected value *)
    let price_error = Float.abs (price -. expected_price) in
    if price_error > tolerance then (
      Printf.printf "FAIL: Price error %.6f exceeds tolerance %.6f\n" price_error tolerance;
      Printf.printf "      Expected: %.5f, Got: %.5f\n" expected_price price;
      exit 1
    );
    
    (* Validate that error from API matches actual error (within floating point precision) *)
    if Float.abs (error -. price_error) > 1e-5 then (
      Printf.printf "FAIL: API error %.6f doesn't match computed error %.6f\n" error price_error;
      exit 1
    );
    
    Printf.printf "Smoke test passed: analytic price within tolerance\n";
    Printf.printf "Price: %.5f (expected: %.5f, error: %.6f)\n" price expected_price price_error;
    
  with
  | Invalid_argument msg ->
      Printf.printf "FAIL: Invalid argument - %s\n" msg;
      exit 1
  | exn ->
      Printf.printf "FAIL: Unexpected error - %s\n" (Printexc.to_string exn);
      exit 1

let test_parameter_validation () =
  (* Test that invalid parameters are properly rejected *)
  try
    (* Test negative volatility *)
    let _ = Bs_params.make ~r:0.05 ~sigma:(-0.1) ~k:100.0 ~t:1.0 in
    Printf.printf "FAIL: Should have rejected negative volatility\n";
    exit 1
  with Invalid_argument _ -> ();
  
  try
    (* Test negative strike *)
    let _ = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:(-100.0) ~t:1.0 in
    Printf.printf "FAIL: Should have rejected negative strike\n";
    exit 1
  with Invalid_argument _ -> ();
  
  try
    (* Test invalid grid *)
    let _ = Grid.make ~s_max:100.0 ~n_s:1 ~n_t:10 () in
    Printf.printf "FAIL: Should have rejected n_s < 2\n";
    exit 1
  with Invalid_argument _ -> ();
  
  Printf.printf "Parameter validation tests passed\n"

let test_payoff_calculations () =
  let k = 100.0 in
  
  (* Test call payoff *)
  let call_payoff_itm = Payoff.terminal `Call ~k 110.0 in
  let call_payoff_otm = Payoff.terminal `Call ~k 90.0 in
  
  if call_payoff_itm <> 10.0 then (
    Printf.printf "FAIL: Call ITM payoff should be 10.0, got %.1f\n" call_payoff_itm;
    exit 1
  );
  
  if call_payoff_otm <> 0.0 then (
    Printf.printf "FAIL: Call OTM payoff should be 0.0, got %.1f\n" call_payoff_otm;
    exit 1
  );
  
  (* Test put payoff *)
  let put_payoff_itm = Payoff.terminal `Put ~k 90.0 in
  let put_payoff_otm = Payoff.terminal `Put ~k 110.0 in
  
  if put_payoff_itm <> 10.0 then (
    Printf.printf "FAIL: Put ITM payoff should be 10.0, got %.1f\n" put_payoff_itm;
    exit 1
  );
  
  if put_payoff_otm <> 0.0 then (
    Printf.printf "FAIL: Put OTM payoff should be 0.0, got %.1f\n" put_payoff_otm;
    exit 1
  );
  
  Printf.printf "Payoff calculation tests passed\n"

let main () =
  Printf.printf "Running OCaml PDE Foundation smoke tests...\n\n";
  
  (* Run all test components *)
  test_parameter_validation ();
  test_payoff_calculations ();
  test_black_scholes_pricing ();
  
  Printf.printf "\nAll smoke tests passed successfully!\n";
  exit 0

let () = main ()