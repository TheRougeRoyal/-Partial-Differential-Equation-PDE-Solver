(** Market data parsing and analysis from CSV files *)

(** A single market data point *)
type data_point = {
  date: string;
  open_price: float;
  high: float;
  low: float;
  close: float;
  volume: int;
  turnover: float;
}

(** Historical market data series *)
type t = {
  symbol: string;
  data: data_point array;
}

(** Parse CSV file and return market data *)
val parse_csv : string -> t

(** Calculate daily log returns from close prices *)
val daily_returns : t -> float array

(** Calculate realized volatility over a given window (annualized)
    @param window_days number of days to use for calculation
    @param data_points market data
    @return annualized volatility estimate *)
val realized_volatility : window_days:int -> t -> float

(** Calculate exponentially weighted moving average (EWMA) volatility 
    @param lambda decay factor (typically 0.94 for daily data)
    @param t market data
    @return annualized EWMA volatility *)
val ewma_volatility : lambda:float -> t -> float

(** Calculate average daily return (drift) over the data period
    @param t market data
    @return annualized drift estimate *)
val average_drift : t -> float

(** Get price statistics from historical data
    @param t market data
    @return (min_price, max_price, mean_price, std_dev) *)
val price_statistics : t -> float * float * float * float

(** Get the most recent close price *)
val latest_close : t -> float

(** Get the date range of the data *)
val date_range : t -> string * string
