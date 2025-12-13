import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Prediction {
  timestamp: string;
  asset: string;
  predicted_price: number;
  confidence: number;
  model: string;
}

interface Greek {
  timestamp: string;
  asset: string;
  option_id: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface Backtest {
  timestamp: string;
  asset: string;
  predicted_price: number;
  actual_price: number;
  pnl: number;
  equity: number;
}

function App() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [greeks, setGreeks] = useState<Greek[]>([]);
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [activeTab, setActiveTab] = useState('predictions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [predRes, greeksRes, backtestRes] = await Promise.all([
        fetch('/api/v1/predictions'),
        fetch('/api/v1/greeks'),
        fetch('/api/v1/backtests')
      ]);

      if (predRes.ok) {
        const data = await predRes.json();
        setPredictions(data.data || []);
      }
      
      if (greeksRes.ok) {
        const data = await greeksRes.json();
        setGreeks(data.data || []);
      }
      
      if (backtestRes.ok) {
        const data = await backtestRes.json();
        setBacktests(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-blue-400">📊 OCaml Quant Dashboard</h1>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['predictions', 'greeks', 'backtests'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Price Predictions ({predictions.length})</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={predictions.map(p => ({ date: p.timestamp.split(' ')[0], price: p.predicted_price }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#3B82F6" name="Predicted Price" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {predictions.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">{p.timestamp}</td>
                      <td className="px-4 py-3 text-sm font-medium">{p.asset}</td>
                      <td className="px-4 py-3 text-sm text-right">${p.predicted_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right">{(p.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'greeks' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Greeks Analysis ({greeks.length})</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={greeks.map(g => ({ date: g.timestamp.split(' ')[0], delta: g.delta, gamma: g.gamma * 100, vega: g.vega }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="delta" stroke="#3B82F6" name="Delta" />
                  <Line type="monotone" dataKey="gamma" stroke="#10B981" name="Gamma (×100)" />
                  <Line type="monotone" dataKey="vega" stroke="#F59E0B" name="Vega" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Delta</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Gamma</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Theta</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Vega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {greeks.map((g, i) => (
                    <tr key={i} className="hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">{g.timestamp}</td>
                      <td className="px-4 py-3 text-sm font-medium">{g.asset}</td>
                      <td className="px-4 py-3 text-sm text-right">{g.delta.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right">{g.gamma.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right">{g.theta.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right">{g.vega.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'backtests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Total PnL</h3>
                <p className="text-3xl font-bold text-green-400">
                  ${backtests.reduce((sum, b) => sum + b.pnl, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Final Equity</h3>
                <p className="text-3xl font-bold text-blue-400">
                  ${backtests.length > 0 ? backtests[backtests.length - 1].equity.toFixed(2) : '0'}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Trades</h3>
                <p className="text-3xl font-bold text-purple-400">{backtests.length}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Equity Curve</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={backtests.map(b => ({ date: b.timestamp.split(' ')[0], equity: b.equity, pnl: b.pnl }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Legend />
                  <Line type="monotone" dataKey="equity" stroke="#3B82F6" name="Equity" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Asset</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Predicted</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actual</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">PnL</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Equity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {backtests.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">{b.timestamp}</td>
                      <td className="px-4 py-3 text-sm font-medium">{b.asset}</td>
                      <td className="px-4 py-3 text-sm text-right">${b.predicted_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right">${b.actual_price.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${b.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${b.pnl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">${b.equity.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
