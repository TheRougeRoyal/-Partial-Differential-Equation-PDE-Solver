(** Time-stepping scheme management for PDE solving.
    
    This module provides enumeration and parameter mapping for different
    time-stepping schemes used in finite difference PDE methods. The theta
    parameter controls the implicitness of the scheme.
    
    Supported schemes:
    - Backward Euler (BE): Fully implicit, θ = 1.0, unconditionally stable
    - Crank-Nicolson (CN): Semi-implicit, θ = 0.5, second-order accurate *)

(** Time-stepping scheme enumeration *)
type scheme = [ `BE | `CN ]

(** [theta scheme] returns the theta parameter for the given scheme.
    
    The theta parameter appears in the generalized theta method:
    (I - θ*Δt*L) u^{n+1} = (I + (1-θ)*Δt*L) u^n
    
    where L is the spatial differential operator.
    
    @param scheme Time-stepping scheme
    @return Theta parameter: 1.0 for BE, 0.5 for CN *)
val theta : scheme -> float