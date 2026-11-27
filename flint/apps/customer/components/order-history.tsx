'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@cbp/supabase'

export default function OrderHistory() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders(data || [])
      } catch (err) {
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">No orders yet. Start by booking a parcel!</p>
        <a href="/customer/home" className="block mt-4 text-center text-primary hover:underline">
          Book Now
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-sm font-mono text-gray-600">Order #{order.id.slice(-8)}</span>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">To:</span> {order.receiver_name}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Destination:</span> {order.destination_country}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Weight:</span> {order.weight} kg
              </p>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-lg font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</span>
              <a
                href={`/tracking?orderId=${order.id}`}
                className="text-sm text-primary hover:underline"
              >
                Track Order
              </a>
            </div>
            {order.status === 'pending' && !order.razorpay_payment_id && (
              <button
                onClick={() => router.push(`/checkout?orderId=${order.id}`)}
                className="mt-3 w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark text-sm"
              >
                Pay Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
