(** Black-Scholes parameter management with validation *)

type t = {
  r: float;     (* Risk-free interest rate (per annum) *)
  sigma: float; (* Volatility (per annum) *)
  k: float;     (* Strike price *)
  t: float;     (* Time to maturity (years) *)
}

let make ~r ~sigma ~k ~t =
  (* Validate risk-free rate *)
  if r < 0.0 then
    invalid_arg (Printf.sprintf "Risk-free rate must be non-negative, got %g" r);
  
  (* Validate volatility *)
  if sigma <= 0.0 then
    invalid_arg (Printf.sprintf "Volatility must be positive, got %g" sigma);
  
  (* Validate strike price *)
  if k <= 0.0 then
    invalid_arg (Printf.sprintf "Strike price must be positive, got %g" k);
  
  (* Validate time to maturity *)
  if t < 0.0 then
    invalid_arg (Printf.sprintf "Time to maturity must be non-negative, got %g" t);
  
  (* Additional sanity checks *)
  if not (Float.is_finite r && Float.is_finite sigma && Float.is_finite k && Float.is_finite t) then
    invalid_arg "All parameters must be finite numbers";
  
  { r; sigma; k; t }