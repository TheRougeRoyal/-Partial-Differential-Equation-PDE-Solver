type t = {
  r: float;
  sigma: float;
  k: float;
  t: float;
}

let make ~r ~sigma ~k ~t =
  if r < 0.0 then
    invalid_arg (Printf.sprintf "Risk-free rate must be non-negative, got %g" r);
  if sigma <= 0.0 then
    invalid_arg (Printf.sprintf "Volatility must be positive, got %g" sigma);
  if k <= 0.0 then
    invalid_arg (Printf.sprintf "Strike price must be positive, got %g" k);
  if t < 0.0 then
    invalid_arg (Printf.sprintf "Time to maturity must be non-negative, got %g" t);
  if not (Float.is_finite r && Float.is_finite sigma && Float.is_finite k && Float.is_finite t) then
    invalid_arg "All parameters must be finite numbers";
  { r; sigma; k; t }

let from_calibration calibrated_params ~k ~t =
  let r = Calibration.estimate_risk_free_rate calibrated_params () in
  let sigma = calibrated_params.Calibration.volatility in
  make ~r ~sigma ~k ~t

let from_csv csv_file ~k ~t ?(vol_method=Calibration.Combined) () =
  let market_data = Market_data.parse_csv csv_file in
  let calibrated = Calibration.calibrate market_data vol_method in
  let params = from_calibration calibrated ~k ~t in
  let (start_date, end_date) = Market_data.date_range market_data in
  let info = Printf.sprintf 
    "Calibrated from %s: %d data points (%s to %s)\n\
     Method: %s, Confidence: %.1f%%\n\
     Volatility: %.2f%%, Drift: %.2f%%, Estimated r: %.2f%%"
    market_data.Market_data.symbol
    calibrated.Calibration.data_points
    start_date end_date
    calibrated.Calibration.method_used
    (calibrated.Calibration.vol_confidence *. 100.0)
    (params.sigma *. 100.0)
    (calibrated.Calibration.drift *. 100.0)
    (params.r *. 100.0)
  in
  (params, info)
