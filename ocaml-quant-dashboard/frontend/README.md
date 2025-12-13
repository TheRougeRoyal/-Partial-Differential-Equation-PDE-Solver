# OCaml Quant Dashboard - Frontend

A modern React dashboard for visualizing quantitative finance data from the OCaml PDE solver.

## Features

- 📊 **Dashboard** - Overview of predictions, metrics, and accuracy charts
- 📈 **Greeks Analysis** - Visualize option Greeks (Delta, Gamma, Theta, Vega, Rho) over time
- 📉 **Backtesting** - View backtest results, equity curves, and performance metrics
- 🔴 **Live Monitor** - Real-time WebSocket updates for live predictions
- 📁 **Data Explorer** - Browse, filter, upload, and export CSV data

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components (based on Radix UI)
- **Recharts** - Data visualization
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── Layout.tsx    # Main layout with sidebar
│   ├── hooks/
│   │   ├── useData.ts    # Data fetching hooks
│   │   └── useWebSocket.ts # WebSocket connection
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── GreeksPage.tsx
│   │   ├── BacktestPage.tsx
│   │   ├── LiveMonitorPage.tsx
│   │   └── DataExplorerPage.tsx
│   ├── types/
│   │   └── index.ts      # TypeScript interfaces
│   ├── utils/
│   │   ├── api.ts        # API functions
│   │   └── format.ts     # Formatting utilities
│   ├── lib/
│   │   └── utils.ts      # cn() utility for class merging
│   ├── App.tsx           # Main app with routes
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles + Tailwind
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## API Integration

The frontend connects to the bridge server at `http://localhost:3001`. Update the Vite config proxy if your bridge runs on a different port.

### Endpoints Used

- `GET /api/v1/backtests` - Backtest results
- `GET /api/v1/predictions` - Price predictions
- `GET /api/v1/greeks` - Greeks data
- `GET /api/v1/filters` - Available assets/models
- `GET /api/v1/metrics` - Summary metrics
- `POST /api/v1/upload` - Upload CSV files
- `WS /ws/live` - Real-time updates

## Customization

### Theme

The app uses shadcn/ui's theming system with CSS variables. Edit `src/index.css` to customize colors:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### Adding Components

To add more shadcn/ui components, install them manually:

```bash
# Example: Add Dialog component
npm install @radix-ui/react-dialog
```

Then create the component in `src/components/ui/`.

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## License

MIT
