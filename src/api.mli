(** High-level pricing API with error analysis.
    
    This module provides the main user-facing interface for option pricing,
    combining PDE solving with analytic Black-Scholes comparison for
    validation and error analysis.
    
    Foundation behavior: Returns analytic prices with zero error since
    PDE time-marching is not yet implemented. *)

(** [price_euro ~params ~grid ~s0 ~scheme ~payoff] prices European option.
    
    FOUNDATION BEHAVIOR: Currently returns analytic Black-Scholes price
    with zero error since PDE solver is a stub. Future implementation
    will return PDE-computed price with error vs analytic.
    
    @param params Black-Scholes model parameters
    @param grid Spatial-temporal discretization  
    @param s0 Current asset price for pricing
    @param scheme Time-stepping scheme
    @param payoff Option type (Call or Put)
    @return (price, abs_error_vs_analytic) tuple
    
    Special cases:
    - If t=0: returns (terminal_payoff_at_s0, 0.0)
    - If t>0: returns (analytic_price, 0.0) until PDE is implemented *)
val price_euro : params:Bs_params.t -> grid:Grid.t -> s0:float -> scheme:Time_stepper.scheme -> payoff:Payoff.kind -> float * float