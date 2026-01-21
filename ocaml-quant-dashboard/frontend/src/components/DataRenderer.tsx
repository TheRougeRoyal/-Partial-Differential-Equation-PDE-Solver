import LineChart from './LineChart'
import BarChart from './BarChart'

interface DataRendererProps {
  data: any
  endpoint: string
}

function DataRenderer({ data, endpoint }: DataRendererProps) {
  if (!data) {
    return <div className="no-data">No data to display</div>
  }

  // For array data
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <div className="no-data">Empty data set</div>
    }

    const firstItem = data[0]
    const keys = Object.keys(firstItem)

    // Try to detect chart type based on data structure
    if (endpoint.includes('backtest') || endpoint.includes('predict')) {
      // For backtesting and predictions, show line chart
      const numericKeys = keys.filter(
        (k) =>
          typeof firstItem[k] === 'number' &&
          k.toLowerCase() !== 'date' &&
          k.toLowerCase() !== 'time'
      )

      if (numericKeys.length > 0) {
        const lines = numericKeys.map((key, idx) => ({
          key,
          color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'][idx % 4],
          name: key.replace(/_/g, ' '),
        }))

        const xKey = keys.find(
          (k) =>
            k.toLowerCase().includes('date') ||
            k.toLowerCase().includes('time')
        ) || keys[0]

        return (
          <LineChart
            data={data}
            title={`${endpoint.toUpperCase()} - Time Series Data`}
            xDataKey={xKey}
            lines={lines}
          />
        )
      }
    }

    if (endpoint.includes('greeks')) {
      // For Greeks, show bar chart
      const numericKeys = keys.filter(
        (k) =>
          typeof firstItem[k] === 'number' &&
          k.toLowerCase() !== 'date' &&
          k.toLowerCase() !== 'time'
      )

      if (numericKeys.length > 0) {
        const bars = numericKeys.slice(0, 3).map((key, idx) => ({
          key,
          color: ['#8884d8', '#82ca9d', '#ffc658'][idx % 3],
          name: key.replace(/_/g, ' '),
        }))

        const xKey = keys[0]

        return (
          <BarChart
            data={data}
            title={`${endpoint.toUpperCase()} - Greeks Analysis`}
            xDataKey={xKey}
            bars={bars}
          />
        )
      }
    }
  }

  // For object data, display as table
  if (typeof data === 'object') {
    return (
      <div className="data-table">
        <h3>Response Data</h3>
        <table>
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <td className="key">{key}</td>
                <td className="value">
                  {typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return <div className="no-data">Unable to display data</div>
}

export default DataRenderer
