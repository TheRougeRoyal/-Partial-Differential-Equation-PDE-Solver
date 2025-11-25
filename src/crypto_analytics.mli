type trend = Bullish | Bearish | Neutral

type signal = {
  trend: trend;
  strength: float;
  momentum: float;
  mean_reversion_score: float;
}

val moving_average : float array -> int -> float array

val rsi : float array -> int -> float array

val bollinger_bands : float array -> int -> float -> (float array * float array * float array)

val analyze_signal : Market_data.t -> signal
