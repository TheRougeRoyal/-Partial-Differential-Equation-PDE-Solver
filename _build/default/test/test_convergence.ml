open Pde_opt

let print_section title =
  Printf.printf "\n=== %s ===\n" title

let print_result passed name =
  Printf.printf "  %s %s\n" (if passed then "✓" else "✗") name

let test_spatial_convergence () =
  print_section "Spatial Convergence Test";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let s0 = 100.0 in
  let exact_price = Payoff.analytic_black_scholes `Call 
                      ~r:0.05 ~sigma:0.2 ~t:1.0 ~s0 ~k:100.0 in
  Printf.printf "  Exact Black-Scholes price: %.6f\n" exact_price;
  Printf.printf "  Testing with different spatial resolutions:\n\n";
  let grid_sizes = [50; 100; 150; 200] in
  let errors = ref [] in
  List.iter (fun n_s ->
    let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s ~n_t:100 () in
    let (price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
    errors := error :: !errors;
    Printf.printf "    n_s=%3d: price=%.6f, error=%.6f\n" n_s price error;
  ) grid_sizes;
  let errors_list = List.rev !errors in
  let first_error = List.hd errors_list in
  let last_error = List.nth errors_list (List.length errors_list - 1) in
  let converging = last_error < first_error *. 0.8 in
  print_result converging "Errors decrease with grid refinement";
  if not converging then (
    Printf.printf "\nFAIL: Spatial convergence not observed\n";
    exit 1
  )

let test_temporal_convergence () =
  print_section "Temporal Convergence Test";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let s0 = 100.0 in
  let exact_price = Payoff.analytic_black_scholes `Call 
                      ~r:0.05 ~sigma:0.2 ~t:1.0 ~s0 ~k:100.0 in
  Printf.printf "  Exact Black-Scholes price: %.6f\n" exact_price;
  Printf.printf "  Testing with different temporal resolutions:\n";
  Printf.printf "  (Using fine spatial grid to observe temporal convergence)\n\n";
  let time_steps = [25; 50; 100; 200] in
  let errors = ref [] in
  List.iter (fun n_t ->
    let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s:200 ~n_t () in
    let (price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
    errors := error :: !errors;
    Printf.printf "    n_t=%3d: price=%.6f, error=%.6f\n" n_t price error;
  ) time_steps;
  let errors_list = List.rev !errors in
  let max_error = List.fold_left Float.max 0.0 errors_list in
  let converging = max_error < 0.01 in
  print_result converging "Temporal discretization produces accurate results";
  if not converging then (
    Printf.printf "\nFAIL: Temporal discretization inaccurate\n";
    Printf.printf "      Max error: %.6f exceeds threshold 0.01\n" max_error;
    exit 1
  )

let test_scheme_accuracy () =
  print_section "Time-Stepping Scheme Accuracy Comparison";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  let exact_price = Payoff.analytic_black_scholes `Call 
                      ~r:0.05 ~sigma:0.2 ~t:1.0 ~s0 ~k:100.0 in
  Printf.printf "  Exact Black-Scholes price: %.6f\n\n" exact_price;
  let (price_be, error_be) = Api.price_euro ~params ~grid ~s0 ~scheme:`BE ~payoff:`Call in
  Printf.printf "  Backward Euler:  price=%.6f, error=%.6f\n" price_be error_be;
  let (price_cn, error_cn) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  Printf.printf "  Crank-Nicolson:  price=%.6f, error=%.6f\n" price_cn error_cn;
  let cn_better = error_cn <= error_be in
  print_result cn_better "Crank-Nicolson more accurate than Backward Euler";
  if not cn_better then (
    Printf.printf "\nFAIL: CN should be more accurate than BE\n";
    exit 1
  )

let test_put_call_parity () =
  print_section "Put-Call Parity Test";
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  let (call_price, _) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Call in
  let (put_price, _) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff:`Put in
  let parity_left = call_price -. put_price in
  let parity_right = s0 -. 100.0 *. Float.exp (-.0.05 *. 1.0) in
  let parity_error = Float.abs (parity_left -. parity_right) in
  Printf.printf "  Call price:    %.6f\n" call_price;
  Printf.printf "  Put price:     %.6f\n" put_price;
  Printf.printf "  C - P:         %.6f\n" parity_left;
  Printf.printf "  S - K*e^(-rT): %.6f\n" parity_right;
  Printf.printf "  Parity error:  %.6f\n" parity_error;
  let passes = parity_error < 0.01 in
  print_result passes "Put-call parity satisfied";
  if not passes then (
    Printf.printf "\nFAIL: Put-call parity violated by %.6f\n" parity_error;
    exit 1
  )

let main () =
  Printf.printf "\n╔════════════════════════════════════════╗\n";
  Printf.printf "║  Convergence & Accuracy Test Suite    ║\n";
  Printf.printf "╚════════════════════════════════════════╝\n";
  let start_time = Unix.gettimeofday () in
  test_spatial_convergence ();
  test_temporal_convergence ();
  test_scheme_accuracy ();
  test_put_call_parity ();
  let elapsed = Unix.gettimeofday () -. start_time in
  Printf.printf "\n╔════════════════════════════════════════╗\n";
  Printf.printf "║  ✓ All Convergence Tests PASSED       ║\n";
  Printf.printf "║  Elapsed time: %-22.2fs ║\n" elapsed;
  Printf.printf "╚════════════════════════════════════════╝\n\n";
  exit 0

let () = main ()
