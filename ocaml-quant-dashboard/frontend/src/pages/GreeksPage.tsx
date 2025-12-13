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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getGreeks, getFilters } from '@/utils/api';
import type { GreekRecord, Filters } from '@/types';

const greekColors = {
  delta: 'hsl(var(--primary))',
  gamma: 'hsl(142.1 76.2% 36.3%)',
  theta: 'hsl(38.3 92.1% 50.2%)',
  vega: 'hsl(262.1 83.3% 57.8%)',
  rho: 'hsl(346.8 77.2% 49.8%)',
};

export function GreeksPage() {
  const [greeks, setGreeks] = useState<GreekRecord[]>([]);
  const [filters, setFilters] = useState<Filters>({ assets: [], models: [], experiments: [] });
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [selectedGreeks, setSelectedGreeks] = useState<string[]>(['delta', 'gamma', 'theta']);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filtersRes, greeksRes] = await Promise.all([
        getFilters(),
        getGreeks({ asset: selectedAsset || undefined }),
      ]);

      if (filtersRes.success) setFilters(filtersRes.data);
      if (greeksRes.success) setGreeks(greeksRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAsset]);

  const chartData = greeks.map((record) => ({
    time: new Date(record.timestamp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit' 
    }),
    delta: record.delta,
    gamma: record.gamma,
    theta: record.theta,
    vega: record.vega,
    rho: record.rho,
  }));

  const toggleGreek = (greek: string) => {
    setSelectedGreeks(prev => 
      prev.includes(greek) 
        ? prev.filter(g => g !== greek)
        : [...prev, greek]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Greeks Analysis</h2>
          <p className="text-muted-foreground">
            Option Greeks: Delta (Δ), Gamma (Γ), Theta (Θ), Vega (ν), Rho (ρ)
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
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Greeks Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Select Greeks to Display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['delta', 'gamma', 'theta', 'vega', 'rho'] as const).map((greek) => (
              <Button
                key={greek}
                variant={selectedGreeks.includes(greek) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleGreek(greek)}
                style={{
                  backgroundColor: selectedGreeks.includes(greek) ? greekColors[greek] : undefined,
                }}
              >
                {greek.charAt(0).toUpperCase() + greek.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Time Series</TabsTrigger>
          <TabsTrigger value="table">Data Table</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Greeks Over Time</CardTitle>
              <CardDescription>
                Time series visualization of selected option Greeks
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
                      {selectedGreeks.includes('delta') && (
                        <Line type="monotone" dataKey="delta" stroke={greekColors.delta} name="Delta (Δ)" dot={false} strokeWidth={2} />
                      )}
                      {selectedGreeks.includes('gamma') && (
                        <Line type="monotone" dataKey="gamma" stroke={greekColors.gamma} name="Gamma (Γ)" dot={false} strokeWidth={2} />
                      )}
                      {selectedGreeks.includes('theta') && (
                        <Line type="monotone" dataKey="theta" stroke={greekColors.theta} name="Theta (Θ)" dot={false} strokeWidth={2} />
                      )}
                      {selectedGreeks.includes('vega') && (
                        <Line type="monotone" dataKey="vega" stroke={greekColors.vega} name="Vega (ν)" dot={false} strokeWidth={2} />
                      )}
                      {selectedGreeks.includes('rho') && (
                        <Line type="monotone" dataKey="rho" stroke={greekColors.rho} name="Rho (ρ)" dot={false} strokeWidth={2} />
                      )}
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

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Greeks Data Table</CardTitle>
              <CardDescription>
                Detailed view of all Greek values
              </CardDescription>
            </CardHeader>
            <CardContent>
              {greeks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Option ID</TableHead>
                      <TableHead className="text-right">Delta (Δ)</TableHead>
                      <TableHead className="text-right">Gamma (Γ)</TableHead>
                      <TableHead className="text-right">Theta (Θ)</TableHead>
                      <TableHead className="text-right">Vega (ν)</TableHead>
                      <TableHead className="text-right">Rho (ρ)</TableHead>
                      <TableHead className="text-right">IV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {greeks.slice(0, 50).map((record, index) => (
                      <TableRow key={`${record.option_id}-${index}`}>
                        <TableCell className="font-mono text-sm">
                          {new Date(record.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{record.asset}</TableCell>
                        <TableCell>{record.option_id}</TableCell>
                        <TableCell className="text-right font-mono">{record.delta.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{record.gamma.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono text-red-600">{record.theta.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{record.vega.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{record.rho.toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{(record.implied_vol * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
