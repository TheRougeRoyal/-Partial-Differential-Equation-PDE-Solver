import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout/Layout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { PortfolioPage } from './pages/Portfolio/PortfolioPage';
import { OptionsPage } from './pages/Options/OptionsPage';
import { PricingPage } from './pages/Pricing/PricingPage';
import { SignalsPage } from './pages/Signals/SignalsPage';
import { OrdersPage } from './pages/Orders/OrdersPage';
import { BacktestPage } from './pages/Backtest/BacktestPage';
import { LivePage } from './pages/Live/LivePage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/options" element={<OptionsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/live" element={<LivePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
