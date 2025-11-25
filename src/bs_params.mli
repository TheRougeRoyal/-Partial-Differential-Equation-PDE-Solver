type t = {
  r: float;
  sigma: float;
  k: float;
  t: float;
}

val make : r:float -> sigma:float -> k:float -> t:float -> t

val from_calibration : Calibration.calibrated_params -> k:float -> t:float -> t

val from_csv : 
  string -> k:float -> t:float -> ?vol_method:Calibration.vol_method -> 
  unit -> t * string