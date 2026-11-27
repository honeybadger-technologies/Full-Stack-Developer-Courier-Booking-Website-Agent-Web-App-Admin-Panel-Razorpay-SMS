'use client'

import { useState } from 'react'
import { rateApi } from '@cbp/api-client'

export function PriceCalculator() {
  const [destination, setDestination] = useState('')
  const [weight, setWeight] = useState('')
  const [priceResult, setPriceResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const destinations = [
    { country: 'USA', code: 'US' },
    { country: 'UK', code: 'GB' },
    { country: 'Canada', code: 'CA' },
    { country: 'Australia', code: 'AU' },
    { country: 'UAE', code: 'AE' },
    { country: 'Germany', code: 'DE' },
    { country: 'France', code: 'FR' },
    { country: 'Singapore', code: 'SG' },
  ]

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!destination || !weight) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await rateApi.getPrice(destination, parseFloat(weight))
      setPriceResult(result)
    } catch (err) {
      setError('Failed to calculate price. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleCalculate} className="space-y-4">
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
            Destination Country
          </label>
          <select
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select a country</option>
            {destinations.map((d) => (
              <option key={d.code} value={d.country}>
                {d.country}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            id="weight"
            step="0.1"
            min="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter weight in kg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate Price'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {priceResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Price Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Destination:</span>
              <span className="font-medium">{priceResult.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weight:</span>
              <span className="font-medium">{priceResult.weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Rate:</span>
              <span className="font-medium">₹{priceResult.base_rate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Margin ({priceResult.margin_percent ?? 0}%):</span>
              <span className="font-medium">₹{priceResult.margin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
              <span className="text-gray-900 font-semibold">Total:</span>
              <span className="text-xl font-bold text-green-700">₹{priceResult.total.toFixed(2)}</span>
            </div>
          </div>
          <button className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Book Now
          </button>
        </div>
      )}
    </div>
  )
}
