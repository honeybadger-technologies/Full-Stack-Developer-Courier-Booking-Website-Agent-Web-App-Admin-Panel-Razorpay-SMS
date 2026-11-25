'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'

export default function StickerPrintPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
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

  // Generate QR-like data (in production, use a QR library to generate actual QR code)
  const qrData = JSON.stringify({
    orderId: order.id,
    receiverName: order.receiver_name,
    destination: order.destination_country,
  })

  return (
    <div className="bg-white p-4 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1 className="text-center text-2xl font-bold mb-6">Courier Sticker</h1>

      {/* A6 Sticker Size: 105mm x 148mm */}
      <div className="border-2 border-black p-6 relative w-[248px] h-[350px]" style={{ width: '248px', height: '350px' }}>
        {/* Order ID */}
        <div className="text-center mb-4">
          <div className="text-xs text-gray-600 uppercase">Order ID</div>
          <div className="text-xl font-mono font-bold">{order.id.slice(-12)}</div>
        </div>

        {/* QR Code Placeholder */}
        <div className="text-center mb-4">
          <div className="text-xs text-gray-600 uppercase mb-1">Scan to Track</div>
          <div className="w-24 h-24 bg-black mx-auto text-white flex items-center justify-center text-xs p-1">
            QR CODE
          </div>
          <div className="text-[10px] text-gray-600 mt-1 truncate">
            {order.id.slice(-8)}-{order.destination_country.slice(0, 3)}
          </div>
        </div>

        {/* Receiver Details */}
        <div className="border-t-2 border-black pt-4">
          <div className="text-xs text-gray-600 uppercase mb-1">Recipient</div>
          <div className="font-bold text-lg">{order.receiver_name}</div>
          <div className="text-sm">{order.receiver_address}</div>
          <div className="text-sm">{order.destination_country}</div>
        </div>

        {/* Package Info */}
        <div className="border-t-2 border-black pt-4 mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-600 uppercase">Weight</div>
              <div className="font-medium">{order.weight} kg</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 uppercase">Value</div>
              <div className="font-medium">₹{order.total_amount.toFixed(2)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-600 uppercase">Shipping To</div>
              <div className="font-medium">{order.destination_country}</div>
            </div>
          </div>
        </div>

        {/* India Post Tracking */}
        {order.india_post_tracking_number && (
          <div className="border-t-2 border-black pt-4 mt-4 text-center">
            <div className="text-xs text-gray-600 uppercase mb-1">India Post Tracking</div>
            <div className="font-mono font-bold text-lg">{order.india_post_tracking_number}</div>
            <a
              href={`https://www.indiapost.gov.in/psignontrack.aspx?consignmentno=${order.india_post_tracking_number}`}
              target="_blank"
              className="text-xs text-blue-600 mt-1 block"
            >
              Track on India Post
            </a>
          </div>
        )}

        {/* Bottom Barcodes Placeholder */}
        <div className="border-t border-black pt-4 mt-auto">
          <div className="text-center">
            <div className="h-6 bg-black w-full opacity-20"></div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center space-x-4">
        <button
          onClick={() => window.print()}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark"
        >
          Print Sticker
        </button>
        <button
          onClick={() => router.back()}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
