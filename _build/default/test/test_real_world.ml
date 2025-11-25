open Pde_opt

type scenario = {
  name: string;
  s0: float;
  k: float;
  r: float;
  sigma: float;
  t: float;
  option_type: [`Call | `Put];
  expected_price: float;
}

let check_price ~actual ~expected ~tolerance name =
  let diff = Float.abs (actual -. expected) in
  let rel_error = diff /. expected in
  Printf.printf "    Price: %.4f (expected ~%.4f, error: %.2f%%)\n" 
    actual expected (rel_error *. 100.0);
  
  if diff > tolerance then (
    Printf.printf "    ✗ FAIL: %s - error %.4f exceeds tolerance %.4f\n" 
      name diff tolerance;
    exit 1
  ) else
    Printf.printf "    ✓ PASS: %s\n" name

let print_scenario scenario =
  Printf.printf "\n──────────────────────────────────────────\n";
  Printf.printf "Scenario: %s\n" scenario.name;
  Printf.printf "──────────────────────────────────────────\n";
  Printf.printf "  Stock: $%.2f | Strike: $%.2f\n" scenario.s0 scenario.k;
  Printf.printf "  Rate: %.1f%% | Vol: %.1f%% | Expiry: %.1f years\n" 
    (scenario.r *. 100.0) (scenario.sigma *. 100.0) scenario.t;
  Printf.printf "  Type: %s\n" 
    (match scenario.option_type with `Call -> "Call" | `Put -> "Put")

let test_scenario scenario =
  print_scenario scenario;
  
  let params = Bs_params.make ~r:scenario.r ~sigma:scenario.sigma 
                 ~k:scenario.k ~t:scenario.t in
  
  let s_min = if scenario.option_type = `Call then 
                0.3 *. Float.min scenario.s0 scenario.k 
              else 0.0 in
  let s_max = Float.max (3.0 *. Float.max scenario.s0 scenario.k)
                (scenario.s0 *. (1.0 +. 4.0 *. scenario.sigma *. Float.sqrt scenario.t)) in
  
  let grid = Grid.make ~s_min ~s_max ~n_s:150 ~n_t:100 () in
  
  let (pde_price, pde_error) = Api.price_euro ~params ~grid ~s0:scenario.s0 
                                 ~scheme:`CN ~payoff:scenario.option_type in
  
  let analytic_price = Payoff.analytic_black_scholes scenario.option_type
                         ~r:scenario.r ~sigma:scenario.sigma ~t:scenario.t
                         ~s0:scenario.s0 ~k:scenario.k in
  
  Printf.printf "  Results:\n";
  Printf.printf "    PDE Price:      $%.4f\n" pde_price;
  Printf.printf "    Analytic Price: $%.4f\n" analytic_price;
  Printf.printf "    Absolute Error: $%.4f\n" pde_error;
  

  check_price ~actual:pde_price ~expected:scenario.expected_price 
    ~tolerance:0.5 "Price vs expected";
  
  check_price ~actual:pde_price ~expected:analytic_price 
    ~tolerance:0.1 "PDE vs Black-Scholes"

let test_tech_stocks () =
  Printf.printf "\n╔════════════════════════════════════════════════╗\n";
  Printf.printf "║        Technology Stock Options                ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  
  let scenarios = [
    {
      name = "AAPL-like: ATM 3-month call";
      s0 = 180.0; k = 180.0; r = 0.045; sigma = 0.28; t = 0.25;
      option_type = `Call;
      expected_price = 7.0;
    };
    {
      name = "NVDA-like: High vol 6-month call";
      s0 = 450.0; k = 450.0; r = 0.045; sigma = 0.45; t = 0.5;
      option_type = `Call;
      expected_price = 50.0;
    };
    {
      name = "MSFT-like: ITM 1-year put";
      s0 = 380.0; k = 400.0; r = 0.045; sigma = 0.25; t = 1.0;
      option_type = `Put;
      expected_price = 35.0;
    };
  ] in
  
  List.iter test_scenario scenarios

let test_traditional_stocks () =
  Printf.printf "\n╔════════════════════════════════════════════════╗\n";
  Printf.printf "║        Traditional Stock Options               ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  
  let scenarios = [
    {
      name = "Blue chip: ATM 1-year call";
      s0 = 150.0; k = 150.0; r = 0.04; sigma = 0.18; t = 1.0;
      option_type = `Call;
      expected_price = 12.0;
    };
    {
      name = "Utility stock: Low vol 6-month put";
      s0 = 75.0; k = 75.0; r = 0.04; sigma = 0.12; t = 0.5;
      option_type = `Put;
      expected_price = 2.0;
    };
    {
      name = "Financial: OTM 3-month call";
      s0 = 50.0; k = 55.0; r = 0.04; sigma = 0.22; t = 0.25;
      option_type = `Call;
      expected_price = 0.8;
    };
  ] in
  
  List.iter test_scenario scenarios

