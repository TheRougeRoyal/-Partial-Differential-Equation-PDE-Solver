(** Parameter calibration from historical market data *)

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
  
  (* Calculate drift *)
  let drift = Market_data.average_drift market_data in
  
  (* Calculate volatility based on method *)
  let (volatility, method_desc, confidence) = match vol_method with
    | Simple window ->
        let window_size = min window n in
        let vol = Market_data.realized_volatility ~window_days:window_size market_data in
        let conf = Float.min 1.0 (float_of_int window_size /. 252.0) in
        (vol, Printf.sprintf "Simple(%d days)" window_size, conf)
    
    | EWMA lambda ->
        let vol = Market_data.ewma_volatility ~lambda market_data in
        (* EWMA gives more weight to recent data, confidence based on data recency *)
        let conf = 0.85 in (* EWMA is generally reliable *)
        (vol, Printf.sprintf "EWMA(λ=%.2f)" lambda, conf)
    
    | Combined ->
        (* Use multiple methods and combine with weights *)
        let simple_30 = Market_data.realized_volatility ~window_days:(min 30 n) market_data in
        let simple_60 = Market_data.realized_volatility ~window_days:(min 60 n) market_data in
        let ewma_vol = Market_data.ewma_volatility ~lambda:0.94 market_data in
        
        (* Weight: 30% short-term, 30% medium-term, 40% EWMA *)
        let combined_vol = 0.3 *. simple_30 +. 0.3 *. simple_60 +. 0.4 *. ewma_vol in
        let conf = 0.90 in (* Combined method is more robust *)
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
  
  (* Calculate expected price range based on volatility and time horizon *)
  (* Use geometric Brownian motion: S_t ~ LogNormal(ln(S0) + (μ - σ²/2)t, σ²t) *)
  (* Approximate: use S0 * exp(±k*σ*sqrt(t)) where k is number of std devs *)
  
  let sigma_sqrt_t = volatility *. Float.sqrt time_to_maturity in
  
  (* Use 99% confidence interval (k ≈ 3 standard deviations) *)
  let k = 3.0 in
  let price_range_factor = Float.exp (k *. sigma_sqrt_t) in
  
  (* Calculate theoretical bounds *)
  let theoretical_min = current_price /. price_range_factor in
  let theoretical_max = current_price *. price_range_factor in
  
  (* Also consider historical range with some buffer *)
  let historical_min = min_hist *. 0.8 in
  let historical_max = max_hist *. 1.2 in
  
  (* Take the broader of theoretical vs historical bounds *)
  let s_min = Float.max 0.0 (Float.min theoretical_min historical_min) in
  let s_max = Float.max theoretical_max historical_max in
  
  (* Ensure current price is well within bounds *)
  let s_min_final = Float.min s_min (current_price *. 0.3) in
  let s_max_final = Float.max s_max (current_price *. 2.5) in
  
  (s_min_final, s_max_final)

let estimate_risk_free_rate calibrated_params ?(market_risk_premium=0.06) () =
  (* Estimate risk-free rate using: r ≈ drift - market_risk_premium *)
  (* This is a rough approximation assuming the asset has beta ≈ 1 *)
  (* For better accuracy, would need market beta estimation *)
  
  let estimated_r = calibrated_params.drift -. market_risk_premium in
  
  (* Clamp to reasonable range [0, 0.15] *)
  Float.max 0.0 (Float.min 0.15 estimated_r)
