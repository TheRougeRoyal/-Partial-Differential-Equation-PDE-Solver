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