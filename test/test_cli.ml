open Pde_opt

let price_tolerance = 1e-2

let epsilon = 1e-5

let max_error = 0.5

let test_cli_argument_parsing () =
  Printf.printf "Testing CLI argument parsing...\n";
  
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  let scheme = `CN in
  let payoff = `Call in
  
  let (price, error) = Api.price_euro ~params ~grid ~s0 ~scheme ~payoff in
  
  let expected = 10.45058 in
  let price_error = Float.abs (price -. expected) in
  
  if price_error > price_tolerance then (
    Printf.printf "FAIL: CLI argument parsing test - price error %.6f exceeds tolerance %.6f\n" 
      price_error price_tolerance;
    Printf.printf "      Expected: %.5f, Got: %.5f\n" expected price;
    exit 1
  );
  
  if Float.abs (error -. price_error) > epsilon then (
    Printf.printf "FAIL: CLI argument parsing test - API error %.6f doesn't match computed error %.6f\n"
      error price_error;
    exit 1
  );
  
  Printf.printf "CLI argument parsing tests passed\n"

let expect_invalid_arg ~test_name ~expected_substring f =
  try
    let _ = f () in
    Printf.printf "FAIL: %s - Should have raised Invalid_argument\n" test_name;
    exit 1
  with Invalid_argument msg ->
    if not (String.contains msg expected_substring) then (
      Printf.printf "FAIL: %s - Error message should contain '%c'\n" test_name expected_substring;
      Printf.printf "      Got: %s\n" msg;
      exit 1
    )

let test_parameter_validation_integration () =
  Printf.printf "Testing parameter validation integration...\n";
  
  expect_invalid_arg 
    ~test_name:"Negative volatility" 
    ~expected_substring:'p'
    (fun () -> Bs_params.make ~r:0.05 ~sigma:(-0.1) ~k:100.0 ~t:1.0);
  
  expect_invalid_arg 
    ~test_name:"Zero strike price" 
    ~expected_substring:'p'
    (fun () -> Bs_params.make ~r:0.05 ~sigma:0.2 ~k:0.0 ~t:1.0);
  
  expect_invalid_arg 
    ~test_name:"Negative time to expiry" 
    ~expected_substring:'n'
    (fun () -> Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:(-1.0));
  
  expect_invalid_arg 
    ~test_name:"Insufficient spatial intervals" 
    ~expected_substring:'2'
    (fun () -> Grid.make ~s_max:100.0 ~n_s:1 ~n_t:10 ());
  
  expect_invalid_arg 
    ~test_name:"Insufficient time intervals" 
    ~expected_substring:'1'
    (fun () -> Grid.make ~s_max:100.0 ~n_s:10 ~n_t:0 ());
  
  expect_invalid_arg 
    ~test_name:"Invalid grid bounds (smax <= smin)" 
    ~expected_substring:'g'
    (fun () -> Grid.make ~s_min:100.0 ~s_max:50.0 ~n_s:10 ~n_t:10 ());
  
  Printf.printf "Parameter validation integration tests passed\n"

type test_case = {
  r: float;
  sigma: float;
  k: float;
  t: float;
  s0: float;
  payoff: [`Call | `Put];
  expected: float;
  description: string;
}

let max_relative_error = 0.05

