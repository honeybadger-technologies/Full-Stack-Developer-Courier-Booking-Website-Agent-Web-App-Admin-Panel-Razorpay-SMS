'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@cbp/supabase'
import { formatPickupCount, formatPickupDate } from '../../lib/format'

export default function AgentDashboard() {
  const [pickups, setPickups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (!session?.user) {
        setLoading(false)
        router.push('/auth/login')
        return
      }

      fetchPickups(session.user.id)
    }

    checkSession()
  }, [router])

  const fetchPickups = async (agentId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('agent_pickups')
        .select(`*, orders(*)`)
        .eq('agent_id', agentId)
        .eq('status', 'scheduled')
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setPickups(data || [])
    } catch (err) {
      console.error('Error fetching pickups:', err)
      setError('We could not load your pickups. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-amber-100 text-amber-800'
      case 'picked_up': return 'bg-blue-100 text-blue-800'
      case 'handed_over': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-primary text-white p-4 rounded-lg mb-6">
        <h1 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Agent!</h1>
        <p className="text-primary-100">You have {formatPickupCount(pickups.length)} scheduled for today</p>
      </div>

      {pickups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900">No pickups scheduled</h3>
          <p className="text-gray-500 mt-2">New orders will appear here when assigned to you</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Pickups</h2>
          {pickups.map((pickup) => (
            <div key={pickup.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-sm font-mono text-gray-600">
                    Order #{pickup.orders?.id}
                  </span>
                  <h3 className="text-base font-medium text-gray-900">{pickup.orders?.receiver_name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pickup.status)}`}>
                  {pickup.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <p>{pickup.orders?.receiver_address}</p>
                <p>{pickup.orders?.destination_country}</p>
                <p>Weight: {pickup.orders?.weight} kg</p>
                <p>Pickup date: {formatPickupDate(pickup.orders?.scheduled_pickup_date || pickup.created_at)}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/scan?pickupId=${pickup.id}`}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-center hover:bg-primary-dark"
                >
                  Scan QR
                </Link>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.orders?.receiver_address || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  🗺️
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
