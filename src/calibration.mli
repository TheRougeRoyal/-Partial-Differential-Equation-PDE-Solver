(** Parameter calibration from historical market data *)

(** Calibrated model parameters with confidence metrics *)
type calibrated_params = {
  volatility: float;          (** Annualized volatility estimate *)
  drift: float;               (** Annualized drift/return estimate *)
  vol_confidence: float;      (** Confidence score for volatility [0,1] *)
  data_points: int;           (** Number of data points used *)
  method_used: string;        (** Description of calibration method *)
}

(** Calibration method for volatility *)
type vol_method = 
  | Simple of int       (** Simple historical volatility with window size *)
  | EWMA of float       (** EWMA with lambda parameter *)
  | Combined            (** Weighted combination of methods *)

(** Calibrate parameters from market data
    @param market_data historical market data
    @param vol_method volatility estimation method
    @return calibrated parameters *)
val calibrate : Market_data.t -> vol_method -> calibrated_params

(** Get recommended grid bounds based on historical data and volatility
    @param market_data historical data
    @param current_price current asset price
    @param volatility estimated volatility
    @param time_to_maturity time horizon in years
    @return (s_min, s_max) recommended price domain *)
val recommend_grid_bounds : 
  Market_data.t -> float -> float -> float -> float * float

(** Estimate risk-free rate proxy from historical drift and volatility
    Uses CAPM-inspired approach to estimate risk-free component
    @param calibrated_params calibrated parameters
    @param market_risk_premium expected market risk premium (default 0.06)
    @return estimated risk-free rate *)
val estimate_risk_free_rate : 
  calibrated_params -> ?market_risk_premium:float -> unit -> float
