(** Uniform spatial-temporal grid for PDE discretization.
    
    This module provides uniform grid generation and indexing for finite
    difference methods. The grid covers the spatial domain [s_min, s_max]
    with n_s intervals and temporal domain [0, T] with n_t intervals.
    
    Invariants:
    - n_s >= 2 (at least 2 spatial intervals for meaningful discretization)
    - n_t >= 1 (at least 1 time interval)
    - s_max > s_min (valid spatial domain)
    - All grid parameters must be finite *)

(** Uniform grid type *)
type t = {
  s_min: float;  (** Minimum asset price (spatial domain lower bound) *)
  s_max: float;  (** Maximum asset price (spatial domain upper bound) *)
  n_s: int;      (** Number of spatial intervals *)
  n_t: int;      (** Number of time intervals *)
}

(** [make ?s_min ~s_max ~n_s ~n_t] creates a uniform grid with validation.
    
    @param s_min Minimum asset price (default: 0.0)
    @param s_max Maximum asset price (must be > s_min)
    @param n_s Number of spatial intervals (must be >= 2)
    @param n_t Number of time intervals (must be >= 1)
    @return Validated grid structure
    @raise Invalid_argument if parameters violate constraints *)
val make : ?s_min:float -> s_max:float -> n_s:int -> n_t:int -> unit -> t

(** [ds grid] computes spatial step size Δs.
    
    @param grid Grid structure
    @return Spatial step size (s_max - s_min) / n_s *)
val ds : t -> float

(** [dt grid maturity] computes temporal step size Δt.
    
    @param grid Grid structure  
    @param maturity Time to maturity T
    @return Temporal step size T / n_t *)
val dt : t -> float -> float

(** [s_at grid i] computes asset price at spatial index i.
    
    @param grid Grid structure
    @param i Spatial index (0 <= i <= n_s)
    @return Asset price s_min + i * Δs
    @raise Invalid_argument if i is out of bounds *)
val s_at : t -> int -> float

(** [find_bracketing_index grid s] finds spatial index for interpolation.
    
    Returns index i such that S_i <= s < S_{i+1}, useful for linear
    interpolation. Uses floor operation for consistent bracketing.
    
    @param grid Grid structure
    @param s Asset price to locate
    @return Bracketing index (clamped to [0, n_s-1])
    @raise Invalid_argument if s is not finite *)
val find_bracketing_index : t -> float -> int

(** Create grid with adaptive bounds based on market data and parameters
    @param market_data historical market data
    @param current_price current asset price (s0)
    @param params Black-Scholes parameters
    @param n_s number of spatial intervals
    @param n_t number of time intervals
    @return grid with data-driven bounds *)
val make_adaptive : 
  Market_data.t -> float -> Bs_params.t -> n_s:int -> n_t:int -> t