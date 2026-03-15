# PDE Solver Platform: Software Engineering Documentation

## Overview

This repository contains a quantitative pricing platform with three main parts:
- OCaml PDE engine for option pricing and analytics
- Node.js/TypeScript bridge service for API and WebSocket access
- React/Vite frontend dashboard for visualization and operations

The project supports local development, quality checks, and production-style deployment workflows.

## System Architecture

- `src/`: OCaml core modules (pricing, calibration, analytics, numerical methods)
- `bin/`: OCaml executables and CLI-style entry points
- `test/`: OCaml test programs
- `ocaml-quant-dashboard/bridge/`: Express + WebSocket backend service
- `ocaml-quant-dashboard/frontend/`: React dashboard frontend
- `_build/`: Dune artifacts

Data flow:
1. OCaml engine computes pricing/analytics outputs
2. Bridge exposes data via REST and WebSocket
3. Frontend consumes APIs and displays dashboards

## Engineering Prerequisites

- Linux environment
- OCaml toolchain with `dune`
- Node.js and npm

## Setup

From repository root:

```bash
npm install
dune build
```

## Development Workflow

```bash
# Run frontend + bridge in development
npm run dev

# Run only frontend
npm run dev:frontend

# Run only bridge
npm run dev:bridge
```

OCaml-only operations:

```bash
dune build
dune runtest
```

## Quality Gates

Primary quality command:

```bash
npm run check
```

This runs:
1. `dune build`
2. Bridge lint/type check (`tsc --noEmit`)
3. Frontend lint (`eslint src --ext js,jsx`)
4. Bridge production build
5. Frontend production build

Additional commands:

```bash
npm run lint
npm run build:bridge
npm run build:frontend
```

## Runtime Services

### Bridge

Start bridge service:

```bash
cd ocaml-quant-dashboard/bridge
npm start
```

Defaults:
- API: `http://localhost:3001/api/v1`
- Health: `http://localhost:3001/api/v1/health`
- WebSocket: `ws://localhost:3001/ws/live`

Environment variables:
- `PORT`
- `DATA_DIR`
- `OCAML_BIN_DIR`

### Frontend

```bash
cd ocaml-quant-dashboard/frontend
npm run build
npm run preview
```

## API Endpoints (Bridge)

- `GET /api/v1/health`
- `GET /api/v1/backtests`
- `GET /api/v1/predictions`
- `GET /api/v1/greeks`
- `GET /api/v1/filters`
- `GET /api/v1/metrics`
- `GET /api/v1/prediction-accuracy`
- `POST /api/v1/upload`
- `GET /api/v1/uploads`
- `GET /api/v1/uploads/:id`
- `POST /api/v1/live-update`
- `POST /api/v1/cache/clear`
- `POST /api/v1/pricing`

## Deployment Runbook

Recommended server procedure:

```bash
cd /path/to/-Partial-Differential-Equation-PDE-Solver
npm install
dune build
npm run check
npm run build:bridge
npm run build:frontend
cd ocaml-quant-dashboard/bridge
npm start
```

Suggested production process management:
- `systemd` or `pm2` for bridge supervision
- Reverse proxy (for example Nginx) for frontend/static and API routing

## Operations and Validation

Health check:

```bash
curl -sS http://localhost:3001/api/v1/health
```

Expected response includes `"success": true` and healthy status.

## Engineering Notes

- Frontend lint currently emits warnings but no blocking errors.
- Vite may warn about bundle chunk size; build output remains deployable.
- Ensure OCaml pricing executable is available in `_build/default/bin` before using `/api/v1/pricing`.
