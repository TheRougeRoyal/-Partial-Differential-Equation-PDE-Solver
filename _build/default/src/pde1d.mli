(** One-dimensional PDE solver for European options.
    
    This module provides the main interface for solving the Black-Scholes PDE
    in one spatial dimension using finite difference methods.
    
    Implementation features:
    - Spatial central differences on uniform S-grid
    - Implicit time integration: Backward Euler (BE) and Crank-Nicolson (CN)
    - Dirichlet boundary conditions (asymptotic far-field)
    - Stable tridiagonal solve using Thomas algorithm
    - Backward time marching from T to 0 *)

(** [solve_european ~params ~grid ~payoff ~scheme] solves European option PDE.
    
    Solves the Black-Scholes PDE using θ-scheme time stepping:
    (I - θΔt L) V^n = (I + (1-θ)Δt L) V^{n+1}
    
    where L is the Black-Scholes differential operator and θ determines
    the time-stepping scheme (θ=1.0 for BE, θ=0.5 for CN).
    
    @param params Black-Scholes parameters (r, σ, K, T)
    @param grid Spatial-temporal discretization
    @param payoff Option type (Call or Put)
    @param scheme Time-stepping scheme (BE or CN)
    @return Solution vector at t=0 on spatial grid (length n_s+1)
    
    Mathematical details:
    - Uses central differences: V_S ≈ (V_{i+1} - V_{i-1})/(2ΔS)
    - Second derivative: V_SS ≈ (V_{i+1} - 2V_i + V_{i-1})/(ΔS^2)
    - Boundary conditions applied via Bcs module
    - Stability: CN is O(Δt^2) accurate, BE is O(Δt) but more stable *)
val solve_european : params:Bs_params.t -> grid:Grid.t -> payoff:Payoff.kind -> scheme:Time_stepper.scheme -> float array

(** [interpolate_at ~grid ~values ~s] interpolates grid values at asset price s.
    
    Uses linear interpolation between adjacent grid points. Handles
    extrapolation by clamping to boundary values.
    
    @param grid Spatial grid structure
    @param values Solution values on grid (length n_s+1)
    @param s Asset price for interpolation
    @return Interpolated value at s
    @raise Invalid_argument if array length doesn't match grid *)
val interpolate_at : grid:Grid.t -> values:float array -> s:float -> float