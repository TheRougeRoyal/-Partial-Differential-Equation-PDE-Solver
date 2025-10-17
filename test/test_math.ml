(** Unit tests for mathematical modules *)

open Pde_opt

let test_payoff_black_scholes () =
  Printf.printf "Testing Payoff module Black-Scholes calculations...\n";
  
  (* Test known Black-Scholes values *)
  let r = 0.05 in
  let sigma = 0.2 in
  let t = 1.0 in
  let s0 = 100.0 in
  let k = 100.0 in
  
  (* Test call option *)
  let call_price = Payoff.analytic_black_scholes `Call ~r ~sigma ~t ~s0 ~k in
  let expected_call = 10.45058 in
  let call_error = Float.abs (call_price -. expected_call) in
  
  if call_error > 1e-4 then (
    Printf.printf "FAIL: Call price error %.6f > 1e-4\n" call_error;
    Printf.printf "      Expected: %.5f, Got: %.5f\n" expected_call call_price;
    exit 1
  );
  
  (* Test put option using put-call parity *)
  let put_price = Payoff.analytic_black_scholes `Put ~r ~sigma ~t ~s0 ~k in
  let expected_put_parity = call_price +. k *. Float.exp (-.r *. t) -. s0 in
  let put_error = Float.abs (put_price -. expected_put_parity) in
  
  if put_error > 1e-6 then (
    Printf.printf "FAIL: Put-call parity violation %.6f > 1e-6\n" put_error;
    Printf.printf "      Put: %.5f, Parity: %.5f\n" put_price expected_put_parity;
    exit 1
  );
  
  (* Test at-expiry case *)
  let call_at_expiry = Payoff.analytic_black_scholes `Call ~r ~sigma ~t:0.0 ~s0:110.0 ~k:100.0 in
  if call_at_expiry <> 10.0 then (
    Printf.printf "FAIL: Call at expiry should be 10.0, got %.1f\n" call_at_expiry;
    exit 1
  );
  
  Printf.printf "Payoff Black-Scholes tests passed\n"

let test_boundary_conditions () =
  Printf.printf "Testing Boundary Conditions module...\n";
  
  let r = 0.05 in
  let k = 100.0 in
  let tau = 1.0 in
  let s_max = 400.0 in
  
  (* Test left boundary conditions *)
  let call_left = Bcs.left_value `Call ~r ~k ~tau in
  let put_left = Bcs.left_value `Put ~r ~k ~tau in
  
  if call_left <> 0.0 then (
    Printf.printf "FAIL: Call left boundary should be 0.0, got %.6f\n" call_left;
    exit 1
  );
  
  let expected_put_left = k *. Float.exp (-.r *. tau) in
  let put_left_error = Float.abs (put_left -. expected_put_left) in
  if put_left_error > 1e-10 then (
    Printf.printf "FAIL: Put left boundary error %.10f > 1e-10\n" put_left_error;
    exit 1
  );
  
  (* Test right boundary conditions *)
  let call_right = Bcs.right_value `Call ~r ~k ~s_max ~tau in
  let put_right = Bcs.right_value `Put ~r ~k ~s_max ~tau in
  
  let expected_call_right = s_max -. k *. Float.exp (-.r *. tau) in
  let call_right_error = Float.abs (call_right -. expected_call_right) in
  if call_right_error > 1e-10 then (
    Printf.printf "FAIL: Call right boundary error %.10f > 1e-10\n" call_right_error;
    exit 1
  );
  
  if put_right <> 0.0 then (
    Printf.printf "FAIL: Put right boundary should be 0.0, got %.6f\n" put_right;
    exit 1
  );
  
  Printf.printf "Boundary conditions tests passed\n"

let test_tridiagonal_solver () =
  Printf.printf "Testing Tridiagonal solver...\n";
  
  (* Test simple 3x3 system:
     2x + y = 5
     x + 2y + z = 6  
     y + 2z = 4
     Solution: x=2, y=1, z=1.5 *)
  
  let a = [| 0.0; 1.0; 1.0 |] in  (* sub-diagonal (a[0] ignored) *)
  let b = [| 2.0; 2.0; 2.0 |] in  (* main diagonal *)
  let c = [| 1.0; 1.0; 0.0 |] in  (* super-diagonal (c[2] ignored) *)
  let d = [| 5.0; 6.0; 4.0 |] in  (* RHS *)
  
  let solution = Tridiag.solve ~a ~b ~c ~d in
  let expected = [| 1.75; 1.5; 1.25 |] in
  
  for i = 0 to 2 do
    let error = Float.abs (solution.(i) -. expected.(i)) in
    if error > 1e-10 then (
      Printf.printf "FAIL: Solution[%d] error %.10f > 1e-10\n" i error;
      Printf.printf "      Expected: %.1f, Got: %.6f\n" expected.(i) solution.(i);
      exit 1
    );
  done;
  
  (* Test single element system *)
  let single_solution = Tridiag.solve ~a:[|5.0|] ~b:[|2.0|] ~c:[|3.0|] ~d:[|10.0|] in
  if Float.abs (single_solution.(0) -. 5.0) > 1e-10 then (
    Printf.printf "FAIL: Single element solution should be 5.0, got %.6f\n" single_solution.(0);
    exit 1
  );
  
  (* Test error handling for singular system *)
  (try
    let _ = Tridiag.solve ~a:[|0.0|] ~b:[|0.0|] ~c:[|0.0|] ~d:[|1.0|] in
    Printf.printf "FAIL: Should have detected singular system\n";
    exit 1
  with Invalid_argument _ -> ());
  
  Printf.printf "Tridiagonal solver tests passed\n"

let main () =
  Printf.printf "Running mathematical module unit tests...\n\n";
  
  test_payoff_black_scholes ();
  test_boundary_conditions ();
  test_tridiagonal_solver ();
  
  Printf.printf "\nAll mathematical module tests passed!\n";
  exit 0

let () = main ()