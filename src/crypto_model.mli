type prediction = {
  timestamp: string;
  predicted_price: float;
  confidence_lower: float;
  confidence_upper: float;
  volatility: float;
}

type model_params = {
  lookback_window: int;
  forecast_horizon: int;
  confidence_level: float;
}

val default_params : model_params

val predict : Market_data.t -> model_params -> prediction array

val predict_from_csv : string -> model_params -> prediction array

val monte_carlo_forecast : spot:float -> drift:float -> volatility:float -> days:int -> n_simulations:int -> (float * float * float)
