type option_type = Call | Put

type pricing_input = {
  spot: float;
  strike: float;
  maturity: float;
  rate: float;
  volatility: float;
  option_type: option_type;
}

type pricing_output = {
  price: float;
  analytic_price: float;
  error: float;
  delta: float;
  gamma: float;
  theta: float;
  vega: float;
}

val price_option : ?n_s:int -> ?n_t:int -> ?scheme:[`BE | `CN] -> pricing_input -> pricing_output

val price_from_csv : ?n_s:int -> ?n_t:int -> ?scheme:[`BE | `CN] -> ?vol_method:Calibration.vol_method -> 
                     string -> float -> float -> option_type -> pricing_output

val batch_price : pricing_input list -> ?n_s:int -> ?n_t:int -> ?scheme:[`BE | `CN] -> unit -> pricing_output list

val surface_volatility : float list -> float list -> float -> float -> string -> (float * float * float) list

val print_output : pricing_output -> unit
