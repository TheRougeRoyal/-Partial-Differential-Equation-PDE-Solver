

open Pde_opt

let s0 = ref 100.0
let k = ref 100.0  
let t = ref 1.0
let r = ref 0.05
let sigma = ref 0.2
let payoff_str = ref "call"
let scheme_str = ref "CN"
let ns = ref 200
let nt = ref 200
let smin = ref None  (* None means auto-calculate *)
let smax = ref None  
let verbose = ref false
let csv_file = ref None  (* Path to historical data CSV *)
let use_adaptive_grid = ref false
let run_backtest = ref false
let backtest_output = ref None
let vol_method_str = ref "combined"

let spec = [
  ("--s0", Arg.Set_float s0, " Current asset price (default: 100.0 or from CSV)");
  ("--k", Arg.Set_float k, " Strike price (default: 100.0)");
  ("--t", Arg.Set_float t, " Time to maturity in years (default: 1.0)");
  ("--r", Arg.Set_float r, " Risk-free rate per annum (default: 0.05 or calibrated)");
  ("--sigma", Arg.Set_float sigma, " Volatility per annum (default: 0.2 or calibrated)");
  ("--payoff", Arg.Set_string payoff_str, " Option type: call|put (default: call)");
  ("--scheme", Arg.Set_string scheme_str, " Time scheme: BE|CN (default: CN)");
  ("--ns", Arg.Set_int ns, " Number of spatial intervals (default: 200)");
  ("--nt", Arg.Set_int nt, " Number of time intervals (default: 200)");
  ("--smin", Arg.Float (fun x -> smin := Some x), " Minimum asset price (default: auto)");
  ("--smax", Arg.Float (fun x -> smax := Some x), " Maximum asset price (default: auto)");
  ("--verbose", Arg.Set verbose, " Show detailed diagnostics");
  ("--csv", Arg.String (fun x -> csv_file := Some x), " Path to historical market data CSV");
  ("--adaptive", Arg.Set use_adaptive_grid, " Use adaptive grid based on market data");
  ("--vol-method", Arg.Set_string vol_method_str, " Volatility calibration: simple|ewma|combined (default: combined)");
  ("--backtest", Arg.Set run_backtest, " Run backtesting on historical data");
  ("--backtest-output", Arg.String (fun x -> backtest_output := Some x), " Export backtest results to CSV");
]

let usage_msg = "pde_opt [options]\nOCaml PDE Foundation for Option Pricing\n\
                  \nData-Driven Mode:\n\
                  Use --csv <file> to calibrate parameters from historical data.\n\
                  Use --adaptive to enable adaptive grid boundaries.\n\
                  Use --backtest to validate model against historical data."


let parse_payoff payoff_str =
  match String.lowercase_ascii payoff_str with
  | "call" -> `Call
  | "put" -> `Put
  | _ -> 
      Printf.eprintf "Error: Invalid payoff type '%s'. Must be 'call' or 'put'.\n" payoff_str;
      exit 1

(* Parse time-stepping scheme *)
let parse_scheme scheme_str =
  match String.uppercase_ascii scheme_str with
  | "BE" -> `BE
  | "CN" -> `CN
  | _ ->
      Printf.eprintf "Error: Invalid scheme '%s'. Must be 'BE' or 'CN'.\n" scheme_str;
      exit 1

(* Parse volatility calibration method *)
let parse_vol_method method_str =
  match String.lowercase_ascii method_str with
  | "simple" -> Pde_opt.Calibration.Simple 60  (* 60-day window *)
  | "ewma" -> Pde_opt.Calibration.EWMA 0.94
  | "combined" -> Pde_opt.Calibration.Combined
  | _ ->
      Printf.eprintf "Error: Invalid vol method '%s'. Must be 'simple', 'ewma', or 'combined'.\n" method_str;
      exit 1

