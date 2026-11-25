'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@cbp/supabase'

export default function TrackingPage() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (err: any) {
      setError('Order not found. Please check the order ID.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'picked_up': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Track Your Shipment</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleTrack} className="flex gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter Order ID"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {order && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-primary text-white p-6">
            <h2 className="text-2xl font-bold">Order #{order.id.slice(-8)}</h2>
            <p className="text-primary-200">Tracking Status</p>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Receiver Details</h3>
                <p className="text-gray-700">{order.receiver_name}</p>
                <p className="text-gray-700">{order.receiver_address}</p>
                <p className="text-gray-700">{order.destination_country}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold mb-2">Order Details</h3>
                <p className="text-gray-700">Weight: {order.weight} kg</p>
                <p className="text-gray-700">Scheduled: {order.scheduled_pickup_date}</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-b py-4 mb-6">
              <span className="text-gray-700">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{order.total_amount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
              {order.india_post_tracking_number && (
                <a
                  href={`https://www.indiapost.gov.in/psignontrack.aspx?consignmentno=${order.india_post_tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View India Post Tracking
                </a>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-4">Tracking History</h3>
            <div className="relative pl-8 border-l-2 border-gray-200 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500"></div>
                <h4 className="font-medium">Order Placed</h4>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
              </div>

              {order.status === 'picked_up' && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
                  <h4 className="font-medium">Picked Up</h4>
                  <p className="text-sm text-gray-500">Parcel collected from pickup location</p>
                </div>
              )}

              {order.status === 'shipped' && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-purple-500"></div>
                  <h4 className="font-medium">Shipped</h4>
                  <p className="text-sm text-gray-500">Booked with India Post</p>
                  {order.india_post_tracking_number && (
                    <p className="text-sm text-gray-600 mt-1">
                      Tracking: {order.india_post_tracking_number}
                    </p>
                  )}
                </div>
              )}

              {order.status === 'delivered' && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-green-600"></div>
                  <h4 className="font-medium">Delivered</h4>
                  <p className="text-sm text-gray-500">Parcel successfully delivered</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
