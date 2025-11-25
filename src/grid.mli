type t = {
    s_min: float;
    s_max: float;
    n_s: int;
    n_t: int;
}

val make : ?s_min:float -> s_max:float -> n_s:int -> n_t:int -> unit -> t

val ds : t -> float

val dt : t -> float -> float

val s_at : t -> int -> float

val find_bracketing_index : t -> float -> int

val make_adaptive :
    Market_data.t -> float -> Bs_params.t -> n_s:int -> n_t:int -> t
