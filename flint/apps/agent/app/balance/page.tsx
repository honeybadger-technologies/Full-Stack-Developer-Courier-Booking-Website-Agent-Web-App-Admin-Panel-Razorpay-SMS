'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'

// Force dynamic rendering for pages that use useSearchParams
export const dynamic = 'force-dynamic'

function BalancePaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pickupId = searchParams?.get('pickupId')
  const orderId = searchParams?.get('orderId')
  const diff = parseFloat(searchParams?.get('diff') || '0')

  const [loading, setLoading] = useState(false)
  const [paymentSent, setPaymentSent] = useState(false)
  const [smsLink, setSmsLink] = useState('')
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    if (!orderId) return
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrderData(data)
    } catch (err) {
      console.error('Error fetching order:', err)
    }
  }

  const handleSendPaymentLink = async () => {
    setLoading(true)

    try {
      const amount = Math.abs(diff * 100) // Assuming ₹100/kg rate

      // Create Razorpay order
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          diff,
        }),
      })

      const data = await response.json()

      if (data.paymentLink) {
        setSmsLink(data.paymentLink)
        setPaymentSent(true)

        // Send SMS with payment link
        await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: orderData?.phone,
            message: `Balance payment link for your parcel: ${data.paymentLink}`,
          }),
        })
      }
    } catch (err) {
      console.error('Error sending payment link:', err)
      alert('Failed to send payment link. Please contact support.')
    } finally {
      setLoading(false)
    }
  }

  if (!orderData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isCredit = diff < 0
  const amount = Math.abs(diff * 100)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Weight Difference</h1>

      <div className={`p-6 rounded-lg mb-6 text-center ${
        isCredit
          ? 'bg-green-50 border border-green-200'
          : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <h2 className="text-lg font-medium mb-2">
          {isCredit ? 'Customer Credit' : 'Additional Charge'}
        </h2>
        <p className="text-sm text-gray-600">Original: {orderData.weight} kg</p>
        <p className="text-sm text-gray-600">Actual: {orderData.weight + diff} kg</p>
        <p className="text-4xl font-bold mt-4">
          {isCredit ? '-' : '+'}₹{amount.toFixed(2)}
        </p>
      </div>

      {!paymentSent ? (
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-lg font-medium mb-3">Send Payment Link to Customer</h3>
          <p className="text-gray-700 mb-4 text-sm">
            An SMS with a payment link will be sent to the customer&apos;s registered phone number.
          </p>
          <button
            onClick={handleSendPaymentLink}
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Payment Link via SMS'}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-medium text-green-900 mb-2">Payment Link Sent!</h3>
          <p className="text-green-700 text-sm mb-4">
            Customer has been notified via SMS with the payment link.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Mark as Complete
          </button>
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
      >
        Back to Weight Entry
      </button>
    </div>
  )
}

// Wrap the component with Suspense
export default function BalancePaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <BalancePaymentPageContent />
    </Suspense>
  )
}
