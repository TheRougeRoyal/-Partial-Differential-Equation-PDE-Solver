type data_point = {
  date: string;
  open_price: float;
  high: float;
  low: float;
  close: float;
  volume: int;
  turnover: float;
}

type t = {
  symbol: string;
  data: data_point array;
}

let clean_numeric str =
  String.map (function ',' -> ' ' | c -> c) str
  |> String.trim

let parse_line line =
  let parts = String.split_on_char ',' line 
              |> List.map String.trim 
              |> Array.of_list in
  
  if Array.length parts < 9 then
    None
  else
    try
      Some {
        date = parts.(3);
        high = float_of_string (clean_numeric parts.(4));
        low = float_of_string (clean_numeric parts.(5));
        open_price = float_of_string (clean_numeric parts.(6));
        close = float_of_string (clean_numeric parts.(7));
        volume = int_of_float (float_of_string (clean_numeric parts.(8)));
        turnover = 0.0;
      }
    with _ -> None

let extract_symbol filename =
  let basename = Filename.basename filename in
  let without_ext = 
    try Filename.chop_extension basename 
    with Invalid_argument _ -> basename in
  match String.split_on_char '-' without_ext with
  | hd :: _ -> String.uppercase_ascii hd
  | [] -> "UNKNOWN"

let parse_csv filename =
  if not (Sys.file_exists filename) then
    invalid_arg (Printf.sprintf "CSV file not found: %s" filename);
  
  let ic = open_in filename in
  let lines = ref [] in
  
  try
    let _ = input_line ic in
    while true do
      let line = input_line ic in
      match parse_line line with
      | Some dp -> lines := dp :: !lines
      | None -> ()
    done;
    close_in ic;
    { symbol = extract_symbol filename; data = [||] }
  with End_of_file ->
    close_in ic;
    let data_array = Array.of_list (List.rev !lines) in
    { symbol = extract_symbol filename; data = data_array }

let daily_returns t =
  let n = Array.length t.data in
  if n < 2 then [||]
  else
    Array.init (n - 1) (fun i ->
      let price_today = t.data.(i + 1).close in
      let price_yesterday = t.data.(i).close in
      Float.log (price_today /. price_yesterday)
    )

let realized_volatility ~window_days t =
  let returns = daily_returns t in
  let n = Array.length returns in
  
  if n < window_days then
    invalid_arg (Printf.sprintf "Not enough data points (%d) for window size %d" n window_days);
  
  let start_idx = max 0 (n - window_days) in
  let windowed_returns = Array.sub returns start_idx (min window_days (n - start_idx)) in
  
  let sum = Array.fold_left (+.) 0.0 windowed_returns in
  let mean = sum /. float_of_int (Array.length windowed_returns) in
  
  let sum_sq_dev = Array.fold_left (fun acc r ->
    let dev = r -. mean in
    acc +. dev *. dev
  ) 0.0 windowed_returns in
  
  let variance = sum_sq_dev /. float_of_int (Array.length windowed_returns - 1) in
  let daily_vol = Float.sqrt variance in
  
  daily_vol *. Float.sqrt 252.0

let ewma_volatility ~lambda t =
  let returns = daily_returns t in
  let n = Array.length returns in
  
  if n < 2 then
    invalid_arg "Not enough data points for EWMA calculation";
  
  if lambda <= 0.0 || lambda >= 1.0 then
    invalid_arg (Printf.sprintf "Lambda must be in (0,1), got %g" lambda);
  
  let initial_var = returns.(0) *. returns.(0) in
  
  let final_var = ref initial_var in
  for i = 1 to n - 1 do
    let ret_sq = returns.(i) *. returns.(i) in
    final_var := lambda *. !final_var +. (1.0 -. lambda) *. ret_sq;
  done;
  
  let daily_vol = Float.sqrt !final_var in
  daily_vol *. Float.sqrt 252.0

let average_drift t =
  let returns = daily_returns t in
  let n = Array.length returns in
  
  if n < 1 then 0.0
  else
    let sum = Array.fold_left (+.) 0.0 returns in
    let daily_mean = sum /. float_of_int n in
    daily_mean *. 252.0

let price_statistics t =
  let n = Array.length t.data in
  if n = 0 then
    invalid_arg "No data available";
  
  let closes = Array.map (fun dp -> dp.close) t.data in
  
  let min_price = Array.fold_left Float.min Float.infinity closes in
  let max_price = Array.fold_left Float.max Float.neg_infinity closes in
  
  let sum = Array.fold_left (+.) 0.0 closes in
  let mean = sum /. float_of_int n in
  
  let sum_sq_dev = Array.fold_left (fun acc p ->
    let dev = p -. mean in
    acc +. dev *. dev
  ) 0.0 closes in
  
  let variance = sum_sq_dev /. float_of_int (n - 1) in
  let std_dev = Float.sqrt variance in
  
  (min_price, max_price, mean, std_dev)

let latest_close t =
  let n = Array.length t.data in
  if n = 0 then
    invalid_arg "No data available";
  t.data.(n - 1).close

let date_range t =
  let n = Array.length t.data in
  if n = 0 then
    invalid_arg "No data available";
  (t.data.(0).date, t.data.(n - 1).date)
