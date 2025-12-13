// Type definitions for the frontend

export interface BacktestRecord {
  timestamp: string;
  asset: string;
  model: string;
  experiment_id: string;
  predicted_price: number;
  actual_price: number;
  position: number;
  pnl: number;
  equity: number;
  drawdown: number;
}

export interface PredictionRecord {
  timestamp: string;
  asset: string;
  model: string;
  predicted_price: number;
  confidence: number;
  horizon_seconds: number;
}

export interface GreekRecord {
  timestamp: string;
  asset: string;
  option_id: string;
  strike: number;
  expiry: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  implied_vol: number;
}

export interface LivePredictionUpdate {
  type: 'prediction_update';
  timestamp: string;
  asset: string;
  model: string;
  predicted_price: number;
  actual_price: number;
  confidence: number;
}

export interface LiveGreekUpdate {
  type: 'greek_update';
  timestamp: string;
  option_id: string;
  asset: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export type LiveUpdate = LivePredictionUpdate | LiveGreekUpdate;

export interface QueryParams {
  asset?: string;
  model?: string;
  experiment_id?: string;
  option_id?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface Filters {
  assets: string[];
  models: string[];
  experiments: string[];
}

export interface Metrics {
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  avgPnl: number;
  totalTrades: number;
}

export interface PredictionAccuracy {
  mae: number;
  rmse: number;
  mape: number;
  directionAccuracy: number;
}

export interface UploadInfo {
  uploadId: string;
  filename: string;
  recordCount: number;
  columns: string[];
  preview: Record<string, unknown>[];
}

export type DatePreset = '1D' | '7D' | '30D' | 'ALL';
