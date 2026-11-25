'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'

export default function CN22PrintPage() {
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

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1 className="text-center text-2xl font-bold mb-2">CN22/CN23 Customs Declaration</h1>
      <p className="text-center text-sm text-gray-500 mb-8">For International Parcels</p>

      {/* CN22 Form */}
      <div className="border-2 border-black p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-lg">CN22 Form</h2>
          <div className="text-sm">Form Type: CN22 (under 2kg) / CN23 (2kg+)</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold">1. Sender Name and Address</label>
            <div className="border-b border-gray-300 h-16"></div>
            <p className="text-xs text-gray-500 mt-1">Sender&apos;s full name and address</p>
          </div>

          <div>
            <label className="block text-xs font-bold">2. Receiver Name and Address</label>
            <div className="border-b border-gray-300 h-16"></div>
            <p className="text-xs text-gray-500 mt-1">Recipient&apos;s full name and address</p>
          </div>

          <div>
            <label className="block text-xs font-bold">3. Item Description</label>
            <div className="border-b border-gray-300 h-8"></div>
            <p className="text-xs text-gray-500 mt-1">Detailed description of contents</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-bold">4. Quantity</label>
              <div className="border-b border-gray-300 h-8"></div>
            </div>
            <div>
              <label className="block text-xs font-bold">5. Value (USD)</label>
              <div className="border-b border-gray-300 h-8"></div>
            </div>
            <div>
              <label className="block text-xs font-bold">6. Weight (kg)</label>
              <div className="border-b border-gray-300 h-8"></div>
            </div>
            <div>
              <label className="block text-xs font-bold">7. Harmonized Code</label>
              <div className="border-b border-gray-300 h-8"></div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold">8. Reason for Export</label>
            <div className="border-b border-gray-300 h-8"></div>
            <p className="text-xs text-gray-500 mt-1">Gift / Documentary / Commercial</p>
          </div>

          <div>
            <label className="block text-xs font-bold">9. Country of Origin</label>
            <div className="border-b border-gray-300 h-8"></div>
            <p className="text-xs text-gray-500 mt-1">India</p>
          </div>

          {/* Declaration */}
          <div className="border-t-2 border-black pt-4 mt-4">
            <p className="text-xs mb-2">
              I hereby declare that the above information is true and correct and that the contents
              of this parcel comply with the postal regulations of both the country of origin and
              destination.
            </p>
            <div className="flex justify-between">
              <div className="border-b border-gray-300 w-1/2">
                <p className="text-xs text-gray-500 mt-1">Sender&apos;s Signature</p>
              </div>
              <div className="border-b border-gray-300 w-1/3">
                <p className="text-xs text-gray-500 mt-1">Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CN23 Form (for items over 2kg or commercial value) */}
      <div className="border-2 border-black p-6">
        <h2 className="font-bold text-lg mb-4">CN23 Form (Additional Information)</h2>
        <p className="text-sm text-gray-600 mb-4">
          For parcels weighing over 2kg or with commercial value exceeding $200
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold">Consignee:</label>
            <div className="border-b border-gray-300 h-8"></div>
          </div>
          <div>
            <label className="block text-xs font-bold">Consignor:</label>
            <div className="border-b border-gray-300 h-8"></div>
          </div>
          <div>
            <label className="block text-xs font-bold">Item Description:</label>
            <div className="border-b border-gray-300 h-8"></div>
          </div>
          <div>
            <label className="block text-xs font-bold">Commercial Value (USD):</label>
            <div className="border-b border-gray-300 h-8"></div>
          </div>
          <div>
            <label className="block text-xs font-bold">Origin:</label>
            <div className="border-b border-gray-300 h-8"></div>
          </div>
          <div className="flex justify-between">
            <div>
              <label className="block text-xs font-bold">Customs Value:</label>
              <div className="border-b border-gray-300 h-8"></div>
            </div>
            <div>
              <label className="block text-xs font-bold">Taxes/Duties Paid:</label>
              <div className="border-b border-gray-300 h-8"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-x-4">
        <button
          onClick={() => window.print()}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark"
        >
          Print Customs Forms
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