let test_index_options () =
  Printf.printf "\n╔════════════════════════════════════════════════╗\n";
  Printf.printf "║           Index Options (SPX-like)             ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  
  let scenarios = [
    {
      name = "SPX: ATM monthly put";
      s0 = 4500.0; k = 4500.0; r = 0.045; sigma = 0.15; t = 0.0833;
      option_type = `Put;
      expected_price = 75.0;
    };
    {
      name = "SPX: ITM 2-month call";
      s0 = 4600.0; k = 4500.0; r = 0.045; sigma = 0.15; t = 0.167;
      option_type = `Call;
      expected_price = 140.0;
    };
    {
      name = "SPX: OTM 6-month put (hedge)";
      s0 = 4500.0; k = 4000.0; r = 0.045; sigma = 0.18; t = 0.5;
      option_type = `Put;
      expected_price = 120.0;
    };
  ] in
  
  List.iter test_scenario scenarios

let test_extreme_markets () =
  Printf.printf "\n╔════════════════════════════════════════════════╗\n";
  Printf.printf "║         Extreme Market Conditions              ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  
  let scenarios = [
    {
      name = "Market crash: High vol protective put";
      s0 = 100.0; k = 90.0; r = 0.02; sigma = 0.60; t = 0.25;
      option_type = `Put;
      expected_price = 10.0;
    };
    {
      name = "Low rate environment";
      s0 = 100.0; k = 100.0; r = 0.01; sigma = 0.20; t = 1.0;
      option_type = `Call;
      expected_price = 9.0;
    };
    {
      name = "Momentum stock: High vol short-term";
      s0 = 200.0; k = 220.0; r = 0.045; sigma = 0.70; t = 0.167;
      option_type = `Call;
      expected_price = 18.0;
    };
  ] in
  
  List.iter test_scenario scenarios

let test_earnings_scenarios () =
  Printf.printf "\n╔════════════════════════════════════════════════╗\n";
  Printf.printf "║         Pre-Earnings Announcements             ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  
  let scenarios = [
    {
      name = "Week before earnings: Vol spike";
      s0 = 125.0; k = 125.0; r = 0.045; sigma = 0.55; t = 0.02;
      option_type = `Call;
      expected_price = 3.5;
    };
    {
      name = "Straddle component: ATM put";
      s0 = 125.0; k = 125.0; r = 0.045; sigma = 0.55; t = 0.02;
      option_type = `Put;
      expected_price = 3.5;
    };
  ] in
  
  List.iter test_scenario scenarios

let print_summary () =
  Printf.printf "\n╔════════════════════════════════════════════════╗\n";
  Printf.printf "║              Test Summary                      ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  Printf.printf "\n  Key Findings:\n";
  Printf.printf "    • PDE solver handles diverse market conditions\n";
  Printf.printf "    • Prices match Black-Scholes within tolerance\n";
  Printf.printf "    • Accurate across volatility regimes\n";
  Printf.printf "    • Robust for different time horizons\n";
  Printf.printf "    • Reliable for various moneyness levels\n"

let main () =
  Printf.printf "\n";
  Printf.printf "╔════════════════════════════════════════════════╗\n";
  Printf.printf "║       Real-World Scenario Test Suite          ║\n";
  Printf.printf "║                                                ║\n";
  Printf.printf "║  Testing PDE solver with realistic market     ║\n";
  Printf.printf "║  parameters from various asset classes        ║\n";
  Printf.printf "╚════════════════════════════════════════════════╝\n";
  
  let start_time = Unix.gettimeofday () in
  
  test_tech_stocks ();
  test_traditional_stocks ();
  test_index_options ();
  test_extreme_markets ();
  test_earnings_scenarios ();
  
  print_summary ();
  
  let elapsed = Unix.gettimeofday () -. start_time in
  
  Printf.printf "\n";
  Printf.printf "╔════════════════════════════════════════════════╗\n";
  Printf.printf "║      ✓ All Real-World Scenarios PASSED        ║\n";
  Printf.printf "║      Elapsed time: %.2f seconds               ║\n" elapsed;
  Printf.printf "╚════════════════════════════════════════════════╝\n\n";
  
  exit 0

let () = main ()
