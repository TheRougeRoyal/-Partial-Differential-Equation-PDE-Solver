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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity,
  RefreshCw 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { getBacktests, getFilters, getMetrics, getPredictionAccuracy } from '@/utils/api';
import type { BacktestRecord, Filters, Metrics, PredictionAccuracy } from '@/types';

export function DashboardPage() {
  const [backtests, setBacktests] = useState<BacktestRecord[]>([]);
  const [filters, setFilters] = useState<Filters>({ assets: [], models: [], experiments: [] });
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [accuracy, setAccuracy] = useState<PredictionAccuracy | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filtersRes, backtestsRes, metricsRes, accuracyRes] = await Promise.all([
        getFilters(),
        getBacktests({ asset: selectedAsset || undefined, model: selectedModel || undefined }),
        getMetrics({ asset: selectedAsset || undefined, model: selectedModel || undefined }),
        getPredictionAccuracy({ asset: selectedAsset || undefined, model: selectedModel || undefined }),
      ]);

      if (filtersRes.success) setFilters(filtersRes.data);
      if (backtestsRes.success) setBacktests(backtestsRes.data);
      if (metricsRes.success) setMetrics(metricsRes.data);
      if (accuracyRes.success) setAccuracy(accuracyRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAsset, selectedModel]);

  const chartData = backtests.map((record) => ({
    time: new Date(record.timestamp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    predicted: record.predicted_price,
    actual: record.actual_price,
    residual: record.predicted_price - record.actual_price,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of predictions, accuracy metrics, and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Models</SelectItem>
              {filters.models.map((model) => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
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
              {metrics?.totalReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Max DD: {metrics?.maxDrawdown.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direction Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracy?.directionAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              RMSE: ${accuracy?.rmse.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices">Price Comparison</TabsTrigger>
          <TabsTrigger value="residuals">Residuals</TabsTrigger>
        </TabsList>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>Predicted vs Actual Prices</CardTitle>
              <CardDescription>
                Comparison of model predictions against actual market prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="hsl(var(--primary))"
                        name="Predicted"
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="hsl(142.1 76.2% 36.3%)"
                        name="Actual"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="residuals">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Residuals</CardTitle>
              <CardDescription>
                Difference between predicted and actual prices over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Area
                        type="monotone"
                        dataKey="residual"
                        stroke="hsl(262.1 83.3% 57.8%)"
                        fill="hsl(262.1 83.3% 57.8% / 0.2)"
                        name="Residual"
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
        </TabsContent>
      </Tabs>

      {/* Accuracy Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Accuracy Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">MAE</p>
              <p className="text-xl font-semibold">${accuracy?.mae.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">RMSE</p>
              <p className="text-xl font-semibold">${accuracy?.rmse.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">MAPE</p>
              <p className="text-xl font-semibold">{accuracy?.mape.toFixed(4)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Direction Accuracy</p>
              <p className="text-xl font-semibold">
                <Badge variant={accuracy && accuracy.directionAccuracy > 50 ? 'success' : 'destructive'}>
                  {accuracy?.directionAccuracy.toFixed(1)}%
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