(* Validate numeric parameters *)
let validate_parameters () =
  try
    (* Validate and create parameters *)
    let params = Bs_params.make ~r:!r ~sigma:!sigma ~k:!k ~t:!t in
    
    (* Validate current asset price *)
    if !s0 <= 0.0 then (
      Printf.eprintf "Error: Current asset price (--s0) must be positive, got %g\n" !s0;
      exit 1
    );
    
    (* Calculate intelligent defaults for smin and smax if not provided *)
    (* Goal: Focus domain around strike K and spot S0, avoiding S=0 for calls *)
    let computed_smin = match !smin with
      | Some v -> v
      | None -> 
          (* Use max of 0.2*K or 0.1*S0 to avoid S=0 for calls *)
          (* For puts, we want to include lower values *)
          let payoff_type = parse_payoff !payoff_str in
          (match payoff_type with
           | `Call -> Float.max 1.0 (0.3 *. Float.min !s0 !k)
           | `Put -> 0.0  (* Puts need S=0 boundary *)
          )
    in
    
    let computed_smax = match !smax with
      | Some v -> v
      | None ->
          (* Use 3*max(S0, K) to ensure we cover the interesting region *)
          (* Add some extra range based on volatility and time *)
          let vol_range = 4.0 *. !sigma *. Float.sqrt !t in
          Float.max (3.0 *. Float.max !s0 !k) (!s0 *. (1.0 +. vol_range))
    in
    
    (* Validate grid parameters - let Grid.make handle the validation *)
    let grid = Grid.make ~s_min:computed_smin ~s_max:computed_smax ~n_s:!ns ~n_t:!nt () in
    
    let ds = Grid.ds grid in
    let dt = Grid.dt grid params.Bs_params.t in
    
    (* Display grid info *)
    Printf.printf "Grid domain: [%.2f, %.2f], ds=%.4f, dt=%.6f\n" 
      computed_smin computed_smax ds dt;
    
    (* Verbose diagnostics *)
    if !verbose then (
      Printf.printf "\n=== Grid Diagnostics ===\n";
      Printf.printf "S0 = %.2f, K = %.2f\n" !s0 !k;
      Printf.printf "Grid points: %d spatial, %d temporal\n" (!ns + 1) (!nt + 1);
      
      (* Check if S0 is within grid domain *)
      if !s0 < computed_smin || !s0 > computed_smax then
        Printf.printf "WARNING: S0=%.2f is outside grid domain [%.2f, %.2f]\n" 
          !s0 computed_smin computed_smax;
      
      (* Find grid point closest to S0 *)
      let i_s0 = Grid.find_bracketing_index grid !s0 in
      let s_left = Grid.s_at grid i_s0 in
      let s_right = Grid.s_at grid (i_s0 + 1) in
      Printf.printf "S0 falls between grid points: S[%d]=%.4f and S[%d]=%.4f\n" 
        i_s0 s_left (i_s0+1) s_right;
      
      (* Check CFL-like stability condition *)
      (* For explicit scheme, we need dt <= ds²/(σ²S²_max) *)
      (* For implicit/CN, this is less restrictive but still informative *)
      let s_max_grid = computed_smax in
      let cfl_like = dt *. !sigma *. !sigma *. s_max_grid *. s_max_grid /. (ds *. ds) in
      Printf.printf "Stability metric (dt*σ²*S_max²/ds²): %.4f\n" cfl_like;
      if cfl_like > 0.5 then
        Printf.printf "  Note: High value may affect accuracy even with implicit scheme\n";
      
      (* Display boundary conditions *)
      let payoff_type = parse_payoff !payoff_str in
      let tau0 = 0.0 in (* at t=T, τ=0 *)
      let left_bc = Bcs.left_value payoff_type ~r:!r ~k:!k ~tau:tau0 in
      let right_bc = Bcs.right_value payoff_type ~r:!r ~k:!k ~s_max:computed_smax ~tau:tau0 in
      Printf.printf "Initial boundary conditions (τ=0): left=%.4f, right=%.4f\n" 
        left_bc right_bc;
      
      let tau_final = !t in
      let left_bc_final = Bcs.left_value payoff_type ~r:!r ~k:!k ~tau:tau_final in
      let right_bc_final = Bcs.right_value payoff_type ~r:!r ~k:!k ~s_max:computed_smax ~tau:tau_final in
      Printf.printf "Final boundary conditions (τ=%.2f): left=%.4f, right=%.4f\n" 
        tau_final left_bc_final right_bc_final;
      
      Printf.printf "========================\n\n";
    );
    
    (params, grid)
  with
  | Invalid_argument msg ->
      Printf.eprintf "Error: %s\n" msg;
      exit 1
  | Failure msg ->
      Printf.eprintf "Error: %s\n" msg;
      exit 1

