'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'
import { Html5Qrcode } from 'html5-qrcode'

// Force dynamic rendering for pages that use useSearchParams
export const dynamic = 'force-dynamic'

function ScanPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pickupId = searchParams?.get('pickupId')

  const [scanner, setScanner] = useState<any>(null)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    if (!pickupId) return

    const initScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode('qr-reader')
        setScanner(html5Qrcode)

        const qrCallback = (decodedText: string) => {
          handleQrScan(decodedText)
          if (html5Qrcode) {
            html5Qrcode.stop()
          }
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 } }
        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          qrCallback,
          (error: any) => {
            console.error('Scan error:', error)
            setError('Camera access denied or not available')
          }
        )
      } catch (err) {
        setError('Camera access denied or not available')
        console.error('Scanner error:', err)
      }
    }

    initScanner()

    return () => {
      scanner?.stop().catch(() => {})
    }
  }, [pickupId])

  const handleQrScan = async (qrData: string) => {
    setLoading(true)
    setError(null)

    try {
      const parsedData = JSON.parse(qrData)
      const orderId = parsedData.orderId || parsedData

      // Fetch order details
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrderData(order)

      // Update pickup with scanned QR
      const { error: updateError } = await supabase
        .from('agent_pickups')
        .update({ scanned_qr: qrData, status: 'picked_up' })
        .eq('id', pickupId)

      if (updateError) throw updateError

      // Redirect to weight entry
      router.push(`/weight?pickupId=${pickupId}&orderId=${orderId}`)
    } catch (err: any) {
      setError('Invalid order or scan failed')
      console.error('Scan error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fallback manual search
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const nameOrPhone = formData.get('search') as string

    if (!nameOrPhone) return

    setLoading(true)
    setError(null)

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .or(`receiver_name.ilike.%${nameOrPhone}%,phone.ilike.%${nameOrPhone}%`)
        .limit(1)
        .single()

      if (error) throw error
      setOrderData(order)
      router.push(`/weight?pickupId=${pickupId}&orderId=${order.id}`)
    } catch (err: any) {
      setError('Order not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Scan QR Sticker</h1>

      <div id="qr-reader" className="w-full h-64 bg-black rounded-lg mb-4"></div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {orderData && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <h3 className="font-medium text-green-900">Order Found!</h3>
          <p>Receiver: {orderData.receiver_name}</p>
          <p>Destination: {orderData.destination_country}</p>
          <p>Weight: {orderData.weight} kg</p>
          <button
            onClick={() => router.push(`/weight?pickupId=${pickupId}&orderId=${orderData.id}`)}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Continue to Weight Entry
          </button>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-medium mb-2">Manual Search</h2>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search by name or phone"
            className="flex-1 px-3 py-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="mt-6 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
      >
        Back to Dashboard
      </button>
    </div>
  )
}

// Wrap the component with Suspense
export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <ScanPageContent />
    </Suspense>
  )
}
