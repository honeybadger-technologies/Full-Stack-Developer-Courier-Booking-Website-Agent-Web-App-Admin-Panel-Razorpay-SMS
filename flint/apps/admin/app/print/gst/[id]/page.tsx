'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'

export default function GSTInvoicePrintPage() {
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

  const gstRate = 18
  const cgst = (order.total_amount * gstRate) / (2 * 100)
  const sgst = cgst
  const totalWithGST = order.total_amount + cgst + sgst

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">GST Invoice</h1>
        <p className="text-lg text-gray-600">Commercial Invoice</p>
        <p className="text-sm text-gray-500 mt-2">Invoice No: {order.id.slice(-8)}-{new Date().getFullYear()}</p>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold text-lg mb-4">Bill To (Customer)</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Name:</span>
              <span className="font-medium">{order.customer_id.slice(-8)}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Address:</span>
              <span className="font-medium">Customer Location</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">GSTIN:</span>
              <span className="font-medium">Unregistered</span>
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-bold text-lg mb-4">Ship To (Receiver)</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Name:</span>
              <span className="font-medium">{order.receiver_name}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Address:</span>
              <span className="font-medium">{order.receiver_address}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Country:</span>
              <span className="font-medium">{order.destination_country}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left text-sm">Description</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm">HSN/SAC</th>
            <th className="border border-gray-300 px-4 py-2 text-right text-sm">Qty</th>
            <th className="border border-gray-300 px-4 py-2 text-right text-sm">Rate</th>
            <th className="border border-gray-300 px-4 py-2 text-right text-sm">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 px-4 py-2 text-sm">
              International Courier Service - {order.destination_country}
            </td>
            <td className="border border-gray-300 px-4 py-2 text-sm">9954</td>
            <td className="border border-gray-300 px-4 py-2 text-right text-sm">1</td>
            <td className="border border-gray-300 px-4 py-2 text-right text-sm">₹{order.total_amount.toFixed(2)}</td>
            <td className="border border-gray-300 px-4 py-2 text-right text-sm">₹{order.total_amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Tax Details */}
      <div className="mb-8">
        <table className="w-full max-w-md border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                <strong>Taxable Amount:</strong>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                ₹{order.total_amount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                CGST {gstRate / 2}%:
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                ₹{cgst.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                SGST {gstRate / 2}%:
              </td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                ₹{sgst.toFixed(2)}
              </td>
            </tr>
            <tr className="font-bold text-lg">
              <td className="border border-gray-300 px-4 py-2 text-right">Total:</td>
              <td className="border border-gray-300 px-4 py-2 text-right text-primary">
                ₹{totalWithGST.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">Terms and Conditions:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>This is a computer-generated invoice and does not require signature.</li>
          <li>Payment is due within 7 days of invoice date.</li>
          <li>Interest will be charged at 18% per annum on overdue payments.</li>
          <li>GST is payable as per Indian GST laws.</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black pt-4">
        <div className="flex justify-between">
          <div className="text-sm">
            <p className="font-bold">Authorized Signature</p>
            <p className="text-xs mt-4">Courier Booking Platform</p>
          </div>
          <div className="text-sm text-right">
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p className="mt-2">Place: Delhi, India</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-x-4">
        <button
          onClick={() => window.print()}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark"
        >
          Print GST Invoice
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
