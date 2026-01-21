import axios, { AxiosError } from 'axios'
import { mockApi } from './mockApi'

// API client with intelligent fallback system
class ApiClient {
  private baseUrl = 'http://localhost:8000/api'
  private useCache = true
  private cache: Map<string, any> = new Map()

  async fetchData(endpoint: string, useMock = false): Promise<any> {
    // Check cache first
    const cacheKey = `${endpoint}-${useMock}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      // Try real API first (unless mock is forced)
      if (!useMock) {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          timeout: 5000,
        })
        const data = response.data
        if (this.useCache) {
          this.cache.set(cacheKey, data)
        }
        return data
      }
    } catch (error: any) {
      console.warn(`API call failed for ${endpoint}:`, error.message)
      // Fall through to mock data
    }

    // Fallback to mock data
    return this.getMockData(endpoint)
  }

  private getMockData(endpoint: string): any {
    const paths: Record<string, () => Promise<any>> = {
      '/health': mockApi.health,
      '/predict': mockApi.predict,
      '/backtest': mockApi.backtest,
      '/greeks': mockApi.greeks,
    }

    const mockFn = paths[endpoint]
    if (mockFn) {
      return mockFn()
    }

    throw new Error(`Unknown endpoint: ${endpoint}`)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const apiClient = new ApiClient()
