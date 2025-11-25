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

val parse_csv : string -> t

val daily_returns : t -> float array

val realized_volatility : window_days:int -> t -> float

val ewma_volatility : lambda:float -> t -> float

val average_drift : t -> float

val price_statistics : t -> float * float * float * float

val latest_close : t -> float

val date_range : t -> string * string
