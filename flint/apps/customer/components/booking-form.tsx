'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@cbp/supabase'
import { createOrderRequest } from '../lib/orders'

export function BookingForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverAddress: '',
    destinationCountry: '',
    weight: '',
    scheduledPickupDate: '',
    phone: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.receiverName || !formData.receiverAddress || !formData.destinationCountry || !formData.weight) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get price first
      const priceResult = await fetch(
        `/api/prices?destination=${encodeURIComponent(formData.destinationCountry)}&weight=${formData.weight}`,
      )
      const priceData = await priceResult.json()
      if (!priceResult.ok) throw new Error(priceData.error || 'failed to calculate price')

      const orderData = {
        receiverName: formData.receiverName,
        receiverAddress: formData.receiverAddress,
        destinationCountry: formData.destinationCountry,
        weight: parseFloat(formData.weight),
        scheduledPickupDate: formData.scheduledPickupDate,
        phone: formData.phone,
        notes: formData.notes,
        totalAmount: priceData.total,
      }

      const { data: { session } } = await supabase.auth.getSession()
      const orderRes = await fetch('/api/orders', createOrderRequest(session?.access_token, orderData))
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order?.error || 'failed to create order')

      setSuccess(true)

      // Redirect to checkout with the order ID
      setTimeout(() => {
        router.push(`/checkout?orderId=${order.id}`)
      }, 2000)
    } catch (err) {
      setError('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Order Created Successfully!</h3>
        <p className="text-green-700">Redirecting to checkout...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receiver Name *
          </label>
          <input
            type="text"
            name="receiverName"
            value={formData.receiverName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter receiver name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receiver Address *
          </label>
          <textarea
            name="receiverAddress"
            value={formData.receiverAddress}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
            placeholder="Enter receiver full address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Country *
          </label>
          <select
            name="destinationCountry"
            value={formData.destinationCountry}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg) *
          </label>
          <input
            type="number"
            name="weight"
            step="0.1"
            min="0.1"
            value={formData.weight}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter weight in kg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Pickup Date
          </label>
          <input
            type="date"
            name="scheduledPickupDate"
            value={formData.scheduledPickupDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={2}
            placeholder="Any additional information about the parcel"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
