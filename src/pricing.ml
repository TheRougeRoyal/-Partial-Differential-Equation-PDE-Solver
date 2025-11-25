type option_type = Call | Put

type pricing_input = {
  spot: float;
  strike: float;
  maturity: float;
  rate: float;
  volatility: float;
  option_type: option_type;
}

type pricing_output = {
  price: float;
  analytic_price: float;
  error: float;
  delta: float;
  gamma: float;
  theta: float;
  vega: float;
}

let validate_input input =
  if input.spot <= 0.0 then
    invalid_arg "Spot price must be positive";
  if input.strike <= 0.0 then
    invalid_arg "Strike price must be positive";
  if input.maturity < 0.0 then
    invalid_arg "Maturity must be non-negative";
  if input.rate < 0.0 then
    invalid_arg "Risk-free rate must be non-negative";
  if input.volatility <= 0.0 then
    invalid_arg "Volatility must be positive"

let to_payoff_kind = function
  | Call -> `Call
  | Put -> `Put

let price_option ?(n_s=200) ?(n_t=200) ?(scheme=`CN) input =
  validate_input input;
  
  let payoff_kind = to_payoff_kind input.option_type in
  
  let params = Bs_params.make 
    ~r:input.rate 
    ~sigma:input.volatility 
    ~k:input.strike 
    ~t:input.maturity in
  
  let s_min = match input.option_type with
    | Call -> Float.max 1.0 (0.3 *. Float.min input.spot input.strike)
    | Put -> 0.0
  in
  
  let vol_range = 4.0 *. input.volatility *. Float.sqrt input.maturity in
  let s_max = Float.max 
    (3.0 *. Float.max input.spot input.strike)
    (input.spot *. (1.0 +. vol_range)) in
  
  let grid = Grid.make ~s_min ~s_max ~n_s ~n_t () in
  
  let (pde_price, error) = Api.price_euro 
    ~params ~grid ~s0:input.spot ~scheme ~payoff:payoff_kind in
  
  let analytic_price = Payoff.analytic_black_scholes payoff_kind
    ~r:input.rate ~sigma:input.volatility ~t:input.maturity
    ~s0:input.spot ~k:input.strike in
  
  let eps = 0.01 *. input.spot in
  let s_up = input.spot +. eps in
  let s_down = input.spot -. eps in
  
  let solution = Pde1d.solve_european ~params ~grid ~payoff:payoff_kind ~scheme in
  let price_up = Pde1d.interpolate_at ~grid ~values:solution ~s:s_up in
  let price_down = Pde1d.interpolate_at ~grid ~values:solution ~s:s_down in
  
  let delta = (price_up -. price_down) /. (2.0 *. eps) in
  let gamma = (price_up -. 2.0 *. pde_price +. price_down) /. (eps *. eps) in
  
  let dt_eps = 0.01 in
  let t_shifted = Float.max 0.0 (input.maturity -. dt_eps) in
  let params_theta = Bs_params.make 
    ~r:input.rate ~sigma:input.volatility ~k:input.strike ~t:t_shifted in
  let (price_theta, _) = Api.price_euro 
    ~params:params_theta ~grid ~s0:input.spot ~scheme ~payoff:payoff_kind in
  let theta = (price_theta -. pde_price) /. dt_eps in
  
  let vol_eps = 0.01 in
  let params_vega = Bs_params.make
    ~r:input.rate ~sigma:(input.volatility +. vol_eps) ~k:input.strike ~t:input.maturity in
  let (price_vega, _) = Api.price_euro
    ~params:params_vega ~grid ~s0:input.spot ~scheme ~payoff:payoff_kind in
  let vega = (price_vega -. pde_price) /. vol_eps in
  
  {
    price = pde_price;
    analytic_price;
    error;
    delta;
    gamma;
    theta;
    vega;
  }

let price_from_csv ?(n_s=200) ?(n_t=200) ?(scheme=`CN) ?(vol_method=Calibration.Combined) 
                    csv_file strike maturity option_type =
  let market_data = Market_data.parse_csv csv_file in
  let current_spot = Market_data.latest_close market_data in
  let calibrated = Calibration.calibrate market_data vol_method in
  let rate = Calibration.estimate_risk_free_rate calibrated () in
  let volatility = calibrated.Calibration.volatility in
  
  let input = {
    spot = current_spot;
    strike;
    maturity;
    rate;
    volatility;
    option_type;
  } in
  
  price_option ~n_s ~n_t ~scheme input

let batch_price inputs ?(n_s=200) ?(n_t=200) ?(scheme=`CN) () =
  List.map (price_option ~n_s ~n_t ~scheme) inputs

let surface_volatility spots strikes maturity rate csv_file =
  let market_data = Market_data.parse_csv csv_file in
  let results = ref [] in
  
  List.iter (fun spot ->
    List.iter (fun strike ->
      let calibrated = Calibration.calibrate market_data Calibration.Combined in
      let vol = calibrated.Calibration.volatility in
      results := (spot, strike, vol) :: !results
    ) strikes
  ) spots;
  
  List.rev !results

let print_output output =
  Printf.printf "Price: %.5f\n" output.price;
  Printf.printf "Analytic: %.5f\n" output.analytic_price;
  Printf.printf "Error: %.5f\n" output.error;
  Printf.printf "Delta: %.5f\n" output.delta;
  Printf.printf "Gamma: %.5f\n" output.gamma;
  Printf.printf "Theta: %.5f\n" output.theta;
  Printf.printf "Vega: %.5f\n" output.vega
