'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@cbp/supabase'

export default function RatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    destination_country: '',
    weight_range_min: '',
    weight_range_max: '',
    base_rate: '',
    margin_percent: '',
  })

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    try {
      const { data, error } = await supabase
        .from('rates')
        .select('*')
        .order('destination_country', { ascending: true })
        .order('weight_range_min', { ascending: true })

      if (error) throw error
      setRates(data || [])
    } catch (err) {
      console.error('Error fetching rates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('rates')
        .insert([{
          destination_country: formData.destination_country,
          weight_range_min: parseFloat(formData.weight_range_min),
          weight_range_max: parseFloat(formData.weight_range_max),
          base_rate: parseFloat(formData.base_rate),
          margin_percent: parseFloat(formData.margin_percent),
          active: true,
        }])

      if (error) throw error
      fetchRates()
      setShowForm(false)
      setFormData({ destination_country: '', weight_range_min: '', weight_range_max: '', base_rate: '', margin_percent: '' })
    } catch (err) {
      console.error('Error saving rate:', err)
      alert('Failed to save rate')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rate Tables</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-dark"
        >
          {showForm ? 'Cancel' : 'Add Rate'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Rate</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                <input
                  type="text"
                  name="destination_country"
                  value={formData.destination_country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., USA"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Min (kg)</label>
                <input
                  type="number"
                  name="weight_range_min"
                  step="0.1"
                  value={formData.weight_range_min}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Max (kg)</label>
                <input
                  type="number"
                  name="weight_range_max"
                  step="0.1"
                  value={formData.weight_range_max}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (₹)</label>
                <input
                  type="number"
                  name="base_rate"
                  step="10"
                  value={formData.base_rate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margin (%)</label>
                <input
                  type="number"
                  name="margin_percent"
                  step="1"
                  value={formData.margin_percent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="10"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-dark"
            >
              Save Rate
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No rates configured
                </td>
              </tr>
            ) : (
              rates.map((rate) => (
                <tr key={rate.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.destination_country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rate.weight_range_min} - {rate.weight_range_max} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{rate.base_rate.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rate.margin_percent}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{((rate.base_rate as number) * (1 + (rate.margin_percent as number) / 100)).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
