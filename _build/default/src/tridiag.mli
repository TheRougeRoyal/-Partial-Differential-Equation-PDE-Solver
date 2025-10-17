(** Tridiagonal linear system solver using Thomas algorithm.
    
    This module implements the Thomas algorithm for solving tridiagonal
    systems of the form:
    
    a[i]*x[i-1] + b[i]*x[i] + c[i]*x[i+1] = d[i]
    
    The algorithm has O(n) time complexity and is numerically stable
    for diagonally dominant matrices (common in PDE discretizations).
    
    Note: a[0] and c[n-1] are ignored as they correspond to non-existent
    elements in the tridiagonal structure. *)

(** [solve ~a ~b ~c ~d] solves the tridiagonal system Ax = d.
    
    Uses Thomas algorithm with forward elimination and backward substitution.
    The input arrays represent:
    - a: sub-diagonal (a[0] ignored)
    - b: main diagonal  
    - c: super-diagonal (c[n-1] ignored)
    - d: right-hand side vector
    
    @param a Sub-diagonal coefficients (length n)
    @param b Main diagonal coefficients (length n)  
    @param c Super-diagonal coefficients (length n)
    @param d Right-hand side vector (length n)
    @return Solution vector x (length n)
    @raise Invalid_argument if arrays have mismatched lengths or system is singular
    
    Complexity: O(n) time, O(n) space *)
val solve : a:float array -> b:float array -> c:float array -> d:float array -> float array