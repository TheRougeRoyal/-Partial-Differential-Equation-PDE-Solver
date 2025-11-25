type calibrated_params = {
  volatility: float;
  drift: float;
  vol_confidence: float;
  data_points: int;
  method_used: string;
}

type vol_method = 
  | Simple of int
  | EWMA of float
  | Combined

val calibrate : Market_data.t -> vol_method -> calibrated_params

val recommend_grid_bounds : 
  Market_data.t -> float -> float -> float -> float * float

val estimate_risk_free_rate : 
  calibrated_params -> ?market_risk_premium:float -> unit -> float
