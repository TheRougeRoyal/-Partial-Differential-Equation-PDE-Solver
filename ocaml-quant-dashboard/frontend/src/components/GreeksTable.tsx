// Greeks Table component

import React from 'react';
import type { GreekRecord } from '../types';
import { formatTimestamp } from '../utils/format';

interface GreeksTableProps {
  data: GreekRecord[];
  onRowClick?: (record: GreekRecord) => void;
}

export function GreeksTable({ data, onRowClick }: GreeksTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No Greek data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Asset
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Option ID
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delta (Δ)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gamma (Γ)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Theta (Θ)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vega (ν)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rho (ρ)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              IV
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record, index) => (
            <tr
              key={`${record.option_id}-${index}`}
              onClick={() => onRowClick?.(record)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {formatTimestamp(record.timestamp)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {record.asset}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {record.option_id}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">
                {record.delta.toFixed(4)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">
                {record.gamma.toFixed(4)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono text-red-600">
                {record.theta.toFixed(4)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">
                {record.vega.toFixed(4)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">
                {record.rho.toFixed(4)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-mono">
                {(record.implied_vol * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
