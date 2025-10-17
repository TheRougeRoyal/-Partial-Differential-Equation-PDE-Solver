(** Option payoff calculations and analytic Black-Scholes pricing.
    
    This module provides terminal payoff calculations for European options
    and implements the analytic Black-Scholes formula with numerically
    stable standard normal CDF approximation.
    
    The Black-Scholes implementation uses the Abramowitz-Stegun 7.1.26
    approximation for the standard normal CDF with error < 1.5e-7. *)

(** Option type enumeration *)
type kind = [ `Call | `Put ]

(** [terminal option_type ~k s] computes terminal payoff at expiry.
    
    @param option_type Call or Put option
    @param k Strike price (must be > 0)
    @param s Asset price at expiry (must be >= 0)
    @return Terminal payoff: max(S-K, 0) for calls, max(K-S, 0) for puts
    @raise Invalid_argument if parameters are invalid *)
val terminal : kind -> k:float -> float -> float

(** [analytic_black_scholes option_type ~r ~sigma ~t ~s0 ~k] computes analytic price.
    
    Implements the Black-Scholes formula for European options with
    numerically stable standard normal CDF computation.
    
    @param option_type Call or Put option
    @param r Risk-free rate (per annum, must be >= 0)
    @param sigma Volatility (per annum, must be > 0)
    @param t Time to maturity (years, must be >= 0)
    @param s0 Current asset price (must be > 0)
    @param k Strike price (must be > 0)
    @return Analytic Black-Scholes option price
    @raise Invalid_argument if parameters are invalid *)
val analytic_black_scholes : kind -> r:float -> sigma:float -> t:float -> s0:float -> k:float -> float