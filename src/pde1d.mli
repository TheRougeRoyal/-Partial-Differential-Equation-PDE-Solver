val solve_european : params:Bs_params.t -> grid:Grid.t -> payoff:Payoff.kind -> scheme:Time_stepper.scheme -> float array

val interpolate_at : grid:Grid.t -> values:float array -> s:float -> float