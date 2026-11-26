'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@cbp/supabase'

// Force dynamic rendering for pages that use useSearchParams
export const dynamic = 'force-dynamic'

function WeightEntryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pickupId = searchParams?.get('pickupId')
  const orderId = searchParams?.get('orderId')

  const [actualWeight, setActualWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<any>(null)
  const [priceDifference, setPriceDifference] = useState<number | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/auth/login')
        return
      }
      if (orderId) fetchOrderDetails()
    }
    checkSession()
  }, [orderId, router])

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      setOrderData(data)

      // Calculate price difference if weights differ
      if (data.weight && actualWeight) {
        const diff = parseFloat(actualWeight) - data.weight
        setPriceDifference(diff * 100) // Assuming ₹100/kg rate adjustment
      }
    } catch (err) {
      console.error('Error fetching order:', err)
    }
  }

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!actualWeight || !pickupId) return

    setLoading(true)
    setError(null)

    try {
      const actualWeightNum = parseFloat(actualWeight)
      const originalWeight = orderData?.weight || 0
      const weightDiff = actualWeightNum - originalWeight

      // Update pickup with actual weight
      const { error: pickupError } = await supabase
        .from('agent_pickups')
        .update({
          actual_weight: actualWeightNum,
          status: 'picked_up'
        })
        .eq('id', pickupId)

      if (pickupError) throw pickupError

      // If weight differs, create balance payment
      if (Math.abs(weightDiff) > 0.1) {
        // Update order total based on new weight
        const { error: orderError } = await supabase
          .from('orders')
          .update({ weight: actualWeightNum })
          .eq('id', orderId)

        if (orderError) throw orderError

        // Redirect to balance payment
        router.push(`/balance?pickupId=${pickupId}&orderId=${orderId}&diff=${weightDiff}`)
      } else {
        // No weight difference, just mark as picked up
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError('Failed to update weight. Please try again.')
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

  const weightDiff = actualWeight ? parseFloat(actualWeight) - orderData.weight : 0

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Enter Actual Weight</h1>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Original Order Details</h3>
        <p className="text-sm">Receiver: {orderData.receiver_name}</p>
        <p className="text-sm">Scheduled Weight: {orderData.weight} kg</p>
        <p className="text-sm">Destination: {orderData.destination_country}</p>
      </div>

      <form onSubmit={handleWeightSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actual Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={actualWeight}
            onChange={(e) => {
              setActualWeight(e.target.value)
              const diff = parseFloat(e.target.value) - orderData.weight
              setPriceDifference(diff * 100)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter actual weight"
            autoFocus
          />
        </div>

        {Math.abs(weightDiff) > 0.1 && (
          <div className={`p-4 rounded-lg ${weightDiff > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <h4 className="font-medium mb-2">
              {weightDiff > 0 ? 'Additional Charge' : 'Refund Due'}
            </h4>
            <p className="text-lg font-bold">
              {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(2)} kg
            </p>
            <p className="text-lg font-bold">
              {weightDiff > 0 ? '₹' : '-'}{Math.abs(priceDifference || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Customer will be charged/credited via SMS payment link
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !actualWeight}
          className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Mark Picked Up'}
        </button>
      </form>

      <button
        onClick={() => router.back()}
        className="mt-4 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
      >
        Back to Scan
      </button>
    </div>
  )
}

// Wrap the component with Suspense
export default function WeightEntryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <WeightEntryPageContent />
    </Suspense>
  )
}
