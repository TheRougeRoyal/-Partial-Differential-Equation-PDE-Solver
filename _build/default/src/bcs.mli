(** Boundary conditions for European option PDE solving.
    
    This module implements Dirichlet boundary conditions for the Black-Scholes
    PDE based on asymptotic behavior of European options. The boundary values
    are derived from the analytic behavior as S → 0 and S → ∞.
    
    Mathematical foundation:
    - Left boundary (S=0): Call → 0, Put → K*exp(-r*τ)  
    - Right boundary (S→∞): Call → S-K*exp(-r*τ), Put → 0
    
    where τ = T - t is the time to expiry. *)

(** [left_value option_type ~r ~k ~tau] computes left boundary value at S=0.
    
    For calls: V(0,t) = 0 (worthless when asset price is zero)
    For puts: V(0,t) = K*exp(-r*τ) (present value of strike)
    
    @param option_type Call or Put option
    @param r Risk-free rate (per annum, must be >= 0)
    @param k Strike price (must be > 0)
    @param tau Time to expiry T-t (must be >= 0)
    @return Boundary value at S=0
    @raise Invalid_argument if parameters are invalid *)
val left_value : Payoff.kind -> r:float -> k:float -> tau:float -> float

(** [right_value option_type ~r ~k ~s_max ~tau] computes right boundary value.
    
    For calls: V(S_max,t) ≈ S_max - K*exp(-r*τ) (intrinsic value)
    For puts: V(S_max,t) = 0 (worthless when asset price is very high)
    
    @param option_type Call or Put option  
    @param r Risk-free rate (per annum, must be >= 0)
    @param k Strike price (must be > 0)
    @param s_max Maximum asset price (must be > 0)
    @param tau Time to expiry T-t (must be >= 0)
    @return Boundary value at S=s_max
    @raise Invalid_argument if parameters are invalid *)
val right_value : Payoff.kind -> r:float -> k:float -> s_max:float -> tau:float -> float