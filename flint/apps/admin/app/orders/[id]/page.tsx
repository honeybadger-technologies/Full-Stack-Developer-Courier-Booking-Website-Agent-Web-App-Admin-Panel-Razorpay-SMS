'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'

export default function OrderTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrder(data)

      if (data.india_post_tracking_number) {
        setTrackingNumber(data.india_post_tracking_number)
      }
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTracking(true)

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          india_post_tracking_number: trackingNumber,
          status: 'shipped'
        })
        .eq('id', orderId)

      if (error) throw error

      // Update shipment record
      await supabase.from('shipments').upsert({
        order_id: orderId,
        india_post_tracking_number: trackingNumber,
        status: 'booked',
      })

      setTrackingNumber('')
      await fetchOrder()
      alert('Tracking number saved! Order status updated to Shipped.')
    } catch (err) {
      console.error('Error saving tracking:', err)
      alert('Failed to save tracking number')
    } finally {
      setIsTracking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return <div className="text-center py-12">Order not found</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{orderId.slice(-8)}</h1>
          <p className="text-gray-600">{order.receiver_name}</p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Receiver</p>
            <p className="font-medium">{order.receiver_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Destination</p>
            <p className="font-medium">{order.destination_country}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Weight</p>
            <p className="font-medium">{order.weight} kg</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="font-bold text-xl text-primary">₹{order.total_amount.toFixed(2)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Receiver Address</p>
            <p className="font-medium">{order.receiver_address}</p>
          </div>
        </div>
      </div>

      {/* Tracking */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">India Post Tracking</h2>
        <form onSubmit={handleSaveTracking} className="flex gap-4">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter India Post Tracking Number"
            disabled={!!order.india_post_tracking_number}
          />
          <button
            type="submit"
            disabled={isTracking || !trackingNumber || !!order.india_post_tracking_number}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
          >
            {order.india_post_tracking_number ? 'Tracking Added' : 'Add Tracking'}
          </button>
        </form>

        {order.india_post_tracking_number && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Tracking Number: {order.india_post_tracking_number}</p>
            <a
              href={`https://www.indiapost.gov.in/psignontrack.aspx?consignmentno=${order.india_post_tracking_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on India Post Website
            </a>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6">Status Timeline</h2>
        <div className="relative pl-8 border-l-2 border-gray-200 space-y-8">
          <div className="relative">
            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
            <h4 className="font-medium">Order Placed</h4>
            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
          </div>

          <div className="relative">
            <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white ${
              ['picked_up', 'shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <h4 className={`font-medium ${['picked_up', 'shipped', 'delivered'].includes(order.status) ? 'text-green-900' : 'text-gray-500'}`}>
              Picked Up
            </h4>
            <p className="text-sm text-gray-500">Parcel collected from pickup location</p>
          </div>

          <div className="relative">
            <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white ${
              ['shipped', 'delivered'].includes(order.status) ? 'bg-purple-500' : 'bg-gray-300'
            }`}></div>
            <h4 className={`font-medium ${['shipped', 'delivered'].includes(order.status) ? 'text-purple-900' : 'text-gray-500'}`}>
              Shipped
            </h4>
            <p className="text-sm text-gray-500">Booked with India Post</p>
          </div>

          <div className="relative">
            <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-white ${
              order.status === 'delivered' ? 'bg-green-600' : 'bg-gray-300'
            }`}></div>
            <h4 className={`font-medium ${order.status === 'delivered' ? 'text-green-900' : 'text-gray-500'}`}>
              Delivered
            </h4>
            <p className="text-sm text-gray-500">Parcel successfully delivered</p>
          </div>
        </div>
      </div>

      {/* Print Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Print Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => window.print()}
            className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            Print Sticker
          </button>
          <button
            onClick={() => router.push(`/admin/documents/cn22/${orderId}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Print CN22/CN23
          </button>
          <button
            onClick={() => router.push(`/admin/documents/gst/${orderId}`)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Print GST Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