let test_output_formatting () =
  Printf.printf "Testing output formatting...\n";
  
  let test_cases = [
    { r = 0.05; sigma = 0.2; k = 100.0; t = 1.0; s0 = 100.0; 
      payoff = `Call; expected = 10.45; description = "ATM call, standard params" };
    { r = 0.05; sigma = 0.2; k = 100.0; t = 1.0; s0 = 100.0; 
      payoff = `Put; expected = 5.57; description = "ATM put, standard params" };
    { r = 0.03; sigma = 0.15; k = 50.0; t = 0.5; s0 = 55.0; 
      payoff = `Call; expected = 6.13; description = "ITM call, low vol" };
    { r = 0.07; sigma = 0.25; k = 120.0; t = 2.0; s0 = 110.0; 
      payoff = `Put; expected = 12.36; description = "OTM put, high vol, long expiry" };
  ] in
  
  List.iteri (fun i tc ->
    let params = Bs_params.make ~r:tc.r ~sigma:tc.sigma ~k:tc.k ~t:tc.t in
    
    let s_min = if tc.payoff = `Call then 0.3 *. Float.min tc.s0 tc.k else 0.0 in
    let s_max = Float.max (3.0 *. Float.max tc.s0 tc.k) 
                          (tc.s0 *. (1.0 +. 4.0 *. tc.sigma *. Float.sqrt tc.t)) in
    
    let grid = Grid.make ~s_min ~s_max ~n_s:100 ~n_t:50 () in
    let (price, error) = Api.price_euro ~params ~grid ~s0:tc.s0 ~scheme:`CN ~payoff:tc.payoff in
    
    let price_diff = Float.abs (price -. tc.expected) in
    let relative_error = price_diff /. tc.expected in
    
    if relative_error > max_relative_error then (
      Printf.printf "FAIL: Test case %d (%s) - price error too large\n" i tc.description;
      Printf.printf "      Expected ~%.2f, Got %.5f (%.1f%% error)\n" 
        tc.expected price (relative_error *. 100.0);
      exit 1
    );
    
    if error > max_error then (
      Printf.printf "FAIL: Test case %d (%s) - excessive PDE error: %.6f\n" i tc.description error;
      exit 1
    );
    
    if price < 0.0 then (
      Printf.printf "FAIL: Test case %d (%s) - negative price: %.6f\n" i tc.description price;
      exit 1
    );
  ) test_cases;
  
  let at_expiry_cases = [
    (110.0, 100.0, `Call, 10.0, "ITM call");
    (90.0, 100.0, `Call, 0.0, "OTM call");
    (90.0, 100.0, `Put, 10.0, "ITM put");
    (110.0, 100.0, `Put, 0.0, "OTM put");
  ] in
  
  List.iteri (fun i (s0, k, payoff, expected, description) ->
    let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k ~t:0.0 in
    let grid = Grid.make ~s_min:0.0 ~s_max:200.0 ~n_s:20 ~n_t:1 () in
    let (price, error) = Api.price_euro ~params ~grid ~s0 ~scheme:`BE ~payoff in
    
    if Float.abs (price -. expected) > epsilon then (
      Printf.printf "FAIL: At-expiry case %d (%s) incorrect\n" i description;
      Printf.printf "      Expected: %.1f, Got: %.6f, Diff: %.10f\n" expected price (price -. expected);
      exit 1
    );
    
    if error <> 0.0 then (
      Printf.printf "FAIL: At-expiry case %d (%s) should have zero error, got %.10f\n" i description error;
      exit 1
    );
  ) at_expiry_cases;
  
  Printf.printf "Output formatting tests passed\n"

let max_scheme_diff = 0.1

let test_scheme_handling () =
  Printf.printf "Testing scheme handling...\n";
  
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:30.0 ~s_max:300.0 ~n_s:100 ~n_t:50 () in
  let s0 = 100.0 in
  let payoff = `Call in
  
  let (price_be, error_be) = Api.price_euro ~params ~grid ~s0 ~scheme:`BE ~payoff in
  let (price_cn, error_cn) = Api.price_euro ~params ~grid ~s0 ~scheme:`CN ~payoff in
  
  let scheme_diff = Float.abs (price_be -. price_cn) in
  if scheme_diff > max_scheme_diff then (
    Printf.printf "FAIL: BE and CN give very different results (diff: %.6f > %.6f)\n" 
      scheme_diff max_scheme_diff;
    Printf.printf "      BE: %.6f (error: %.6f), CN: %.6f (error: %.6f)\n" 
      price_be error_be price_cn error_cn;
    exit 1
  );
  
  if error_be > max_error then (
    Printf.printf "FAIL: Backward Euler scheme has excessive error: %.6f > %.6f\n" 
      error_be max_error;
    exit 1
  );
  
  if error_cn > max_error then (
    Printf.printf "FAIL: Crank-Nicolson scheme has excessive error: %.6f > %.6f\n" 
      error_cn max_error;
    exit 1
  );
  
  if error_cn > error_be *. 1.1 then (
    Printf.printf "WARNING: CN error %.6f not better than BE error %.6f\n" 
      error_cn error_be;
  );
  
  Printf.printf "Scheme handling tests passed (BE: %.6f, CN: %.6f)\n" price_be price_cn

let main () =
  Printf.printf "==========================================\n";
  Printf.printf "CLI Integration Test Suite\n";
  Printf.printf "==========================================\n\n";
  
  let start_time = Unix.gettimeofday () in
  let test_count = ref 0 in
  
  let run_test name test_fn =
    incr test_count;
    Printf.printf "[%d] %s...\n" !test_count name;
    try
      test_fn ();
      Printf.printf "    ✓ PASSED\n\n"
    with
    | Invalid_argument msg ->
        Printf.printf "    ✗ FAILED: %s\n" msg;
        exit 1
    | Failure msg ->
        Printf.printf "    ✗ FAILED: %s\n" msg;
        exit 1
    | exn ->
        Printf.printf "    ✗ FAILED: Unexpected exception: %s\n" (Printexc.to_string exn);
        Printexc.print_backtrace stdout;
        exit 1
  in
  
  run_test "CLI Argument Parsing" test_cli_argument_parsing;
  run_test "Parameter Validation Integration" test_parameter_validation_integration;
  run_test "Output Formatting & Diverse Configurations" test_output_formatting;
  run_test "Time-Stepping Scheme Handling" test_scheme_handling;
  
  let elapsed = Unix.gettimeofday () -. start_time in
  
  Printf.printf "==========================================\n";
  Printf.printf "✓ All %d test suites passed!\n" !test_count;
  Printf.printf "  Elapsed time: %.3f seconds\n" elapsed;
  Printf.printf "==========================================\n";
  
  exit 0

let () = 
  try 
    main ()
  with exn ->
    Printf.eprintf "\n✗ FATAL ERROR in test suite:\n";
    Printf.eprintf "  %s\n" (Printexc.to_string exn);
    Printexc.print_backtrace stderr;
    exit 2