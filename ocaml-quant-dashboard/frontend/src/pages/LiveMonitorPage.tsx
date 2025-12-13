import { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import type { LiveUpdate, LivePredictionUpdate } from '@/types';

export function LiveMonitorPage() {
  const [connected, setConnected] = useState(false);
  const [updates, setUpdates] = useState<LivePredictionUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const websocket = new WebSocket(`ws://${window.location.hostname}:3001/ws/live`);
      
      websocket.onopen = () => {
        setConnected(true);
        setError(null);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as LiveUpdate;
          if (data.type === 'prediction_update') {
            setUpdates(prev => [data as LivePredictionUpdate, ...prev.slice(0, 99)]);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      websocket.onclose = () => {
        setConnected(false);
      };

      websocket.onerror = () => {
        setError('Connection error');
        setConnected(false);
      };

      setWs(websocket);
    } catch (e) {
      setError('Failed to connect');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  useEffect(() => {
    connect();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Group updates by asset for sparklines
  const assetData = updates.reduce((acc, update) => {
    if (!acc[update.asset]) {
      acc[update.asset] = [];
    }
    acc[update.asset].push(update);
    return acc;
  }, {} as Record<string, LivePredictionUpdate[]>);

  const latestByAsset = Object.entries(assetData).map(([asset, data]) => ({
    asset,
    latest: data[0],
    history: data.slice(0, 20).map(d => d.actual_price).reverse(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Monitor</h2>
          <p className="text-muted-foreground">
            Real-time price predictions and market updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'success' : 'destructive'} className="gap-1">
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={connected ? disconnect : connect}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {connected ? 'Disconnect' : 'Reconnect'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Asset Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {latestByAsset.length > 0 ? (
          latestByAsset.map(({ asset, latest, history }) => {
            const priceDiff = latest.predicted_price - latest.actual_price;
            const isUp = priceDiff > 0;
            
            return (
              <Card key={asset}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{asset}</CardTitle>
                    <Badge variant={isUp ? 'success' : 'destructive'}>
                      {isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {isUp ? '+' : ''}{priceDiff.toFixed(2)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {latest.model} • Confidence: {(latest.confidence * 100).toFixed(0)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Predicted</p>
                      <p className="text-xl font-bold">${latest.predicted_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actual</p>
                      <p className="text-xl font-bold">${latest.actual_price.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Sparkline */}
                  <div className="h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history.map((price, i) => ({ i, price }))}>
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke={isUp ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)'} 
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <XAxis dataKey="i" hide />
                        <YAxis domain={['dataMin', 'dataMax']} hide />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              {connected ? 'Waiting for live updates...' : 'Connect to receive live updates'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Updates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>
            Latest {updates.length} prediction updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {updates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Predicted</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead className="text-right">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {updates.slice(0, 20).map((update, index) => {
                  const error = update.predicted_price - update.actual_price;
                  return (
                    <TableRow key={`${update.timestamp}-${index}`}>
                      <TableCell className="font-mono text-sm">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">{update.asset}</TableCell>
                      <TableCell>{update.model}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${update.predicted_price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${update.actual_price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={update.confidence > 0.7 ? 'success' : 'secondary'}>
                          {(update.confidence * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-mono ${error >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {error >= 0 ? '+' : ''}{error.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No updates received yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
