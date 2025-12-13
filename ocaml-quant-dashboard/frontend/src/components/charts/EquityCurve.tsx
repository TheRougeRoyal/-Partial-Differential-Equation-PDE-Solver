// Equity Curve Chart component

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
import { formatTimestamp, formatCurrency } from '../utils/format';

interface EquityCurveProps {
  data: BacktestRecord[];
  height?: number;
}

export function EquityCurve({ data, height = 300 }: EquityCurveProps) {
  const chartData = data.map((record) => ({
    time: formatTimestamp(record.timestamp, 'MM/dd HH:mm'),
    equity: record.equity,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate gradient color based on performance
  const startEquity = data[0]?.equity || 0;
  const endEquity = data[data.length - 1]?.equity || 0;
  const isPositive = endEquity >= startEquity;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? '#22c55e' : '#ef4444'}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? '#22c55e' : '#ef4444'}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickFormatter={(value) => formatCurrency(value).replace('$', '')}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          formatter={(value: number) => [formatCurrency(value), 'Equity']}
        />
        <Area
          type="monotone"
          dataKey="equity"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          fill="url(#equityGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
