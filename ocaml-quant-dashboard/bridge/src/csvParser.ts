import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import {
  BacktestRecord,
  PredictionRecord,
  GreekRecord,
  QueryParams,
} from './types';

// Cache for parsed CSV data
interface DataCache {
  backtests: BacktestRecord[];
  predictions: PredictionRecord[];
  greeks: GreekRecord[];
  uploaded: Map<string, any[]>;
  lastUpdated: Map<string, number>;
}

const cache: DataCache = {
  backtests: [],
  predictions: [],
  greeks: [],
  uploaded: new Map(),
  lastUpdated: new Map(),
};

const CACHE_TTL = 5000; // 5 seconds

// Configurable data directory
let dataDir = path.join(__dirname, '../../sample_data');

export function setDataDirectory(dir: string): void {
  dataDir = dir;
}

export function getDataDirectory(): string {
  return dataDir;
}

// Generic CSV parser with best-effort column mapping
function parseCSV<T>(filePath: string, mapper: (row: any) => T | null): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true,
    });

    return records.map(mapper).filter((r: T | null): r is T => r !== null);
  } catch (error) {
    console.error(`Error parsing CSV ${filePath}:`, error);
    return [];
  }
}

// Safe number parser
function safeFloat(value: any, defaultVal = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultVal : parsed;
}

// Backtest record mapper
function mapBacktestRecord(row: any): BacktestRecord | null {
  if (!row.timestamp) return null;
  return {
    timestamp: row.timestamp,
    asset: row.asset || 'UNKNOWN',
    model: row.model || 'default',
    experiment_id: row.experiment_id || 'exp-1',
    predicted_price: safeFloat(row.predicted_price),
    actual_price: safeFloat(row.actual_price),
    position: safeFloat(row.position),
    pnl: safeFloat(row.pnl),
    equity: safeFloat(row.equity),
    drawdown: safeFloat(row.drawdown),
  };
}

// Prediction record mapper
function mapPredictionRecord(row: any): PredictionRecord | null {
  if (!row.timestamp) return null;
  return {
    timestamp: row.timestamp,
    asset: row.asset || 'UNKNOWN',
    model: row.model || 'default',
    predicted_price: safeFloat(row.predicted_price),
    confidence: safeFloat(row.confidence, 0.5),
    horizon_seconds: safeFloat(row.horizon_seconds, 3600),
  };
}

// Greek record mapper
function mapGreekRecord(row: any): GreekRecord | null {
  if (!row.timestamp) return null;
  return {
    timestamp: row.timestamp,
    asset: row.asset || 'UNKNOWN',
    option_id: row.option_id || 'opt-1',
    strike: safeFloat(row.strike),
    expiry: row.expiry || '',
    delta: safeFloat(row.delta),
    gamma: safeFloat(row.gamma),
    theta: safeFloat(row.theta),
    vega: safeFloat(row.vega),
    rho: safeFloat(row.rho),
    implied_vol: safeFloat(row.implied_vol),
  };
}

// Load data with caching
function loadWithCache<T>(
  key: string,
  fileName: string,
  mapper: (row: any) => T | null,
  cacheArray: T[]
): T[] {
  const filePath = path.join(dataDir, fileName);
  const lastUpdated = cache.lastUpdated.get(key) || 0;
  const now = Date.now();

  if (now - lastUpdated < CACHE_TTL && cacheArray.length > 0) {
    return cacheArray;
  }

  const data = parseCSV(filePath, mapper);
  cache.lastUpdated.set(key, now);
  return data;
}

// Data access functions
export function getBacktests(params: QueryParams = {}): BacktestRecord[] {
  cache.backtests = loadWithCache(
    'backtests',
    'backtest_results.csv',
    mapBacktestRecord,
    cache.backtests
  );

  return filterData(cache.backtests, params);
}

export function getPredictions(params: QueryParams = {}): PredictionRecord[] {
  cache.predictions = loadWithCache(
    'predictions',
    'predictions.csv',
    mapPredictionRecord,
    cache.predictions
  );

  return filterData(cache.predictions, params);
}

export function getGreeks(params: QueryParams = {}): GreekRecord[] {
  cache.greeks = loadWithCache(
    'greeks',
    'greeks.csv',
    mapGreekRecord,
    cache.greeks
  );

  return filterData(cache.greeks, params);
}

// Generic filter function
function filterData<T extends { timestamp: string; asset?: string; model?: string }>(
  data: T[],
  params: QueryParams
): T[] {
  let filtered = [...data];

  if (params.asset) {
    filtered = filtered.filter((r) => r.asset === params.asset);
  }

  if (params.model) {
    filtered = filtered.filter((r) => r.model === params.model);
  }

  if (params.from) {
    const fromDate = new Date(params.from);
    filtered = filtered.filter((r) => new Date(r.timestamp) >= fromDate);
  }

  if (params.to) {
    const toDate = new Date(params.to);
    filtered = filtered.filter((r) => new Date(r.timestamp) <= toDate);
  }

  // Filter by experiment_id if applicable
  if (params.experiment_id && 'experiment_id' in filtered[0]) {
    filtered = filtered.filter(
      (r: any) => r.experiment_id === params.experiment_id
    );
  }

  // Filter by option_id if applicable
  if (params.option_id && 'option_id' in (filtered[0] || {})) {
    filtered = filtered.filter((r: any) => r.option_id === params.option_id);
  }

  return filtered;
}

// Pagination helper
export function paginate<T>(
  data: T[],
  page: number = 1,
  limit: number = 100
): { data: T[]; total: number; page: number; limit: number; hasMore: boolean } {
  const total = data.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    hasMore: end < total,
  };
}

// Handle uploaded CSV files
export function addUploadedData(id: string, data: any[]): void {
  cache.uploaded.set(id, data);
}

export function getUploadedData(id: string): any[] | undefined {
  return cache.uploaded.get(id);
}

export function getAllUploadedIds(): string[] {
  return Array.from(cache.uploaded.keys());
}

// Get unique values for filters
export function getUniqueAssets(): string[] {
  const backtests = getBacktests();
  const predictions = getPredictions();
  const greeks = getGreeks();

  const assets = new Set<string>();
  [...backtests, ...predictions, ...greeks].forEach((r) => {
    if (r.asset) assets.add(r.asset);
  });

  return Array.from(assets).sort();
}

export function getUniqueModels(): string[] {
  const backtests = getBacktests();
  const predictions = getPredictions();

  const models = new Set<string>();
  [...backtests, ...predictions].forEach((r: any) => {
    if (r.model) models.add(r.model);
  });

  return Array.from(models).sort();
}

export function getUniqueExperiments(): string[] {
  const backtests = getBacktests();

  const experiments = new Set<string>();
  backtests.forEach((r) => {
    if (r.experiment_id) experiments.add(r.experiment_id);
  });

  return Array.from(experiments).sort();
}

// Clear cache (useful for testing or when new data is uploaded)
export function clearCache(): void {
  cache.backtests = [];
  cache.predictions = [];
  cache.greeks = [];
  cache.lastUpdated.clear();
}

// Parse uploaded CSV buffer
export function parseUploadedCSV(buffer: Buffer): any[] {
  try {
    const content = buffer.toString('utf-8');
    return parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relaxColumnCount: true,
    });
  } catch (error) {
    console.error('Error parsing uploaded CSV:', error);
    return [];
  }
}
