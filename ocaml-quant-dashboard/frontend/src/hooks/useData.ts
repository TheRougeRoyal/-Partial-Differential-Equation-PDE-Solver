// Data fetching hooks

import { useState, useEffect, useCallback } from 'react';
import type { 
  BacktestRecord, 
  PredictionRecord, 
  GreekRecord, 
  Filters, 
  Metrics, 
  PredictionAccuracy,
  QueryParams 
} from '../types';
import { 
  getBacktests, 
  getPredictions, 
  getGreeks, 
  getFilters as fetchFilters, 
  getMetrics as fetchMetrics,
  getPredictionAccuracy as fetchPredictionAccuracy 
} from '../utils/api';

interface UseDataOptions {
  autoFetch?: boolean;
  initialParams?: QueryParams;
}

interface UseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  refetch: (params?: QueryParams) => Promise<void>;
}

// Generic data hook
function useData<T>(
  fetchFn: (params: QueryParams) => Promise<{ success: boolean; data: T[]; meta?: { total: number; hasMore: boolean }; error?: string }>,
  options: UseDataOptions = {}
): UseDataReturn<T> {
  const { autoFetch = true, initialParams = {} } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const refetch = useCallback(async (params: QueryParams = initialParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFn(params);
      if (response.success) {
        setData(response.data);
        setTotal(response.meta?.total || response.data.length);
        setHasMore(response.meta?.hasMore || false);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, initialParams]);

  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return { data, loading, error, total, hasMore, refetch };
}

// Specific hooks
export function useBacktests(options: UseDataOptions = {}) {
  return useData<BacktestRecord>(getBacktests, options);
}

export function usePredictions(options: UseDataOptions = {}) {
  return useData<PredictionRecord>(getPredictions, options);
}

export function useGreeks(options: UseDataOptions = {}) {
  return useData<GreekRecord>(getGreeks, options);
}

// Filters hook
export function useFilters() {
  const [filters, setFilters] = useState<Filters>({ assets: [], models: [], experiments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchFilters();
      if (response.success) {
        setFilters(response.data);
      } else {
        setError(response.error || 'Failed to fetch filters');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { filters, loading, error, refetch };
}

// Metrics hook
export function useMetrics(params: QueryParams = {}) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (newParams: QueryParams = params) => {
    setLoading(true);
    try {
      const response = await fetchMetrics(newParams);
      if (response.success) {
        setMetrics(response.data);
      } else {
        setError(response.error || 'Failed to fetch metrics');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { metrics, loading, error, refetch };
}

// Prediction accuracy hook
export function usePredictionAccuracy(params: QueryParams = {}) {
  const [accuracy, setAccuracy] = useState<PredictionAccuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (newParams: QueryParams = params) => {
    setLoading(true);
    try {
      const response = await fetchPredictionAccuracy(newParams);
      if (response.success) {
        setAccuracy(response.data);
      } else {
        setError(response.error || 'Failed to fetch prediction accuracy');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { accuracy, loading, error, refetch };
}
