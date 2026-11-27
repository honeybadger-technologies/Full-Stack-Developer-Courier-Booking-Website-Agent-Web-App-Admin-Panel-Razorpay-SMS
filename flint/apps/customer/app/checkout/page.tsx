'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'
import { isDemoCheckoutEnabled } from '../../lib/demo-checkout'

const RAZORPAY_CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
const RAZORPAY_BASE_URL = process.env.NEXT_PUBLIC_RAZORPAY_BASE_URL || 'https://api.razorpay.com/v1'

type Phase = 'idle' | 'creating' | 'demo' | 'verifying' | 'success' | 'error'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId') || ''
  const demoCheckout = isDemoCheckoutEnabled()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [razorpayOrderId, setRazorpayOrderId] = useState('')
  const [razorpayPaymentId, setRazorpayPaymentId] = useState('')
  const [razorpaySignature, setRazorpaySignature] = useState('')

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    const fetchOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('unauthorized')
          return
        }
        const { data, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()
        if (orderError || !data) {
          setError('order not found')
          return
        }
        setOrder(data)
        setLoading(false)
      } catch (err: any) {
        setError('failed to load order')
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const verifyPayment = async (paymentId: string, signature: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId: paymentId, razorpaySignature: signature }),
    })
    const data = await res.json()
    if (!res.ok || !data?.verified) {
      throw new Error('payment verification failed')
    }
    return true
  }

  const handleDemoCheckout = async () => {
    if (!order) return
    setPhase('creating')
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const createRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId, amount: Math.round(Number(order.total_amount || 0) * 100) }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'failed to create razorpay order')
      setRazorpayOrderId(createData.razorpayOrderId)

      setPhase('demo')
      const demoRes = await fetch(`${RAZORPAY_BASE_URL}/demo/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: createData.razorpayOrderId }),
      })
      const demoData = await demoRes.json()
      if (!demoRes.ok) throw new Error(demoData.message || 'demo checkout failed')

      const paymentId = demoData.razorpayPaymentId
      const signature = demoData.razorpaySignature
      setRazorpayPaymentId(paymentId)
      setRazorpaySignature(signature)

      setPhase('verifying')
      await verifyPayment(paymentId, signature)
      setPhase('success')
    } catch (err: any) {
      setError(err?.message || 'checkout failed')
      setPhase('error')
    }
  }

  const openRazorpayCheckout = () => {
    if (!razorpayOrderId) return
    const script = document.createElement('script')
    script.src = RAZORPAY_CHECKOUT_SCRIPT
    script.async = true
    script.onload = () => {
      const Razorpay = (window as any).Razorpay
      if (!Razorpay) {
        setError('Razorpay checkout could not be loaded')
        return
      }
      const rzp = new Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || '',
        amount: Math.round(Number(order?.total_amount || 0) * 100),
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          setPhase('verifying')
          await verifyPayment(response.paymentId, response.signature)
          setPhase('success')
        },
        modal: { ondismiss: () => setError('Razorpay checkout dismissed') },
      })
      rzp.open()
    }
    document.head.appendChild(script)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/customer/home')}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
          >
            Back to orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h1>
        {order ? (
          <>
            <p className="text-gray-600 mb-2">Order #{order.id.slice(-8)}</p>
            <p className="text-gray-600 mb-2">Destination: {order.destination_country}</p>
            <p className="text-gray-600 mb-2">Amount: ₹{Number(order.total_amount || 0).toFixed(2)}</p>
            {phase === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-700 font-medium">Payment successful!</p>
                <button
                  onClick={() => router.push('/customer/home')}
                  className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md"
                >
                  Back to orders
                </button>
              </div>
            ) : (
              <button
                onClick={() => (demoCheckout ? handleDemoCheckout() : openRazorpayCheckout())}
                disabled={phase === 'creating' || phase === 'demo' || phase === 'verifying'}
                className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                {phase === 'creating'
                  ? 'Creating payment...'
                  : phase === 'demo'
                    ? 'Demo checkout...'
                    : phase === 'verifying'
                      ? 'Verifying...'
                      : demoCheckout
                        ? 'Pay with Demo Checkout'
                        : 'Pay with Razorpay'}
              </button>
            )}
            {phase === 'idle' && (
              <p className="text-sm text-gray-500 mt-3">
                {demoCheckout ? 'Demo mode: payment is captured by the mock backend.' : 'Live Razorpay checkout will be used.'}
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500">Order not found.</p>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}