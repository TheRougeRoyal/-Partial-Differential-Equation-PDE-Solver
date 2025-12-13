import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3,
  RefreshCw 
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getBacktests, getFilters, getMetrics } from '@/utils/api';
import type { BacktestRecord, Filters, Metrics } from '@/types';

export function BacktestPage() {
  const [backtests, setBacktests] = useState<BacktestRecord[]>([]);
  const [filters, setFilters] = useState<Filters>({ assets: [], models: [], experiments: [] });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        asset: selectedAsset || undefined,
        model: selectedModel || undefined,
        experiment_id: selectedExperiment || undefined,
      };

      const [filtersRes, backtestsRes, metricsRes] = await Promise.all([
        getFilters(),
        getBacktests(params),
        getMetrics(params),
      ]);

      if (filtersRes.success) setFilters(filtersRes.data);
      if (backtestsRes.success) setBacktests(backtestsRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAsset, selectedModel, selectedExperiment]);

  const equityData = backtests.map((record) => ({
    time: new Date(record.timestamp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit' 
    }),
    equity: record.equity,
  }));

  const drawdownData = backtests.map((record) => ({
    time: new Date(record.timestamp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit' 
    }),
    drawdown: -record.drawdown * 100,
  }));

  const startEquity = backtests[0]?.equity ?? 100000;
  const endEquity = backtests[backtests.length - 1]?.equity ?? 100000;
  const isPositive = endEquity >= startEquity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Backtest Results</h2>
          <p className="text-muted-foreground">
            Performance analysis and equity curves from backtesting
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Assets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Assets</SelectItem>
              {filters.assets.map((asset) => (
                <SelectItem key={asset} value={asset}>{asset}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Models</SelectItem>
              {filters.models.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedExperiment} onValueChange={setSelectedExperiment}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Experiments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Experiments</SelectItem>
              {filters.experiments.map((exp) => (
                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            {(metrics?.totalReturn ?? 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.totalReturn ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.totalReturn ?? 0) >= 0 ? '+' : ''}{metrics?.totalReturn.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Sortino: {metrics?.sortinoRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{metrics?.maxDrawdown.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalTrades} trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>
            Portfolio value over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {equityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke={isPositive ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)'}
                    fill="url(#equityGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Drawdown</CardTitle>
          <CardDescription>
            Peak-to-trough decline over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {drawdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={drawdownData}>
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="hsl(0 84.2% 60.2%)"
                    fill="url(#drawdownGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg P&L</p>
              <p className={`text-lg font-semibold ${(metrics?.avgPnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${metrics?.avgPnl.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-lg font-semibold">{metrics?.totalTrades}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <Badge variant={(metrics?.winRate ?? 0) > 50 ? 'success' : 'destructive'}>
                {metrics?.winRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sharpe</p>
              <p className="text-lg font-semibold">{metrics?.sharpeRatio.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sortino</p>
              <p className="text-lg font-semibold">{metrics?.sortinoRatio.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Max DD</p>
              <p className="text-lg font-semibold text-red-600">-{metrics?.maxDrawdown.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
