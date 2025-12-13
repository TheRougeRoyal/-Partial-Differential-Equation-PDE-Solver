// Metric Card component for displaying KPIs

import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  colorClass?: string;
}

export function MetricCard({ label, value, change, changeLabel, icon, colorClass }: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp size={16} className="text-green-500" />;
    if (change < 0) return <TrendingDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-2">
        <span className={clsx('text-2xl font-bold', colorClass || 'text-gray-900')}>
          {value}
        </span>
      </div>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {getTrendIcon()}
          <span className={clsx('text-sm font-medium', getTrendColor())}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="text-sm text-gray-400 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
