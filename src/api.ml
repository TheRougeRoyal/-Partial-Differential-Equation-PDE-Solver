let price_euro ~params ~grid ~s0 ~scheme ~payoff =
  if s0 <= 0.0 then
    invalid_arg (Printf.sprintf "Current asset price must be positive, got %g" s0);
  if not (Float.is_finite s0) then
    invalid_arg "Current asset price must be finite";
  
  if params.Bs_params.t = 0.0 then
    let terminal_value = Payoff.terminal payoff ~k:params.Bs_params.k s0 in
    (terminal_value, 0.0)
  else
    let pde_solution = Pde1d.solve_european ~params ~grid ~payoff ~scheme in
    let pde_price = Pde1d.interpolate_at ~grid ~values:pde_solution ~s:s0 in
    
    let analytic_price = Payoff.analytic_black_scholes payoff 
                          ~r:params.Bs_params.r ~sigma:params.Bs_params.sigma ~t:params.Bs_params.t 
                          ~s0:s0 ~k:params.Bs_params.k in
    
    let error = Float.abs (pde_price -. analytic_price) in
    (pde_price, error)
