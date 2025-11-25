let solve ~a ~b ~c ~d =
  let n = Array.length d in
  
  if Array.length a <> n || Array.length b <> n || Array.length c <> n then
    invalid_arg (Printf.sprintf "Array length mismatch: a=%d, b=%d, c=%d, d=%d" 
                 (Array.length a) (Array.length b) (Array.length c) n);
  
  if n = 0 then
    invalid_arg "Cannot solve empty system";
  
  Array.iteri (fun i x -> 
    if not (Float.is_finite x) then
      invalid_arg (Printf.sprintf "Non-finite value in array a at index %d" i)
  ) a;
  Array.iteri (fun i x -> 
    if not (Float.is_finite x) then
      invalid_arg (Printf.sprintf "Non-finite value in array b at index %d" i)
  ) b;
  Array.iteri (fun i x -> 
    if not (Float.is_finite x) then
      invalid_arg (Printf.sprintf "Non-finite value in array c at index %d" i)
  ) c;
  Array.iteri (fun i x -> 
    if not (Float.is_finite x) then
      invalid_arg (Printf.sprintf "Non-finite value in array d at index %d" i)
  ) d;
  
  if n = 1 then (
    if b.(0) = 0.0 then
      invalid_arg "Singular system: b[0] = 0";
    [| d.(0) /. b.(0) |]
  ) else (
    let c_prime = Array.copy c in
    let d_prime = Array.copy d in
    let x = Array.make n 0.0 in
    
    if b.(0) = 0.0 then
      invalid_arg "Singular system: b[0] = 0";
    
    c_prime.(0) <- c.(0) /. b.(0);
    d_prime.(0) <- d.(0) /. b.(0);
    
    for i = 1 to n - 1 do
      let denom = b.(i) -. a.(i) *. c_prime.(i - 1) in
      if denom = 0.0 then
        invalid_arg (Printf.sprintf "Singular system at row %d" i);
      
      if i < n - 1 then
        c_prime.(i) <- c.(i) /. denom;
      d_prime.(i) <- (d.(i) -. a.(i) *. d_prime.(i - 1)) /. denom;
    done;
    
    x.(n - 1) <- d_prime.(n - 1);
    for i = n - 2 downto 0 do
      x.(i) <- d_prime.(i) -. c_prime.(i) *. x.(i + 1);
    done;
    
    x
  )