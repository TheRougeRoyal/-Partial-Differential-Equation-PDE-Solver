let left_value option_type ~r ~k ~tau =
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
      0.0
  | `Put -> 
      k *. Float.exp (-.r *. tau)

let right_value option_type ~r ~k ~s_max ~tau =
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
      s_max -. k *. Float.exp (-.r *. tau)
  | `Put ->
      0.0