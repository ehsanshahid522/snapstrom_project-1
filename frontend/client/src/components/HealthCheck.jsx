import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

export default function HealthCheck() {
  const [status, setStatus] = useState('checking')
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        console.log('🔍 Checking API health...')
        const response = await api('/health')
        console.log('✅ Health check response:', response)
        setStatus('healthy')
      } catch (err) {
        console.error('❌ Health check failed:', err)
        setError(err.message)
        setStatus('unhealthy')
      }
    }

    checkHealth()
  }, [])

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">API Health Check</h3>
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Status: </span>
          <span className={`px-2 py-1 rounded text-sm ${
            status === 'healthy' ? 'bg-green-100 text-green-800' :
            status === 'unhealthy' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
        </div>
        {error && (
          <div className="text-red-600 text-sm">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  )
}
