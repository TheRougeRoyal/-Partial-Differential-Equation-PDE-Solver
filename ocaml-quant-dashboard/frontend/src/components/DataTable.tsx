// Data Table component for generic data display

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface DataTableProps {
  data: Record<string, unknown>[];
  columns?: string[];
  onRowClick?: (row: Record<string, unknown>) => void;
  pageSize?: number;
}

export function DataTable({ data, columns, onRowClick, pageSize = 20 }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  // Determine columns from first row if not provided
  const displayColumns = columns || Object.keys(data[0] || {});
  
  // Pagination
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      displayColumns.join(','),
      ...data.map(row => 
        displayColumns.map(col => {
          const value = row[col];
          const strValue = value === null || value === undefined ? '' : String(value);
          return strValue.includes(',') ? `"${strValue}"` : strValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Showing {startIndex + 1} - {Math.min(endIndex, data.length)} of {data.length}
        </span>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayColumns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {displayColumns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-600"
                  >
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(4);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
