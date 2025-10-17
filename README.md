# Partial Differential Equation (PDE) Solver

Short description
A small PDE solver project (OCaml / Dune-based). Implements numerical methods to solve typical partial differential equations and provides example problems, build scripts, and tests.

## Features
- Basic solvers for common PDEs (heat, wave, Poisson) — implementations and examples
- Dune-based build system
- Example inputs and simple test harness

## Repository layout
- src/          — source code
- examples/     — example problem setups and input files
- tests/        — unit / example tests
- dune, dune-project — build configuration
- README.md     — this file

(Adjust paths above to match the actual tree if different.)

## Requirements
- Linux (development tested on Ubuntu)
- OCaml (>= 4.12 recommended)
- opam (OCaml package manager)
- dune (build system)
- pkg-config and any system libs required by dependencies

## Quick start (install prerequisites)
Install opam, OCaml and dune (Ubuntu example):
sudo apt update
sudo apt install -y opam build-essential pkg-config
opam init --reinit -y
opam switch create 4.14.0   # or desired OCaml version
eval $(opam env)
opam install dune core  # add other dependencies as required

## Build
From the project root:
dune build

To clean build artifacts:
dune clean

## Run
Run compiled binaries with dune:
dune exec ./src/<executable-name> -- [args]

Replace `<executable-name>` with the target built by dune (check dune files for exact names). Example:
dune exec ./src/solver.exe -- --config examples/heat.json

## Tests
If tests are present, run:
dune runtest

## Adding or modifying examples
- Place example input files in examples/
- Update README or examples/README.md with input descriptions
- Use provided CLI options (see source or --help) to point solver at example files

## Contributing
1. Fork the repository
2. Create a feature branch: git checkout -b feature/your-feature
3. Implement changes, add tests
4. Commit with clear messages and push
5. Open a PR and describe changes

Notes
- Update this README with specific solver details, algorithms, parameter descriptions, and example commands once the codebase specifics are finalized.
