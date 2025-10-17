(** Option payoff calculations and analytic Black-Scholes pricing *)

type kind = [ `Call | `Put ]

let terminal option_type ~k s =
  if k <= 0.0 then
    invalid_arg (Printf.sprintf "Strike price must be positive, got %g" k);
  if s < 0.0 then
    invalid_arg (Printf.sprintf "Asset price must be non-negative, got %g" s);
  if not (Float.is_finite k && Float.is_finite s) then
    invalid_arg "Strike and asset price must be finite";
  
  match option_type with
  | `Call -> Float.max (s -. k) 0.0
  | `Put -> Float.max (k -. s) 0.0

(* Standard normal CDF using Abramowitz-Stegun 7.1.26 approximation *)
let rec standard_normal_cdf x =
  if not (Float.is_finite x) then
    invalid_arg "Input to normal CDF must be finite";
  
  if x < 0.0 then
    1.0 -. (standard_normal_cdf (-.x))
  else
    (* Abramowitz-Stegun approximation for x >= 0 *)
    let t = 1.0 /. (1.0 +. 0.2316419 *. x) in
    let poly = t *. (0.319381530 +. t *. (-0.356563782 +. t *. (1.781477937 +. t *. (-1.821255978 +. t *. 1.330274429)))) in
    let exp_term = Float.exp (-0.5 *. x *. x) /. Float.sqrt (2.0 *. Float.pi) in
    1.0 -. exp_term *. poly

let analytic_black_scholes option_type ~r ~sigma ~t ~s0 ~k =
  (* Parameter validation *)
  if r < 0.0 then
    invalid_arg (Printf.sprintf "Risk-free rate must be non-negative, got %g" r);
  if sigma <= 0.0 then
    invalid_arg (Printf.sprintf "Volatility must be positive, got %g" sigma);
  if t < 0.0 then
    invalid_arg (Printf.sprintf "Time to maturity must be non-negative, got %g" t);
  if s0 <= 0.0 then
    invalid_arg (Printf.sprintf "Current asset price must be positive, got %g" s0);
  if k <= 0.0 then
    invalid_arg (Printf.sprintf "Strike price must be positive, got %g" k);
  if not (Float.is_finite r && Float.is_finite sigma && Float.is_finite t && Float.is_finite s0 && Float.is_finite k) then
    invalid_arg "All parameters must be finite";
  
  (* Handle special case: t = 0 (at expiry) *)
  if t = 0.0 then
    terminal option_type ~k s0
  else
    (* Compute d1 and d2 *)
    let sqrt_t = Float.sqrt t in
    let d1 = (Float.log (s0 /. k) +. (r +. 0.5 *. sigma *. sigma) *. t) /. (sigma *. sqrt_t) in
    let d2 = d1 -. sigma *. sqrt_t in
    
    (* Compute option price using Black-Scholes formula *)
    let discount_factor = Float.exp (-.r *. t) in
    
    match option_type with
    | `Call ->
        let n_d1 = standard_normal_cdf d1 in
        let n_d2 = standard_normal_cdf d2 in
        s0 *. n_d1 -. k *. discount_factor *. n_d2
    | `Put ->
        let n_neg_d1 = standard_normal_cdf (-.d1) in
        let n_neg_d2 = standard_normal_cdf (-.d2) in
        k *. discount_factor *. n_neg_d2 -. s0 *. n_neg_d1