// Formatting utilities

import { format, parseISO, subDays, subMonths } from 'date-fns';
import type { DatePreset } from '../types';

// Format number with commas
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format currency
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format percentage
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Format timestamp
export function formatTimestamp(timestamp: string, formatStr = 'MMM dd, HH:mm'): string {
  try {
    return format(parseISO(timestamp), formatStr);
  } catch {
    return timestamp;
  }
}

// Format date for API
export function formatDateForApi(date: Date): string {
  return date.toISOString();
}

// Get date range from preset
export function getDateRangeFromPreset(preset: DatePreset): { from: Date; to: Date } {
  const to = new Date();
  let from: Date;

  switch (preset) {
    case '1D':
      from = subDays(to, 1);
      break;
    case '7D':
      from = subDays(to, 7);
      break;
    case '30D':
      from = subMonths(to, 1);
      break;
    case 'ALL':
    default:
      from = new Date('2000-01-01');
      break;
  }

  return { from, to };
}

// Color scales for values
export function getValueColor(value: number, thresholds: { low: number; high: number } = { low: 0, high: 0 }): string {
  if (value > thresholds.high) return 'text-green-600';
  if (value < thresholds.low) return 'text-red-600';
  return 'text-gray-600';
}

// Get color for P&L
export function getPnlColor(pnl: number): string {
  if (pnl > 0) return 'text-green-600';
  if (pnl < 0) return 'text-red-600';
  return 'text-gray-600';
}

// Get background color for P&L badge
export function getPnlBgColor(pnl: number): string {
  if (pnl > 0) return 'bg-green-100 text-green-800';
  if (pnl < 0) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Calculate chart domain with padding
export function calculateDomain(values: number[], padding = 0.1): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const paddingValue = range * padding;
  
  return [min - paddingValue, max + paddingValue];
}
