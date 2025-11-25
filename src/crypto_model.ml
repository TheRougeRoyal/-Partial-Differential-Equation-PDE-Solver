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

let default_params = {
  lookback_window = 30;
  forecast_horizon = 7;
  confidence_level = 0.95;
}

let geometric_brownian_motion ~spot ~drift ~volatility ~time_step ~n_steps =
  let dt = time_step in
  let sqrt_dt = Float.sqrt dt in
  let prices = Array.make (n_steps + 1) spot in
  
  for i = 1 to n_steps do
    let z = Random.float 1.0 |> fun u -> 
      Float.sqrt (-2.0 *. Float.log u) *. Float.cos (2.0 *. Float.pi *. Random.float 1.0) in
    let drift_term = (drift -. 0.5 *. volatility *. volatility) *. dt in
    let diffusion_term = volatility *. sqrt_dt *. z in
    prices.(i) <- prices.(i-1) *. Float.exp (drift_term +. diffusion_term)
  done;
  prices

let monte_carlo_forecast ~spot ~drift ~volatility ~days ~n_simulations =
  let dt = 1.0 /. 252.0 in
  let n_steps = days in
  
  let simulations = Array.init n_simulations (fun _ ->
    geometric_brownian_motion ~spot ~drift ~volatility ~time_step:dt ~n_steps
  ) in
  
  let final_prices = Array.map (fun sim -> sim.(n_steps)) simulations in
  Array.sort Float.compare final_prices;
  
  let mean = Array.fold_left (+.) 0.0 final_prices /. float_of_int n_simulations in
  let lower_idx = int_of_float (0.025 *. float_of_int n_simulations) in
  let upper_idx = int_of_float (0.975 *. float_of_int n_simulations) in
  
  (mean, final_prices.(lower_idx), final_prices.(upper_idx))

let predict market_data params =
  let calibrated = Calibration.calibrate market_data Calibration.Combined in
  let spot = Market_data.latest_close market_data in
  
  let predictions = Array.init params.forecast_horizon (fun day ->
    let days_ahead = day + 1 in
    let (pred, lower, upper) = monte_carlo_forecast 
      ~spot 
      ~drift:calibrated.drift 
      ~volatility:calibrated.volatility 
      ~days:days_ahead 
      ~n_simulations:1000 in
    
    {
      timestamp = Printf.sprintf "T+%d" days_ahead;
      predicted_price = pred;
      confidence_lower = lower;
      confidence_upper = upper;
      volatility = calibrated.volatility;
    }
  ) in
  
  predictions

let predict_from_csv csv_file params =
  let market_data = Market_data.parse_csv csv_file in
  predict market_data params
