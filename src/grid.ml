(** Uniform spatial-temporal grid for PDE discretization *)

type t = {
  s_min: float;  (* Minimum asset price *)
  s_max: float;  (* Maximum asset price *)
  n_s: int;      (* Number of spatial intervals *)
  n_t: int;      (* Number of time intervals *)
}

let make ?(s_min = 0.0) ~s_max ~n_s ~n_t () =
  (* Validate spatial domain *)
  if not (Float.is_finite s_min && Float.is_finite s_max) then
    invalid_arg "Grid bounds must be finite";
  
  if s_max <= s_min then
    invalid_arg (Printf.sprintf "s_max (%g) must be greater than s_min (%g)" s_max s_min);
  
  (* Validate spatial discretization *)
  if n_s < 2 then
    invalid_arg (Printf.sprintf "Number of spatial intervals must be >= 2, got %d" n_s);
  
  (* Validate temporal discretization *)
  if n_t < 1 then
    invalid_arg (Printf.sprintf "Number of time intervals must be >= 1, got %d" n_t);
  
  { s_min; s_max; n_s; n_t }

let ds grid =
  (grid.s_max -. grid.s_min) /. (Float.of_int grid.n_s)

let dt grid maturity =
  if not (Float.is_finite maturity) then
    invalid_arg "Maturity must be finite";
  if maturity < 0.0 then
    invalid_arg (Printf.sprintf "Maturity must be non-negative, got %g" maturity);
  maturity /. (Float.of_int grid.n_t)

let s_at grid i =
  if i < 0 || i > grid.n_s then
    invalid_arg (Printf.sprintf "Spatial index %d out of bounds [0, %d]" i grid.n_s);
  grid.s_min +. (Float.of_int i) *. (ds grid)

let find_bracketing_index grid s =
  if not (Float.is_finite s) then
    invalid_arg "Asset price must be finite";
  
  (* Compute fractional index *)
  let frac_index = (s -. grid.s_min) /. (ds grid) in
  
  (* Use floor and clamp to valid range *)
  let index = Int.max 0 (Int.min (grid.n_s - 1) (int_of_float (floor frac_index))) in
  index