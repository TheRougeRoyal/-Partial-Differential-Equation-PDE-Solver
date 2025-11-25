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

val fetch : unit -> t

val get_price : string -> t -> float option

val get_latest : string -> float option

val to_market_data_point : live_price -> Market_data.data_point