let main () =
  Arg.parse spec (fun _ -> ()) usage_msg;
  
  try
    let payoff = parse_payoff !payoff_str in
    let scheme = parse_scheme !scheme_str in
    
    (* Check if we're in data-driven mode *)
    match !csv_file with
    | Some csv_path ->
        (* Data-driven mode: calibrate from CSV *)
        Printf.printf "\n=== Data-Driven Mode ===\n";
        Printf.printf "Loading historical data from: %s\n" csv_path;
        
        let market_data = Pde_opt.Market_data.parse_csv csv_path in
        let vol_method = parse_vol_method !vol_method_str in
        
        (* Calibrate parameters from data *)
        let (params, calib_info) = Pde_opt.Bs_params.from_csv csv_path ~k:!k ~t:!t ~vol_method () in
        Printf.printf "\n%s\n" calib_info;
        
        (* Use latest close price as s0 if not explicitly provided *)
        let current_s0 = 
          if !s0 = 100.0 then  (* Default value, use from data *)
            Pde_opt.Market_data.latest_close market_data
          else
            !s0
        in
        Printf.printf "Current asset price (S0): %.2f\n" current_s0;
        
        (* Create grid (adaptive or manual) *)
        let grid = 
          if !use_adaptive_grid then (
            Printf.printf "Using adaptive grid based on market data\n";
            Pde_opt.Grid.make_adaptive market_data current_s0 params ~n_s:!ns ~n_t:!nt
          ) else (
            let (_, grid_manual) = validate_parameters () in
            grid_manual
          )
        in
        
        (* Run backtesting if requested *)
        if !run_backtest then (
          Printf.printf "\n=== Running Backtest ===\n";
          let backtest_stats = Pde_opt.Backtesting.run_backtest 
            market_data params !k payoff !t scheme in
          Pde_opt.Backtesting.print_summary backtest_stats;
          
          (* Export results if requested *)
          (match !backtest_output with
           | Some output_file -> 
               Pde_opt.Backtesting.export_to_csv output_file backtest_stats
           | None -> ());
        );
        
        (* Compute option price for current conditions *)
        Printf.printf "\n=== Current Option Pricing ===\n";
        let (pde_price, abs_error) = Pde_opt.Api.price_euro ~params ~grid ~s0:current_s0 ~scheme ~payoff in
        
        (* Compute analytic price for comparison *)
        let analytic_price = Pde_opt.Payoff.analytic_black_scholes payoff 
                              ~r:params.Pde_opt.Bs_params.r 
                              ~sigma:params.Pde_opt.Bs_params.sigma 
                              ~t:!t ~s0:current_s0 ~k:!k in
        
        (* Display results *)
        let scheme_name = match scheme with `BE -> "BE" | `CN -> "CN" in
        let payoff_name = match payoff with `Call -> "Call" | `Put -> "Put" in
        Printf.printf "PDE %s %s price: %.5f\n" scheme_name payoff_name pde_price;
        Printf.printf "Analytic %s price: %.5f\n" payoff_name analytic_price;
        Printf.printf "Abs error: %.5f\n" abs_error;
        
        exit 0
    
    | None ->
        (* Traditional mode: use manual parameters *)
        Printf.printf "\n=== Manual Parameter Mode ===\n";
        let (params, grid) = validate_parameters () in
        
        (* Compute option price *)
        let (pde_price, abs_error) = Pde_opt.Api.price_euro ~params ~grid ~s0:!s0 ~scheme ~payoff in
        
        (* Compute analytic price for comparison *)
        let analytic_price = Pde_opt.Payoff.analytic_black_scholes payoff 
                              ~r:!r ~sigma:!sigma ~t:!t ~s0:!s0 ~k:!k in
        
        (* Display results *)
        let scheme_name = match scheme with `BE -> "BE" | `CN -> "CN" in
        let payoff_name = match payoff with `Call -> "Call" | `Put -> "Put" in
        Printf.printf "PDE %s %s price: %.5f\n" scheme_name payoff_name pde_price;
        Printf.printf "Analytic %s price: %.5f\n" payoff_name analytic_price;
        Printf.printf "Abs error: %.5f\n" abs_error;
        
        exit 0
    
  with
  | Invalid_argument msg ->
      Printf.eprintf "Error: %s\n" msg;
      exit 1
  | Failure msg ->
      Printf.eprintf "Error: %s\n" msg;
      exit 1
  | exn ->
      Printf.eprintf "Unexpected error: %s\n" (Printexc.to_string exn);
      exit 1

(* Entry point *)
let () = main ()