type trend = Bullish | Bearish | Neutral

type signal = {
  trend: trend;
  strength: float;
  momentum: float;
  mean_reversion_score: float;
}

let moving_average data window =
  let n = Array.length data in
  if n < window then [||]
  else
    Array.init (n - window + 1) (fun i ->
      let sum = ref 0.0 in
      for j = i to i + window - 1 do
        sum := !sum +. data.(j)
      done;
      !sum /. float_of_int window
    )

let rsi data period =
  let n = Array.length data in
  if n < period + 1 then [||]
  else begin
    let changes = Array.init (n - 1) (fun i -> data.(i + 1) -. data.(i)) in
    let gains = Array.map (fun x -> if x > 0.0 then x else 0.0) changes in
    let losses = Array.map (fun x -> if x < 0.0 then -.x else 0.0) changes in
    
    let avg_gain = ref 0.0 in
    let avg_loss = ref 0.0 in
    
    for i = 0 to period - 1 do
      avg_gain := !avg_gain +. gains.(i);
      avg_loss := !avg_loss +. losses.(i)
    done;
    
    avg_gain := !avg_gain /. float_of_int period;
    avg_loss := !avg_loss /. float_of_int period;
    
    let rsi_values = ref [] in
    
    for i = period to n - 2 do
      avg_gain := (!avg_gain *. float_of_int (period - 1) +. gains.(i)) /. float_of_int period;
      avg_loss := (!avg_loss *. float_of_int (period - 1) +. losses.(i)) /. float_of_int period;
      
      let rs = if !avg_loss = 0.0 then 100.0 else !avg_gain /. !avg_loss in
      let rsi = 100.0 -. (100.0 /. (1.0 +. rs)) in
      rsi_values := rsi :: !rsi_values
    done;
    
    Array.of_list (List.rev !rsi_values)
  end

let bollinger_bands data window std_dev =
  let ma = moving_average data window in
  let n = Array.length ma in
  
  let upper = Array.make n 0.0 in
  let lower = Array.make n 0.0 in
  
  for i = 0 to n - 1 do
    let slice = Array.sub data i window in
    let mean = ma.(i) in
    let variance = Array.fold_left (fun acc x -> 
      acc +. (x -. mean) ** 2.0
    ) 0.0 slice /. float_of_int window in
    let std = Float.sqrt variance in
    
    upper.(i) <- mean +. std_dev *. std;
    lower.(i) <- mean -. std_dev *. std
  done;
  
  (ma, upper, lower)

let analyze_signal market_data =
  let closes = Array.map (fun dp -> dp.Market_data.close) market_data.Market_data.data in
  let n = Array.length closes in
  
  if n < 50 then
    { trend = Neutral; strength = 0.0; momentum = 0.0; mean_reversion_score = 0.0 }
  else begin
    let ma_short = moving_average closes 10 in
    let ma_long = moving_average closes 50 in
    
    let current_price = closes.(n - 1) in
    let short_ma = ma_short.(Array.length ma_short - 1) in
    let long_ma = ma_long.(Array.length ma_long - 1) in
    
    let trend = 
      if short_ma > long_ma *. 1.02 then Bullish
      else if short_ma < long_ma *. 0.98 then Bearish
      else Neutral in
    
    let strength = Float.abs ((short_ma -. long_ma) /. long_ma) in
    
    let rsi_values = rsi closes 14 in
    let current_rsi = if Array.length rsi_values > 0 
      then rsi_values.(Array.length rsi_values - 1) 
      else 50.0 in
    
    let momentum = (current_rsi -. 50.0) /. 50.0 in
    
    let (_, upper, lower) = bollinger_bands closes 20 2.0 in
    let bb_position = 
      if Array.length upper > 0 then
        let u = upper.(Array.length upper - 1) in
        let l = lower.(Array.length lower - 1) in
        (current_price -. l) /. (u -. l)
      else 0.5 in
    
    let mean_reversion_score = 
      if bb_position > 0.8 then 1.0 -. bb_position
      else if bb_position < 0.2 then bb_position
      else 0.5 in
    
    { trend; strength; momentum; mean_reversion_score }
  end
