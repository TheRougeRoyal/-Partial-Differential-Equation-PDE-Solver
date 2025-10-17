(** Integration tests for PDE infrastructure *)

open Pde_opt

let test_time_stepper_schemes () =
  Printf.printf "Testing Time_stepper scheme mappings...\n";
  
  (* Test Backward Euler *)
  let be_theta = Time_stepper.theta `BE in
  if be_theta <> 1.0 then (
    Printf.printf "FAIL: Backward Euler theta should be 1.0, got %.1f\n" be_theta;
    exit 1
  );
  
  (* Test Crank-Nicolson *)
  let cn_theta = Time_stepper.theta `CN in
  if cn_theta <> 0.5 then (
    Printf.printf "FAIL: Crank-Nicolson theta should be 0.5, got %.1f\n" cn_theta;
    exit 1
  );
  
  Printf.printf "Time-stepper scheme tests passed\n"

let test_interpolation_accuracy () =
  Printf.printf "Testing interpolation accuracy with known functions...\n";
  
  (* Create a simple grid *)
  let grid = Grid.make ~s_max:10.0 ~n_s:10 ~n_t:5 () in
  
  (* Test linear function: f(s) = 2*s + 1 *)
  let linear_values = Array.make 11 0.0 in
  for i = 0 to 10 do
    let s_i = Grid.s_at grid i in
    linear_values.(i) <- 2.0 *. s_i +. 1.0;
  done;
  
  (* Test interpolation at various points *)
  let test_points = [| 0.5; 2.3; 5.7; 8.1 |] in
  for i = 0 to Array.length test_points - 1 do
    let s = test_points.(i) in
    let interpolated = Pde1d.interpolate_at ~grid ~values:linear_values ~s in
    let expected = 2.0 *. s +. 1.0 in
    let error = Float.abs (interpolated -. expected) in
    
    if error > 1e-12 then (
      Printf.printf "FAIL: Linear interpolation error %.12f > 1e-12 at s=%.1f\n" error s;
      Printf.printf "      Expected: %.6f, Got: %.6f\n" expected interpolated;
      exit 1
    );
  done;
  
  (* Test quadratic function: f(s) = s^2 (should have some interpolation error) *)
  let quad_values = Array.make 11 0.0 in
  for i = 0 to 10 do
    let s_i = Grid.s_at grid i in
    quad_values.(i) <- s_i *. s_i;
  done;
  
  (* Test interpolation at midpoint - should have some error for quadratic *)
  let s_mid = 5.0 in
  let interpolated_quad = Pde1d.interpolate_at ~grid ~values:quad_values ~s:s_mid in
  let expected_quad = s_mid *. s_mid in
  let quad_error = Float.abs (interpolated_quad -. expected_quad) in
  
  (* For quadratic function, linear interpolation should be exact at grid points *)
  if quad_error > 1e-12 then (
    Printf.printf "FAIL: Quadratic interpolation at grid point error %.12f > 1e-12\n" quad_error;
    exit 1
  );
  
  (* Test boundary extrapolation *)
  let left_extrap = Pde1d.interpolate_at ~grid ~values:linear_values ~s:(-1.0) in
  let expected_left = linear_values.(0) in
  if left_extrap <> expected_left then (
    Printf.printf "FAIL: Left extrapolation should clamp to boundary value\n";
    Printf.printf "      Expected: %.6f, Got: %.6f\n" expected_left left_extrap;
    exit 1
  );
  
  let right_extrap = Pde1d.interpolate_at ~grid ~values:linear_values ~s:15.0 in
  let expected_right = linear_values.(10) in
  if right_extrap <> expected_right then (
    Printf.printf "FAIL: Right extrapolation should clamp to boundary value\n";
    Printf.printf "      Expected: %.6f, Got: %.6f\n" expected_right right_extrap;
    exit 1
  );
  
  Printf.printf "Interpolation accuracy tests passed\n"

