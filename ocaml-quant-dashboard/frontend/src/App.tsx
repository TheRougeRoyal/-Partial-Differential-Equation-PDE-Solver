import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import DataRenderer from './components/DataRenderer'
import { apiClient } from './services/apiClient'
import './App.css'

function App() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentEndpoint, setCurrentEndpoint] = useState('/health')
  const [usingMockData, setUsingMockData] = useState(false)

  const fetchData = async (endpoint: string) => {
    setLoading(true)
    setError(null)
    setCurrentEndpoint(endpoint)
    try {
      const result = await apiClient.fetchData(endpoint)
      setData(result)
      setUsingMockData(false)
    } catch (err: any) {
      // Fallback to mock data on error
      try {
        const mockResult = await apiClient.fetchData(endpoint, true)
        setData(mockResult)
        setUsingMockData(true)
        setError('Using mock data (Backend unavailable)')
      } catch (mockErr: any) {
        setError(mockErr.message || 'Failed to fetch data')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>PDE Quant Dashboard</h1>
          {usingMockData && <span className="mock-badge">📊 Demo Mode (Mock Data)</span>}
        </div>
      </header>
      <main className="app-main">
        <Dashboard onFetchData={fetchData} />
        {loading && <div className="loading">Loading...</div>}
        {error && <div className={`error ${usingMockData ? 'warning' : 'error-state'}`}>{error}</div>}
        {data && <DataRenderer data={data} endpoint={currentEndpoint} />}
      </main>
    </div>
  )
}

export default App
