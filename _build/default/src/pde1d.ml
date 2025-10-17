(** One-dimensional PDE solver for European options *)

let solve_european ~params ~grid ~payoff ~scheme =
  let n_s = grid.Grid.n_s in
  let dt = Grid.dt grid params.Bs_params.t in
  let ds = Grid.ds grid in
  let theta = Time_stepper.theta scheme in
  
  (* Initialize solution vector with terminal payoff *)
  let solution = Array.make (n_s + 1) 0.0 in
  for i = 0 to n_s do
    let s_i = Grid.s_at grid i in
    solution.(i) <- Payoff.terminal payoff ~k:params.Bs_params.k s_i;
  done;
  
  (* Special case: if no time steps, return terminal payoff *)
  if grid.Grid.n_t = 0 then solution
  else (
    (* Time-marching loop: backward from T to 0 *)
    for time_step = 1 to grid.Grid.n_t do
      let tau = Float.of_int time_step *. dt in
      
      (* Handle trivial case: only boundary nodes *)
      if n_s <= 1 then (
        let left_bc = Bcs.left_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k ~tau in
        let right_bc = Bcs.right_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k 
                         ~s_max:grid.Grid.s_max ~tau in
        solution.(0) <- left_bc;
        if n_s = 1 then solution.(1) <- right_bc;
      ) else (
        (* Assemble tridiagonal system for interior nodes (i = 1 to n_s-1) *)
        let interior_size = n_s - 1 in
        let a = Array.make interior_size 0.0 in  (* sub-diagonal *)
        let b = Array.make interior_size 0.0 in  (* main diagonal *)
        let c = Array.make interior_size 0.0 in  (* super-diagonal *)
        let d = Array.make interior_size 0.0 in  (* RHS *)
        
        (* Fill tridiagonal system for interior nodes *)
        for i = 1 to n_s - 1 do
          let s_i = Grid.s_at grid i in
          let idx = i - 1 in  (* Array index (0-based) *)
          
          (* PDE coefficients for L*V at node i where L is the Black-Scholes operator *)
          (* L*V = (1/2)*σ²*S²*V_SS + r*S*V_S - r*V *)
          let sigma_sq = params.Bs_params.sigma *. params.Bs_params.sigma in
          let r = params.Bs_params.r in
          
          (* Finite difference coefficients for L*V_i = alpha*V_{i-1} + beta*V_i + gamma*V_{i+1} *)
          let alpha_i = 0.5 *. sigma_sq *. s_i *. s_i /. (ds *. ds) -. 0.5 *. r *. s_i /. ds in
          let beta_i = -. sigma_sq *. s_i *. s_i /. (ds *. ds) -. r in
          let gamma_i = 0.5 *. sigma_sq *. s_i *. s_i /. (ds *. ds) +. 0.5 *. r *. s_i /. ds in
          
          (* LHS matrix: (I - theta*dt*L) *)
          a.(idx) <- -. theta *. dt *. alpha_i;
          b.(idx) <- 1.0 -. theta *. dt *. beta_i;
          c.(idx) <- -. theta *. dt *. gamma_i;
          
          (* RHS vector: (I + (1-theta)*dt*L)*u^n *)
          let rhs_contrib = 
            solution.(i) +. (1.0 -. theta) *. dt *. (
              alpha_i *. solution.(i-1) +. beta_i *. solution.(i) +. gamma_i *. solution.(i+1)
            ) in
          d.(idx) <- rhs_contrib;
        done;
        
        (* Apply boundary conditions *)
        let left_bc = Bcs.left_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k ~tau in
        let right_bc = Bcs.right_value payoff ~r:params.Bs_params.r ~k:params.Bs_params.k 
                         ~s_max:grid.Grid.s_max ~tau in
        
        (* Adjust RHS for boundary conditions *)
        (* Left boundary contribution to first interior node (i=1) *)
        d.(0) <- d.(0) -. a.(0) *. left_bc;
        
        (* Right boundary contribution to last interior node (i=n_s-1) *)
        d.(interior_size - 1) <- d.(interior_size - 1) -. c.(interior_size - 1) *. right_bc;
        
        (* Solve tridiagonal system *)
        let interior_solution = Tridiag.solve ~a ~b ~c ~d in
        
        (* Update solution vector *)
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
  
  (* Validate input *)
  if Array.length values <> n_s + 1 then
    invalid_arg (Printf.sprintf "Values array length %d doesn't match grid size %d" 
                 (Array.length values) (n_s + 1));
  
  if not (Float.is_finite s) then
    invalid_arg "Asset price for interpolation must be finite";
  
  (* Find bracketing indices *)
  let i = Grid.find_bracketing_index grid s in
  
  (* Handle boundary cases *)
  if s <= Grid.s_at grid 0 then
    values.(0)
  else if s >= Grid.s_at grid n_s then
    values.(n_s)
  else
    (* Linear interpolation between grid points *)
    let s_i = Grid.s_at grid i in
    let s_i_plus_1 = Grid.s_at grid (i + 1) in
    let weight = (s -. s_i) /. (s_i_plus_1 -. s_i) in
    values.(i) *. (1.0 -. weight) +. values.(i + 1) *. weight