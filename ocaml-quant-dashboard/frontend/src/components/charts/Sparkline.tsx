// Sparkline component for compact inline charts

import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 100, height = 30, color = '#0ea5e9' }: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  
  // Determine trend color
  const firstValue = data[0] || 0;
  const lastValue = data[data.length - 1] || 0;
  const trendColor = lastValue >= firstValue ? '#22c55e' : '#ef4444';

  if (data.length < 2) {
    return <div style={{ width, height }} className="bg-gray-100 rounded" />;
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color || trendColor}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
