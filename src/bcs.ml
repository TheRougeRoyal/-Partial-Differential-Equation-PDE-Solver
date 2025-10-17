(** Boundary conditions for European option PDE solving *)

let left_value option_type ~r ~k ~tau =
  (* Parameter validation *)
  if r < 0.0 then
    invalid_arg (Printf.sprintf "Risk-free rate must be non-negative, got %g" r);
  if k <= 0.0 then
    invalid_arg (Printf.sprintf "Strike price must be positive, got %g" k);
  if tau < 0.0 then
    invalid_arg (Printf.sprintf "Time to expiry must be non-negative, got %g" tau);
  if not (Float.is_finite r && Float.is_finite k && Float.is_finite tau) then
    invalid_arg "All parameters must be finite";
  
  match option_type with
  | `Call -> 
      (* Call option at S=0 is worthless *)
      0.0
  | `Put -> 
      (* Put option at S=0 has value equal to discounted strike *)
      k *. Float.exp (-.r *. tau)

let right_value option_type ~r ~k ~s_max ~tau =
  (* Parameter validation *)
  if r < 0.0 then
    invalid_arg (Printf.sprintf "Risk-free rate must be non-negative, got %g" r);
  if k <= 0.0 then
    invalid_arg (Printf.sprintf "Strike price must be positive, got %g" k);
  if s_max <= 0.0 then
    invalid_arg (Printf.sprintf "Maximum asset price must be positive, got %g" s_max);
  if tau < 0.0 then
    invalid_arg (Printf.sprintf "Time to expiry must be non-negative, got %g" tau);
  if not (Float.is_finite r && Float.is_finite k && Float.is_finite s_max && Float.is_finite tau) then
    invalid_arg "All parameters must be finite";
  
  match option_type with
  | `Call ->
      (* Call option at high S approaches S - K*exp(-r*τ) *)
      s_max -. k *. Float.exp (-.r *. tau)
  | `Put ->
      (* Put option at high S is worthless *)
      0.0