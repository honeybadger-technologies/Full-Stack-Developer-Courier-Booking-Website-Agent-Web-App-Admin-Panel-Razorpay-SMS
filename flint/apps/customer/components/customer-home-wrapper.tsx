'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@cbp/supabase'
import Link from 'next/link'
import { PriceCalculator } from './price-calculator'
import { BookingForm } from './booking-form'
import OrderHistory from './order-history'

export function CustomerHomeWrapper() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      setUser(user)

      if (!user) {
        router.push('/auth/login')
      }
      setLoading(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setUser(user)
      if (!user) {
        router.push('/auth/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Calculate Your Shipping Cost</h2>
            <PriceCalculator />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Book a New Parcel</h2>
            <BookingForm />
          </section>
        </div>

        <div className="lg:col-span-1">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Orders</h2>
            <OrderHistory />
          </section>

          <div className="mt-8 bg-primary-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Need Help?</h3>
            <p className="text-primary-800 text-sm mb-4">
              Contact our support team for assistance with your shipment.
            </p>
            <a href="mailto:support@courier.com" className="text-primary-600 hover:underline text-sm">
              support@courier.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
