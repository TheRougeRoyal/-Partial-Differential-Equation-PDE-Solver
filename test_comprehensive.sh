#!/bin/bash
echo "=========================================="
echo "Comprehensive PDE Solver Test Suite"
echo "=========================================="
echo ""

echo "Test 1: ATM Call (auto grid)"
dune exec pde_opt -- --s0 100 --k 100 --t 1.0 --r 0.05 --sigma 0.2 --payoff call --scheme CN --ns 200 --nt 200
echo ""

echo "Test 2: ATM Put (auto grid)"
dune exec pde_opt -- --s0 100 --k 100 --t 1.0 --r 0.05 --sigma 0.2 --payoff put --scheme CN --ns 200 --nt 200
echo ""

echo "Test 3: Deep ITM Call"
dune exec pde_opt -- --s0 200 --k 100 --t 1.0 --r 0.05 --sigma 0.2 --payoff call --scheme CN --ns 200 --nt 200
echo ""

echo "Test 4: Deep OTM Call"
dune exec pde_opt -- --s0 50 --k 100 --t 1.0 --r 0.05 --sigma 0.2 --payoff call --scheme CN --ns 200 --nt 200
echo ""

echo "Test 5: High volatility"
dune exec pde_opt -- --s0 100 --k 100 --t 1.0 --r 0.05 --sigma 0.4 --payoff call --scheme CN --ns 200 --nt 200
echo ""

echo "Test 6: Short expiry"
dune exec pde_opt -- --s0 100 --k 100 --t 0.25 --r 0.05 --sigma 0.2 --payoff call --scheme CN --ns 100 --nt 50
echo ""

echo "Test 7: BE vs CN"
echo "  Backward Euler:"
dune exec pde_opt -- --s0 100 --k 100 --t 1.0 --r 0.05 --sigma 0.2 --payoff call --scheme BE --ns 200 --nt 200
echo "  Crank-Nicolson:"
dune exec pde_opt -- --s0 100 --k 100 --t 1.0 --r 0.05 --sigma 0.2 --payoff call --scheme CN --ns 200 --nt 200
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
