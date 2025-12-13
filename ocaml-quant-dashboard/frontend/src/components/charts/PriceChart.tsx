// Price Chart component for predicted vs actual prices

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
  ReferenceLine,
} from 'recharts';
import type { BacktestRecord } from '../types';
import { formatTimestamp, formatCurrency } from '../utils/format';

interface PriceChartProps {
  data: BacktestRecord[];
  height?: number;
  showResiduals?: boolean;
}

export function PriceChart({ data, height = 400, showResiduals = false }: PriceChartProps) {
  const chartData = data.map((record) => ({
    ...record,
    time: formatTimestamp(record.timestamp, 'MM/dd HH:mm'),
    residual: record.predicted_price - record.actual_price,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  if (showResiduals) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
            formatter={(value: number) => [value.toFixed(2), '']}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="residual"
            stroke="#8b5cf6"
            name="Residual (Predicted - Actual)"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis 
          tick={{ fontSize: 12 }} 
          tickFormatter={(value) => formatCurrency(value).replace('$', '')}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
          formatter={(value: number) => [formatCurrency(value), '']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="predicted_price"
          stroke="#0ea5e9"
          name="Predicted"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="actual_price"
          stroke="#22c55e"
          name="Actual"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
