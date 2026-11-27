'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@cbp/supabase'
import { getDemoCheckoutBaseUrl, isDemoCheckoutEnabled, runDemoPayment } from '../../lib/demo-checkout'

const RAZORPAY_CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
const RAZORPAY_LIVE_BASE_URL = 'https://api.razorpay.com/v1'
const DEMO_CHECKOUT_NOT_CONFIGURED = 'Demo checkout is not configured for this environment. Please contact support.'

type Phase = 'idle' | 'creating' | 'demo' | 'verifying' | 'success' | 'error'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams?.get('orderId') || ''
  const demoCheckout = isDemoCheckoutEnabled({
    NEXT_PUBLIC_DEMO_CHECKOUT: process.env.NEXT_PUBLIC_DEMO_CHECKOUT,
  })
  const demoBaseUrl = getDemoCheckoutBaseUrl({
    NEXT_PUBLIC_RAZORPAY_BASE_URL: process.env.NEXT_PUBLIC_RAZORPAY_BASE_URL,
  })

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
    if (demoCheckout && !demoBaseUrl) {
      setError(DEMO_CHECKOUT_NOT_CONFIGURED)
      setPhase('error')
      return
    }
    setPhase('creating')
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const result = await runDemoPayment({
        orderId,
        amount: Math.round(Number(order.total_amount || 0) * 100),
        baseUrl: demoBaseUrl,
        authToken: token || '',
        fetchFn: fetch,
      })
      setRazorpayOrderId(result.razorpayOrderId)
      setRazorpayPaymentId(result.razorpayPaymentId)
      setRazorpaySignature(result.razorpaySignature)
      setPhase('success')
    } catch (err: any) {
      setError(err?.message || 'We could not complete the payment. Please try again.')
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
                <p className="text-green-700 font-medium">Payment received</p>
                <Link
                  href="/customer/home"
                  className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md text-center hover:bg-green-700 block"
                >
                  Back to Orders
                </Link>
              </div>
            ) : (
              <button
                onClick={() => (demoCheckout ? handleDemoCheckout() : openRazorpayCheckout())}
                disabled={phase === 'creating' || phase === 'demo' || phase === 'verifying'}
                className="w-full bg-primary text-white px-4 py-3 rounded-md hover:bg-primary-dark disabled:opacity-50"
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
                {demoCheckout ? (demoBaseUrl ? 'Demo mode: payment is captured by the mock backend.' : DEMO_CHECKOUT_NOT_CONFIGURED) : 'Live Razorpay checkout will be used.'}
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