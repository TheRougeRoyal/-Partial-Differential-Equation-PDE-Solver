type kind = [ `Call | `Put ]

val terminal : kind -> k:float -> float -> float

val analytic_black_scholes : kind -> r:float -> sigma:float -> t:float -> s0:float -> k:float -> float