let test_pde_solver_stub () =
  Printf.printf "Testing PDE solver stub behavior...\n";
  
  (* Create test parameters and grid *)
  let params = Bs_params.make ~r:0.05 ~sigma:0.2 ~k:100.0 ~t:1.0 in
  let grid = Grid.make ~s_min:50.0 ~s_max:200.0 ~n_s:20 ~n_t:10 () in
  
  (* Test call option stub *)
  let call_solution = Pde1d.solve_european ~params ~grid ~payoff:`Call ~scheme:`CN in
  
  (* Verify solution array has correct length *)
  if Array.length call_solution <> 21 then (
    Printf.printf "FAIL: Solution array should have length 21, got %d\n" (Array.length call_solution);
    exit 1
  );
  
  (* Verify solution is reasonable (not just checking terminal payoff anymore) *)
  (* At boundaries, solution should match boundary conditions *)
  let tau_final = params.Bs_params.t in
  let left_bc = Bcs.left_value `Call ~r:params.Bs_params.r ~k:params.Bs_params.k ~tau:tau_final in
  let right_bc = Bcs.right_value `Call ~r:params.Bs_params.r ~k:params.Bs_params.k 
                   ~s_max:grid.Grid.s_max ~tau:tau_final in
  
  let error_left = Float.abs (call_solution.(0) -. left_bc) in
  let error_right = Float.abs (call_solution.(20) -. right_bc) in
  
  if error_left > 1e-10 then (
    Printf.printf "FAIL: Solution at left boundary incorrect\n";
    Printf.printf "      Expected: %.6f, Got: %.6f, Error: %.12f\n" left_bc call_solution.(0) error_left;
    exit 1
  );
  
  if error_right > 1e-10 then (
    Printf.printf "FAIL: Solution at right boundary incorrect\n";
    Printf.printf "      Expected: %.6f, Got: %.6f, Error: %.12f\n" right_bc call_solution.(20) error_right;
    exit 1
  );
  
  (* Test put option stub *)
  let put_solution = Pde1d.solve_european ~params ~grid ~payoff:`Put ~scheme:`BE in
  
  (* Verify put solution at boundaries *)
  let put_left_bc = Bcs.left_value `Put ~r:params.Bs_params.r ~k:params.Bs_params.k ~tau:tau_final in
  let put_right_bc = Bcs.right_value `Put ~r:params.Bs_params.r ~k:params.Bs_params.k 
                       ~s_max:grid.Grid.s_max ~tau:tau_final in
  
  let put_left = put_solution.(0) in
  if Float.abs (put_left -. put_left_bc) > 1e-10 then (
    Printf.printf "FAIL: Put solution at left boundary incorrect\n";
    exit 1
  );
  
  let put_right = put_solution.(20) in
  if Float.abs (put_right -. put_right_bc) > 1e-10 then (
    Printf.printf "FAIL: Put solution at right boundary incorrect\n";
    exit 1
  );
  
  Printf.printf "PDE solver stub tests passed\n"

let test_grid_integration () =
  Printf.printf "Testing Grid module integration...\n";
  
  (* Test grid with various parameters *)
  let grid1 = Grid.make ~s_max:100.0 ~n_s:10 ~n_t:20 () in
  let grid2 = Grid.make ~s_min:10.0 ~s_max:200.0 ~n_s:50 ~n_t:100 () in
  
  (* Test ds calculation *)
  let ds1 = Grid.ds grid1 in
  let expected_ds1 = 100.0 /. 10.0 in
  if Float.abs (ds1 -. expected_ds1) > 1e-12 then (
    Printf.printf "FAIL: Grid ds calculation incorrect\n";
    exit 1
  );
  
  let ds2 = Grid.ds grid2 in
  let expected_ds2 = (200.0 -. 10.0) /. 50.0 in
  if Float.abs (ds2 -. expected_ds2) > 1e-12 then (
    Printf.printf "FAIL: Grid ds calculation with s_min incorrect\n";
    exit 1
  );
  
  (* Test dt calculation *)
  let dt1 = Grid.dt grid1 2.0 in
  let expected_dt1 = 2.0 /. 20.0 in
  if Float.abs (dt1 -. expected_dt1) > 1e-12 then (
    Printf.printf "FAIL: Grid dt calculation incorrect\n";
    exit 1
  );
  
  (* Test s_at calculation *)
  let s_5 = Grid.s_at grid1 5 in
  let expected_s_5 = 5.0 *. ds1 in
  if Float.abs (s_5 -. expected_s_5) > 1e-12 then (
    Printf.printf "FAIL: Grid s_at calculation incorrect\n";
    exit 1
  );
  
  (* Test find_bracketing_index *)
  let index = Grid.find_bracketing_index grid1 35.7 in
  let s_index = Grid.s_at grid1 index in
  let s_index_plus_1 = Grid.s_at grid1 (index + 1) in
  
  if not (s_index <= 35.7 && 35.7 < s_index_plus_1) then (
    Printf.printf "FAIL: Bracketing index incorrect\n";
    Printf.printf "      s[%d] = %.1f, s[%d] = %.1f, target = 35.7\n" index s_index (index+1) s_index_plus_1;
    exit 1
  );
  
  Printf.printf "Grid integration tests passed\n"

let main () =
  Printf.printf "Running PDE infrastructure integration tests...\n\n";
  
  test_time_stepper_schemes ();
  test_grid_integration ();
  test_interpolation_accuracy ();
  test_pde_solver_stub ();
  
  Printf.printf "\nAll PDE infrastructure integration tests passed!\n";
  exit 0

let () = main ()