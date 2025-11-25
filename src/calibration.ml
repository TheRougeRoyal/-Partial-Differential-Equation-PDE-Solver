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

let calibrate market_data vol_method =
  let n = Array.length market_data.Market_data.data in
  
  if n < 10 then
    invalid_arg "Insufficient data for calibration (need at least 10 data points)";
  
  let drift = Market_data.average_drift market_data in
  
  let (volatility, method_desc, confidence) = match vol_method with
    | Simple window ->
        let window_size = min window n in
        let vol = Market_data.realized_volatility ~window_days:window_size market_data in
        let conf = Float.min 1.0 (float_of_int window_size /. 252.0) in
        (vol, Printf.sprintf "Simple(%d days)" window_size, conf)
    
    | EWMA lambda ->
        let vol = Market_data.ewma_volatility ~lambda market_data in
        let conf = 0.85 in
        (vol, Printf.sprintf "EWMA(λ=%.2f)" lambda, conf)
    
    | Combined ->
        let simple_30 = Market_data.realized_volatility ~window_days:(min 30 n) market_data in
        let simple_60 = Market_data.realized_volatility ~window_days:(min 60 n) market_data in
        let ewma_vol = Market_data.ewma_volatility ~lambda:0.94 market_data in
        
        let combined_vol = 0.3 *. simple_30 +. 0.3 *. simple_60 +. 0.4 *. ewma_vol in
        let conf = 0.90 in
        (combined_vol, "Combined(30d/60d/EWMA)", conf)
  in
  
  {
    volatility;
    drift;
    vol_confidence = confidence;
    data_points = n;
    method_used = method_desc;
  }

let recommend_grid_bounds market_data current_price volatility time_to_maturity =
  let (min_hist, max_hist, mean_hist, std_hist) = 
    Market_data.price_statistics market_data in
  
  let sigma_sqrt_t = volatility *. Float.sqrt time_to_maturity in
  
  let k = 3.0 in
  let price_range_factor = Float.exp (k *. sigma_sqrt_t) in
  
  let theoretical_min = current_price /. price_range_factor in
  let theoretical_max = current_price *. price_range_factor in
  
  let historical_min = min_hist *. 0.8 in
  let historical_max = max_hist *. 1.2 in
  
  let s_min = Float.max 0.0 (Float.min theoretical_min historical_min) in
  let s_max = Float.max theoretical_max historical_max in
  
  let s_min_final = Float.min s_min (current_price *. 0.3) in
  let s_max_final = Float.max s_max (current_price *. 2.5) in
  
  (s_min_final, s_max_final)

let estimate_risk_free_rate calibrated_params ?(market_risk_premium=0.06) () =
  let estimated_r = calibrated_params.drift -. market_risk_premium in
  
  Float.max 0.0 (Float.min 0.15 estimated_r)
