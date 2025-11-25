type live_price = {
  symbol: string;
  price: float;
  open_price: float;
  high: float;
  low: float;
  volume: float;
  timestamp: string;
}

type t = (string * live_price) list

let data_file = "tradingview_bridge/live_prices.json"

let parse_json_value json =
  let open Yojson.Basic.Util in
  {
    symbol = json |> member "symbol" |> to_string;
    price = json |> member "price" |> to_float;
    open_price = json |> member "open" |> to_float;
    high = json |> member "high" |> to_float;
    low = json |> member "low" |> to_float;
    volume = json |> member "volume" |> to_float;
    timestamp = json |> member "timestamp" |> to_string;
  }

let fetch () =
  if not (Sys.file_exists data_file) then
    []
  else
    try
      let json = Yojson.Basic.from_file data_file in
      let open Yojson.Basic.Util in
      json
      |> to_assoc
      |> List.map (fun (key, value) -> (key, parse_json_value value))
    with _ -> []

let get_price symbol prices =
  List.assoc_opt symbol prices
  |> Option.map (fun p -> p.price)

let get_latest symbol =
  let prices = fetch () in
  get_price symbol prices

let to_market_data_point live =
  Market_data.{
    date = live.timestamp;
    open_price = live.open_price;
    high = live.high;
    low = live.low;
    close = live.price;
    volume = int_of_float live.volume;
    turnover = 0.0;
  }
