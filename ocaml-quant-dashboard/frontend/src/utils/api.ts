// API utility functions

import type { 
  ApiResponse, 
  BacktestRecord, 
  PredictionRecord, 
  GreekRecord, 
  Filters, 
  Metrics, 
  PredictionAccuracy,
  QueryParams,
  UploadInfo 
} from '../types';

const API_BASE = '/api/v1';

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    return {
      success: false,
      data: [] as unknown as T,
      error: (error as Error).message,
    };
  }
}

// Build query string from params
function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Backtest endpoints
export async function getBacktests(params: QueryParams = {}): Promise<ApiResponse<BacktestRecord[]>> {
  return fetchApi<BacktestRecord[]>(`/backtests${buildQueryString(params)}`);
}

// Prediction endpoints
export async function getPredictions(params: QueryParams = {}): Promise<ApiResponse<PredictionRecord[]>> {
  return fetchApi<PredictionRecord[]>(`/predictions${buildQueryString(params)}`);
}

// Greeks endpoints
export async function getGreeks(params: QueryParams = {}): Promise<ApiResponse<GreekRecord[]>> {
  return fetchApi<GreekRecord[]>(`/greeks${buildQueryString(params)}`);
}

// Filter options
export async function getFilters(): Promise<ApiResponse<Filters>> {
  return fetchApi<Filters>('/filters');
}

// Metrics endpoints
export async function getMetrics(params: QueryParams = {}): Promise<ApiResponse<Metrics>> {
  return fetchApi<Metrics>(`/metrics${buildQueryString(params)}`);
}

export async function getPredictionAccuracy(params: QueryParams = {}): Promise<ApiResponse<PredictionAccuracy>> {
  return fetchApi<PredictionAccuracy>(`/prediction-accuracy${buildQueryString(params)}`);
}

// Upload endpoint
export async function uploadCSV(file: File, dataType?: string): Promise<ApiResponse<UploadInfo>> {
  const formData = new FormData();
  formData.append('file', file);
  if (dataType) {
    formData.append('type', dataType);
  }

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      data: {} as UploadInfo,
      error: (error as Error).message,
    };
  }
}

// Get uploaded data
export async function getUploadedData(
  uploadId: string, 
  params: { page?: number; limit?: number } = {}
): Promise<ApiResponse<Record<string, unknown>[]>> {
  return fetchApi<Record<string, unknown>[]>(
    `/uploads/${uploadId}${buildQueryString(params as QueryParams)}`
  );
}

// List uploads
export async function listUploads(): Promise<ApiResponse<{ uploadId: string; recordCount: number }[]>> {
  return fetchApi<{ uploadId: string; recordCount: number }[]>('/uploads');
}

// Health check
export async function checkHealth(): Promise<ApiResponse<{ status: string; wsClients: number }>> {
  return fetchApi<{ status: string; wsClients: number }>('/health');
}

// Clear cache
export async function clearCache(): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>('/cache/clear', { method: 'POST' });
}

// API object for easier imports
export const api = {
  getBacktests,
  getPredictions,
  getGreeks,
  getFilters,
  getMetrics,
  getPredictionAccuracy,
  uploadCSV,
  getUploadedData,
  listUploads,
  checkHealth,
  clearCache,
};
