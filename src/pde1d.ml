let solve_european ~params ~grid ~payoff ~scheme =
  let n_s = grid.Grid.n_s in
  let dt = Grid.dt grid params.Bs_params.t in
  let ds = Grid.ds grid in
  let theta = Time_stepper.theta scheme in
  
  let solution = Array.make (n_s + 1) 0.0 in
  for i = 0 to n_s do
    let s_i = Grid.s_at grid i in
    solution.(i) <- Payoff.terminal payoff ~k:params.Bs_params.k s_i;
  done;
  
  if grid.Grid.n_t = 0 then solution
  else (
    for time_step = 1 to grid.Grid.n_t do
      let tau = Float.of_int time_step *. dt in
      
      if n_s <= 1 then (
        let left_bc = Bcs.left_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k ~tau in
        let right_bc = Bcs.right_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k 
                         ~s_max:grid.Grid.s_max ~tau in
        solution.(0) <- left_bc;
        if n_s = 1 then solution.(1) <- right_bc;
      ) else (
        let interior_size = n_s - 1 in
        let a = Array.make interior_size 0.0 in
        let b = Array.make interior_size 0.0 in
        let c = Array.make interior_size 0.0 in
        let d = Array.make interior_size 0.0 in
        
        for i = 1 to n_s - 1 do
          let s_i = Grid.s_at grid i in
          let idx = i - 1 in
          
          let sigma_sq = params.Bs_params.sigma *. params.Bs_params.sigma in
          let r = params.Bs_params.r in
          
          let alpha_i = 0.5 *. sigma_sq *. s_i *. s_i /. (ds *. ds) -. 0.5 *. r *. s_i /. ds in
          let beta_i = -. sigma_sq *. s_i *. s_i /. (ds *. ds) -. r in
          let gamma_i = 0.5 *. sigma_sq *. s_i *. s_i /. (ds *. ds) +. 0.5 *. r *. s_i /. ds in
          
          a.(idx) <- -. theta *. dt *. alpha_i;
          b.(idx) <- 1.0 -. theta *. dt *. beta_i;
          c.(idx) <- -. theta *. dt *. gamma_i;
          
          let rhs_contrib = 
            solution.(i) +. (1.0 -. theta) *. dt *. (
              alpha_i *. solution.(i-1) +. beta_i *. solution.(i) +. gamma_i *. solution.(i+1)
            ) in
          d.(idx) <- rhs_contrib;
        done;
        
        let left_bc = Bcs.left_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k ~tau in
        let right_bc = Bcs.right_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k 
                         ~s_max:grid.Grid.s_max ~tau in
        
        d.(0) <- d.(0) -. a.(0) *. left_bc;
        d.(interior_size - 1) <- d.(interior_size - 1) -. c.(interior_size - 1) *. right_bc;
        
        let interior_solution = Tridiag.solve ~a ~b ~c ~d in
        
        solution.(0) <- left_bc;
        for i = 1 to n_s - 1 do
          solution.(i) <- interior_solution.(i - 1);
        done;
        solution.(n_s) <- right_bc;
      )
    done;
    
    solution
  )

let interpolate_at ~grid ~values ~s =
  let n_s = grid.Grid.n_s in
  
  if Array.length values <> n_s + 1 then
    invalid_arg (Printf.sprintf "Values array length %d doesn't match grid size %d" 
                 (Array.length values) (n_s + 1));
  
  if not (Float.is_finite s) then
    invalid_arg "Asset price for interpolation must be finite";
  
  let i = Grid.find_bracketing_index grid s in
  
  if s <= Grid.s_at grid 0 then
    values.(0)
  else if s >= Grid.s_at grid n_s then
    values.(n_s)
  else
    let s_i = Grid.s_at grid i in
    let s_i_plus_1 = Grid.s_at grid (i + 1) in
    let weight = (s -. s_i) /. (s_i_plus_1 -. s_i) in
    values.(i) *. (1.0 -. weight) +. values.(i + 1) *. weight
