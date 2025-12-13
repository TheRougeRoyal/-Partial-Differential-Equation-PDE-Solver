// Greeks Chart component

import React from 'react';
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
import type { GreekRecord } from '../types';
import { formatTimestamp } from '../utils/format';

interface GreeksChartProps {
  data: GreekRecord[];
  selectedGreeks?: ('delta' | 'gamma' | 'theta' | 'vega' | 'rho')[];
  height?: number;
}

const greekColors = {
  delta: '#0ea5e9',
  gamma: '#22c55e',
  theta: '#f59e0b',
  vega: '#8b5cf6',
  rho: '#ec4899',
};

const greekLabels = {
  delta: 'Delta (Δ)',
  gamma: 'Gamma (Γ)',
  theta: 'Theta (Θ)',
  vega: 'Vega (ν)',
  rho: 'Rho (ρ)',
};

export function GreeksChart({ 
  data, 
  selectedGreeks = ['delta', 'gamma', 'theta', 'vega', 'rho'],
  height = 300 
}: GreeksChartProps) {
  const chartData = data.map((record) => ({
    time: formatTimestamp(record.timestamp, 'MM/dd HH:mm'),
    delta: record.delta,
    gamma: record.gamma,
    theta: record.theta,
    vega: record.vega,
    rho: record.rho,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          formatter={(value: number) => [value.toFixed(4), '']}
        />
        <Legend />
        {selectedGreeks.map((greek) => (
          <Line
            key={greek}
            type="monotone"
            dataKey={greek}
            stroke={greekColors[greek]}
            name={greekLabels[greek]}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
