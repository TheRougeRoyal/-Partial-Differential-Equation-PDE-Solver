#!/bin/bash
# Comprehensive test runner for PDE Solver project
# Usage: ./run_tests.sh [quick|full|convergence|edge|real-world]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     PDE Solver Comprehensive Test Suite       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Set up OCaml environment
eval $(opam env)

# Determine which tests to run
TEST_MODE="${1:-full}"

case $TEST_MODE in
  quick)
    echo -e "${YELLOW}Running Quick Tests (< 5 seconds)...${NC}"
    echo ""
    dune exec test_smoke
    dune exec test_math
    dune exec test_params_grid
    dune exec test_pde_integration
    echo ""
    echo -e "${GREEN}✓ Quick tests completed successfully!${NC}"
    ;;
    
  convergence)
    echo -e "${YELLOW}Running Convergence Tests...${NC}"
    echo ""
    dune exec test_convergence
    ;;
    
  edge)
    echo -e "${YELLOW}Running Edge Case Tests...${NC}"
    echo ""
    dune exec test_edge_cases
    ;;
    
  real-world)
    echo -e "${YELLOW}Running Real-World Scenario Tests...${NC}"
    echo ""
    dune exec test_real_world
    ;;
    
  full)
    echo -e "${YELLOW}Running Full Test Suite...${NC}"
    echo ""
    echo -e "${BLUE}[1/8] Smoke tests...${NC}"
    dune exec test_smoke || { echo -e "${RED}✗ Smoke tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[2/8] Mathematical module tests...${NC}"
    dune exec test_math || { echo -e "${RED}✗ Math tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[3/8] Parameter and grid tests...${NC}"
    dune exec test_params_grid || { echo -e "${RED}✗ Params/grid tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[4/8] Integration tests...${NC}"
    dune exec test_pde_integration || { echo -e "${RED}✗ Integration tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[5/8] CLI integration tests...${NC}"
    dune exec test_cli || { echo -e "${RED}✗ CLI tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[6/8] Convergence tests...${NC}"
    dune exec test_convergence || { echo -e "${RED}✗ Convergence tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[7/8] Edge case tests...${NC}"
    dune exec test_edge_cases || { echo -e "${RED}✗ Edge case tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${BLUE}[8/8] Real-world scenario tests...${NC}"
    dune exec test_real_world || { echo -e "${RED}✗ Real-world tests failed${NC}"; exit 1; }
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✓ ALL TESTS PASSED SUCCESSFULLY!          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    ;;
    
  *)
    echo -e "${RED}Unknown test mode: $TEST_MODE${NC}"
    echo ""
    echo "Usage: ./run_tests.sh [quick|full|convergence|edge|real-world]"
    echo ""
    echo "Test modes:"
    echo "  quick       - Run fast tests only (< 5 seconds)"
    echo "  full        - Run complete test suite (default)"
    echo "  convergence - Run convergence analysis tests"
    echo "  edge        - Run edge case and boundary tests"
    echo "  real-world  - Run real-world scenario tests"
    exit 1
    ;;
esac

echo ""
