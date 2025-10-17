(** Time-stepping scheme management for PDE solving *)

type scheme = [ `BE | `CN ]

let theta = function
  | `BE -> 1.0  (* Backward Euler: fully implicit *)
  | `CN -> 0.5  (* Crank-Nicolson: semi-implicit *)