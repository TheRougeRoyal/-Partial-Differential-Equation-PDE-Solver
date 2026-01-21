import { useState } from 'react'
import './Dashboard.css'

interface DashboardProps {
  onFetchData: (endpoint: string) => void
}

function Dashboard({ onFetchData }: DashboardProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/health')

  const endpoints = [
    { name: 'Health Check', path: '/health' },
    { name: 'Predictions', path: '/predict' },
    { name: 'Backtesting', path: '/backtest' },
    { name: 'Greeks Analysis', path: '/greeks' },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <h2>Operations</h2>
        <div className="endpoint-list">
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.path}
              className={`endpoint-btn ${selectedEndpoint === endpoint.path ? 'active' : ''}`}
              onClick={() => {
                setSelectedEndpoint(endpoint.path)
                onFetchData(endpoint.path)
              }}
            >
              {endpoint.name}
            </button>
          ))}
        </div>
      </div>
      <div className="dashboard-content">
        <div className="content-header">
          <h2>Current Selection: {selectedEndpoint}</h2>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
