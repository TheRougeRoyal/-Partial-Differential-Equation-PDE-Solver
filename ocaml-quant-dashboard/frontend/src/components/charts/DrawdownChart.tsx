// Drawdown Chart component

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { BacktestRecord } from '../types';
import { formatTimestamp, formatPercent } from '../utils/format';

interface DrawdownChartProps {
  data: BacktestRecord[];
  height?: number;
}

export function DrawdownChart({ data, height = 200 }: DrawdownChartProps) {
  const chartData = data.map((record) => ({
    time: formatTimestamp(record.timestamp, 'MM/dd HH:mm'),
    drawdown: -record.drawdown * 100, // Negate for visual representation
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickFormatter={(value) => `${value.toFixed(2)}%`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          formatter={(value: number) => [formatPercent(value), 'Drawdown']}
        />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="#ef4444"
          fill="url(#drawdownGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
