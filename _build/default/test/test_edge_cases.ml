(** Edge case tests for PDE solver
    
    This test suite focuses on boundary conditions, extreme parameters,
    and special cases. Each test is clearly documented and easy to understand.
*)

open Pde_opt

(** Print formatted test header *)
let print_header title =
  Printf.printf "\n╔══════════════════════════════════════════════╗\n";
  Printf.printf "║  %-42s  ║\n" title;
  Printf.printf "╚══════════════════════════════════════════════╝\n"

(** Print test case name *)
let print_test name =
  Printf.printf "\n  → Testing: %s\n" name

(** Assert condition with message *)
let assert_true condition message =
  if not condition then (
    Printf.printf "    ✗ FAIL: %s\n" message;
    exit 1
  ) else
    Printf.printf "    ✓ PASS: %s\n" message

(** Test options at expiry (T=0) *)
let test_at_expiry_options () =
  print_header "At-Expiry Options (T=0)";
  
  (* At expiry, option value = max(payoff, 0) *)
  let test_cases = [
    (* (s0, k, payoff_type, expected_value, description) *)
    (110.0, 100.0, `Call, 10.0, "ITM Call at expiry");
    (95.0, 100.0, `Call, 0.0, "OTM Call at expiry");
    (100.0, 100.0, `Call, 0.0, "ATM Call at expiry");
    (90.0, 100.0, `Put, 10.0, "ITM Put at expiry");
    (105.0, 100.0, `Put, 0.0, "OTM Put at expiry");
    (100.0, 100.0, `Put, 0.0, "ATM Put at expiry");
  ] in
  
  List.iter (fun (s0, k, payoff, expected, desc) ->
    print_test desc;
    
    let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k ~t:0.0 in
    let grid = Grid.make ~s_min:0.0 ~s_max:200.0 ~n_s:20 ~n_t:1 () in
    let (price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff in
    
    Printf.printf "      Expected: %.2f, Got: %.6f\n" expected price;
    
    assert_true (Float.abs (price -. expected) < 1e-10)
      (Printf.sprintf "Price should be %.2f (intrinsic value)" expected);
    
    assert_true (error = 0.0)
      "Error should be zero at expiry";
  ) test_cases

(** Test deep in-the-money options *)
let test_deep_itm_options () =
  print_header "Deep In-The-Money Options";
  
  print_test "Deep ITM Call (S=150, K=100)";
  let params_call = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid_call = Grid.make ~s_min:50.0 ~s_max:250.0 ~n_s:100 ~n_t:50 () in
  let s0 = 150.0 in
  
  let (call_price, _) = Api.price_euro ~params:params_call ~grid:grid_call ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic_call = Payoff.analytic_black_scholes `Call ~r:0.05 ~sigma:0.2 
                        ~t:1.0 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic_call;
  
  (* Deep ITM call should be approximately S - K*exp(-r*T) *)
  let approx_value = s0 -. 100.0 *. Float.exp (-.0.05 *. 1.0) in
  Printf.printf "      Approx (S - K*e^(-rT)): %.6f\n" approx_value;
  
  assert_true (call_price > 45.0)
    "Deep ITM call price should be substantial";
  
  assert_true (Float.abs (call_price -. analytic_call) < 0.1)
    "PDE price close to analytic solution";
  
  print_test "Deep ITM Put (S=50, K=100)";
  let params_put = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  (* Use grid appropriate for low stock prices - must include S=0 for put boundary *)
  let grid_put = Grid.make ~s_min:0.0 ~s_max:150.0 ~n_s:100 ~n_t:50 () in
  let s0_put = 50.0 in
  let (put_price, _) = Api.price_euro ~params:params_put ~grid:grid_put ~s0:s0_put ~scheme:`CN ~payoff:`Put in
  let analytic_put = Payoff.analytic_black_scholes `Put ~r:0.05 ~sigma:0.2 
                       ~t:1.0 ~s0:s0_put ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" put_price;
  Printf.printf "      Analytic:  %.6f\n" analytic_put;
  
  assert_true (put_price > 40.0)
    "Deep ITM put price should be substantial";
  
  assert_true (Float.abs (put_price -. analytic_put) < 0.5)
    "PDE price close to analytic solution"

(** Test deep out-of-the-money options *)
let test_deep_otm_options () =
  print_header "Deep Out-of-The-Money Options";
  
  print_test "Deep OTM Call (S=50, K=100)";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:20.0 ~s_max:200.0 ~n_s:100 ~n_t:50 () in
  let s0 = 50.0 in
  
  let (call_price, _) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic_call = Payoff.analytic_black_scholes `Call ~r:0.05 ~sigma:0.2 
                        ~t:1.0 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic_call;
  
  assert_true (call_price >= 0.0 && call_price < 5.0)
    "Deep OTM call price should be small but non-negative";
  
  assert_true (Float.abs (call_price -. analytic_call) < 0.05)
    "PDE price close to analytic solution";
  
  print_test "Deep OTM Put (S=150, K=100)";
  let s0_put = 150.0 in
  let (put_price, _) = Api.price_euro ~params ~grid ~s0:s0_put ~scheme:`CN ~payoff:`Put in
  let analytic_put = Payoff.analytic_black_scholes `Put ~r:0.05 ~sigma:0.2 
                       ~t:1.0 ~s0:s0_put ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" put_price;
  Printf.printf "      Analytic:  %.6f\n" analytic_put;
  
  assert_true (put_price >= 0.0 && put_price < 5.0)
    "Deep OTM put price should be small but non-negative";
  
  assert_true (Float.abs (put_price -. analytic_put) < 0.05)
    "PDE price close to analytic solution"

(** Test high volatility scenarios *)
let test_high_volatility () =
  print_header "High Volatility Scenarios";
  
  print_test "High volatility (σ=0.8)";
  let params = Bs_params.make ~r:0.05 ~sigma:0.8 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:10.0 ~s_max:300.0 ~n_s:150 ~n_t:100 () in
  let s0 = 100.0 in
  
  let (call_price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic = Payoff.analytic_black_scholes `Call ~r:0.05 ~sigma:0.8 
                   ~t:1.0 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic;
  Printf.printf "      Error:     %.6f\n" error;
  
  assert_true (call_price > 20.0)
    "High vol options should have substantial time value";
  
  assert_true (error < 0.5)
    "Error acceptable even for high volatility"

(** Test low volatility scenarios *)
let test_low_volatility () =
  print_header "Low Volatility Scenarios";
  
  print_test "Low volatility (σ=0.05)";
  let params = Bs_params.make ~r:0.05 ~sigma:0.05 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:80.0 ~s_max:120.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  
  let (call_price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic = Payoff.analytic_black_scholes `Call ~r:0.05 ~sigma:0.05 
                   ~t:1.0 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic;
  Printf.printf "      Error:     %.6f\n" error;
  
  assert_true (call_price > 2.0 && call_price < 8.0)
    "Low vol options have moderate time value";
  
  assert_true (error < 0.1)
    "Low volatility should be easy to price accurately"

(** Test long-dated options *)
let test_long_dated_options () =
  print_header "Long-Dated Options";
  
  print_test "5-year option";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:5.0 in
  let grid = Grid.make ~s_min:20.0 ~s_max:300.0 ~n_s:100 ~n_t:100 () in
  let s0 = 100.0 in
  
  let (call_price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic = Payoff.analytic_black_scholes `Call ~r:0.05 ~sigma:0.2 
                   ~t:5.0 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic;
  Printf.printf "      Error:     %.6f\n" error;
  
  assert_true (call_price > 25.0)
    "Long-dated options have substantial value";
  
  assert_true (error < 0.5)
    "Reasonable error for long-dated options"

(** Test short-dated options *)
let test_short_dated_options () =
  print_header "Short-Dated Options";
  
  print_test "1-month option";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:0.0833 in
  let grid = Grid.make ~s_min:85.0 ~s_max:115.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  
  let (call_price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic = Payoff.analytic_black_scholes `Call ~r:0.05 ~sigma:0.2 
                   ~t:0.0833 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic;
  Printf.printf "      Error:     %.6f\n" error;
  
  assert_true (call_price > 0.5 && call_price < 5.0)
    "Short-dated ATM options have limited time value";
  
  assert_true (error < 0.05)
    "Short-dated options should price accurately"

(** Test zero interest rate *)
let test_zero_interest_rate () =
  print_header "Zero Interest Rate";
  
  print_test "r=0.0";
  let params = Bs_params.make ~r:0.0 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  
  let (call_price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let analytic = Payoff.analytic_black_scholes `Call ~r:0.0 ~sigma:0.2 
                   ~t:1.0 ~s0 ~k:100.0 in
  
  Printf.printf "      PDE price: %.6f\n" call_price;
  Printf.printf "      Analytic:  %.6f\n" analytic;
  Printf.printf "      Error:     %.6f\n" error;
  
  assert_true (call_price > 0.0)
    "Zero rate options still have value from volatility";
  
  assert_true (error < 0.1)
    "Zero rate pricing should be accurate"

(** Main test runner *)
let main () =
  Printf.printf "\n";
  Printf.printf "╔════════════════════════════════════════════════╗\n";
  Printf.printf "║     Edge Case & Boundary Condition Tests      ║\n";
  Printf.printf "╔════════════════════════════════════════════════╗\n";
  
  let start_time = Unix.gettimeofday () in
  
  (* Run all edge case tests *)
  test_at_expiry_options ();
  test_deep_itm_options ();
  test_deep_otm_options ();
  test_high_volatility ();
  test_low_volatility ();
  test_long_dated_options ();
  test_short_dated_options ();
  test_zero_interest_rate ();
  
  let elapsed = Unix.gettimeofday () -. start_time in
  
  Printf.printf "\n";
  Printf.printf "╔════════════════════════════════════════════════╗\n";
  Printf.printf "║          ✓ All Edge Case Tests PASSED         ║\n";
  Printf.printf "║          Elapsed time: %.2f seconds           ║\n" elapsed;
  Printf.printf "╚════════════════════════════════════════════════╝\n\n";
  
  exit 0

let () = main ()
