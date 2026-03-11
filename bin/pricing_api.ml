open Pde_opt

(* JSON pricing binary - reads params from stdin JSON, outputs JSON result *)

let () =
  let input = Stdlib.input_line stdin in
  let json = Yojson.Basic.from_string input in
  let open Yojson.Basic.Util in
  
  (* Helper to handle both int and float JSON values *)
  let to_number j = match j with
    | `Int i -> float_of_int i
    | `Float f -> f
    | _ -> raise (Type_error ("Expected number", j))
  in
  
  let spot = json |> member "spot" |> to_number in
  let strike = json |> member "strike" |> to_number in
  let maturity = json |> member "maturity" |> to_number in
  let rate = json |> member "rate" |> to_number in
  let volatility = json |> member "volatility" |> to_number in
  let option_type_str = json |> member "optionType" |> to_string in
  let scheme_str = json |> member "scheme" |> to_string_option |> Option.value ~default:"CN" in
  
  let option_type = match String.lowercase_ascii option_type_str with
    | "call" -> Pricing.Call
    | "put" -> Pricing.Put
    | _ -> Pricing.Call
  in
  
  let scheme = match String.uppercase_ascii scheme_str with
    | "BE" | "backward-euler" -> `BE
    | _ -> `CN
  in
  
  let input_params = Pricing.{
    spot;
    strike;
    maturity;
    rate;
    volatility;
    option_type;
  } in
  
  try
    let result = Pricing.price_option ~scheme input_params in
    
    let rho = 
      (* Compute rho: sensitivity to interest rate *)
      let dr = 0.0001 in
      let params_up = Pricing.{ input_params with rate = rate +. dr } in
      let result_up = Pricing.price_option ~scheme params_up in
      (result_up.Pricing.price -. result.Pricing.price) /. dr /. 100.0
    in
    
    let output = `Assoc [
      ("success", `Bool true);
      ("pdePrice", `Float result.Pricing.price);
      ("analyticPrice", `Float result.Pricing.analytic_price);
      ("error", `Float (result.Pricing.error /. result.Pricing.analytic_price *. 100.0));
      ("greeks", `Assoc [
        ("delta", `Float result.Pricing.delta);
        ("gamma", `Float result.Pricing.gamma);
        ("theta", `Float result.Pricing.theta);
        ("vega", `Float result.Pricing.vega);
        ("rho", `Float rho);
      ]);
    ] in
    
    print_string (Yojson.Basic.to_string output);
    print_newline ()
  with
  | Invalid_argument msg ->
    let error = `Assoc [
      ("success", `Bool false);
      ("error", `String msg);
    ] in
    print_string (Yojson.Basic.to_string error);
    print_newline ()
  | exn ->
    let error = `Assoc [
      ("success", `Bool false);
      ("error", `String (Printexc.to_string exn));
    ] in
    print_string (Yojson.Basic.to_string error);
    print_newline ()
