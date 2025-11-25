(** Black-Scholes parameter management with validation.
    
    This module provides a type-safe interface for managing Black-Scholes
    model parameters with comprehensive validation to ensure mathematical
    consistency and prevent invalid parameter combinations.
    
    All parameters are validated upon construction and stored immutably.
    Invalid parameters raise Invalid_argument with descriptive messages. *)

(** Black-Scholes model parameters *)
type t = {
  r: float;     (** Risk-free interest rate (per annum, e.g., 0.05 for 5%) *)
  sigma: float; (** Volatility (per annum, e.g., 0.2 for 20%) *)
  k: float;     (** Strike price (in currency units) *)
  t: float;     (** Time to maturity (in years) *)
}

(** [make ~r ~sigma ~k ~t] creates Black-Scholes parameters with validation.
    
    @param r Risk-free rate (must be >= 0.0)
    @param sigma Volatility (must be > 0.0)  
    @param k Strike price (must be > 0.0)
    @param t Time to maturity (must be >= 0.0)
    @return Validated parameter record
    @raise Invalid_argument if any parameter violates constraints *)
val make : r:float -> sigma:float -> k:float -> t:float -> t

(** Create parameters from calibrated market data
    @param calibrated_params calibration results
    @param k strike price
    @param t time to maturity
    @return validated Black-Scholes parameters *)
val from_calibration : Calibration.calibrated_params -> k:float -> t:float -> t

(** Create parameters with automatic calibration from CSV file
    @param csv_file path to historical market data CSV
    @param k strike price
    @param t time to maturity
    @param vol_method volatility calibration method (default: Combined)
    @return (parameters, calibration_info_string) *)
val from_csv : 
  string -> k:float -> t:float -> ?vol_method:Calibration.vol_method -> 
  unit -> t * string