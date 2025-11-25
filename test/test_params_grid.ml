open Pde_opt

let test_bs_params_validation () =
  Printf.printf "Testing BS_params validation edge cases...\n";
  
  let _valid_params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  Printf.printf "Valid parameters created successfully\n";
  
  let _zero_r = Bs_params.make ~r:0.0 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  Printf.printf "Zero risk-free rate accepted\n";
  
  (try
    let _ = Bs_params.make ~r:(-0.01) ~sigma:0.2 ~k:100.0 ~t:1.0 in
    Printf.printf "FAIL: Should reject negative risk-free rate\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Bs_params.make ~r:0.05 ~sigma:0.0 ~k:100.0 ~t:1.0 in
    Printf.printf "FAIL: Should reject zero volatility\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Bs_params.make ~r:0.05 ~sigma:(-0.1) ~k:100.0 ~t:1.0 in
    Printf.printf "FAIL: Should reject negative volatility\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:0.0 ~t:1.0 in
    Printf.printf "FAIL: Should reject zero strike price\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:(-100.0) ~t:1.0 in
    Printf.printf "FAIL: Should reject negative strike price\n";
    exit 1
  with Invalid_argument _ -> ());
  
  let _zero_t = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:0.0 in
  Printf.printf "Zero time to maturity accepted\n";
  
  (try
    let _ = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:(-1.0) in
    Printf.printf "FAIL: Should reject negative time to maturity\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Bs_params.make ~r:(1.0 /. 0.0) ~sigma:0.2 ~k:100.0 ~t:1.0 in
    Printf.printf "FAIL: Should reject infinite risk-free rate\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Bs_params.make ~r:0.05 ~sigma:(Float.nan) ~k:100.0 ~t:1.0 in
    Printf.printf "FAIL: Should reject NaN volatility\n";
    exit 1
  with Invalid_argument _ -> ());
  
  Printf.printf "BS_params validation tests passed\n"

let test_grid_generation_and_indexing () =
  Printf.printf "Testing Grid generation and indexing functions...\n";
  
  let grid1 = Grid.make ~s_max:100.0 ~n_s:10 ~n_t:20 () in
  Printf.printf "Basic grid created successfully\n";
  
  let grid2 = Grid.make ~s_min:10.0 ~s_max:200.0 ~n_s:50 ~n_t:100 () in
  Printf.printf "Grid with custom s_min created successfully\n";
  
  let ds1 = Grid.ds grid1 in
  let expected_ds1 = 100.0 /. 10.0 in
  if Float.abs (ds1 -. expected_ds1) > 1e-12 then (
    Printf.printf "FAIL: ds calculation incorrect for grid1\n";
    exit 1
  );
  
  let ds2 = Grid.ds grid2 in
  let expected_ds2 = (200.0 -. 10.0) /. 50.0 in
  if Float.abs (ds2 -. expected_ds2) > 1e-12 then (
    Printf.printf "FAIL: ds calculation incorrect for grid2\n";
    exit 1
  );
  
  let dt1 = Grid.dt grid1 2.0 in
  let expected_dt1 = 2.0 /. 20.0 in
  if Float.abs (dt1 -. expected_dt1) > 1e-12 then (
    Printf.printf "FAIL: dt calculation incorrect\n";
    exit 1
  );
  
  for i = 0 to 10 do
    let s_i = Grid.s_at grid1 i in
    let expected_s_i = Float.of_int i *. ds1 in
    if Float.abs (s_i -. expected_s_i) > 1e-12 then (
      Printf.printf "FAIL: s_at calculation incorrect at index %d\n" i;
      exit 1
    );
  done;
  
  for i = 0 to 50 do
    let s_i = Grid.s_at grid2 i in
    let expected_s_i = 10.0 +. Float.of_int i *. ds2 in
    if Float.abs (s_i -. expected_s_i) > 1e-12 then (
      Printf.printf "FAIL: s_at calculation incorrect for grid2 at index %d\n" i;
      exit 1
    );
  done;
  
  let test_values = [| 15.0; 35.7; 67.3; 89.1 |] in
  Array.iter (fun s ->
    let index = Grid.find_bracketing_index grid1 s in
    let s_left = Grid.s_at grid1 index in
    let s_right = Grid.s_at grid1 (Int.min (index + 1) 10) in
    
    if not (s_left <= s && (index = 10 || s < s_right)) then (
      Printf.printf "FAIL: find_bracketing_index incorrect for s=%.1f\n" s;
      Printf.printf "      index=%d, s_left=%.1f, s_right=%.1f\n" index s_left s_right;
      exit 1
    );
  ) test_values;
  
  let left_index = Grid.find_bracketing_index grid1 (-10.0) in
  if left_index <> 0 then (
    Printf.printf "FAIL: find_bracketing_index should return 0 for values below s_min\n";
    exit 1
  );
  
  let right_index = Grid.find_bracketing_index grid1 150.0 in
  if right_index <> 9 then (
    Printf.printf "FAIL: find_bracketing_index should return n_s-1 for values above s_max\n";
    exit 1
  );
  
  Printf.printf "Grid generation and indexing tests passed\n"

let test_grid_parameter_validation () =
  Printf.printf "Testing Grid parameter validation...\n";
  
  (try
    let _ = Grid.make ~s_max:100.0 ~n_s:1 ~n_t:10 () in
    Printf.printf "FAIL: Should reject n_s < 2\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_max:100.0 ~n_s:0 ~n_t:10 () in
    Printf.printf "FAIL: Should reject n_s = 0\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_max:100.0 ~n_s:10 ~n_t:0 () in
    Printf.printf "FAIL: Should reject n_t < 1\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_max:100.0 ~n_s:10 ~n_t:(-5) () in
    Printf.printf "FAIL: Should reject negative n_t\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_min:100.0 ~s_max:50.0 ~n_s:10 ~n_t:10 () in
    Printf.printf "FAIL: Should reject s_max <= s_min\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_min:100.0 ~s_max:100.0 ~n_s:10 ~n_t:10 () in
    Printf.printf "FAIL: Should reject s_max = s_min\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_max:(1.0 /. 0.0) ~n_s:10 ~n_t:10 () in
    Printf.printf "FAIL: Should reject infinite s_max\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.make ~s_min:(Float.nan) ~s_max:100.0 ~n_s:10 ~n_t:10 () in
    Printf.printf "FAIL: Should reject NaN s_min\n";
    exit 1
  with Invalid_argument _ -> ());
  
  let grid = Grid.make ~s_max:100.0 ~n_s:10 ~n_t:10 () in
  
  (try
    let _ = Grid.dt grid (-1.0) in
    Printf.printf "FAIL: Should reject negative maturity in dt\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.dt grid (Float.nan) in
    Printf.printf "FAIL: Should reject NaN maturity in dt\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.s_at grid (-1) in
    Printf.printf "FAIL: Should reject negative index in s_at\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.s_at grid 11 in
    Printf.printf "FAIL: Should reject index > n_s in s_at\n";
    exit 1
  with Invalid_argument _ -> ());
  
  (try
    let _ = Grid.find_bracketing_index grid (Float.nan) in
    Printf.printf "FAIL: Should reject NaN in find_bracketing_index\n";
    exit 1
  with Invalid_argument _ -> ());
  
  Printf.printf "Grid parameter validation tests passed\n"

let main () =
  Printf.printf "Running parameter and grid module unit tests...\n\n";
  
  test_bs_params_validation ();
  test_grid_generation_and_indexing ();
  test_grid_parameter_validation ();
  
  Printf.printf "\nAll parameter and grid module tests passed!\n";
  exit 0

let () = main ()