'use client'

import Link from 'next/link'
import { supabase } from '@cbp/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const [activePage, setActivePage] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      // Check if user is an admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/auth/login')
      }
    }

    checkSession()
    fetchStats()
  }, [router])

  const fetchStats = async () => {
    try {
      const { data: orders } = await supabase.from('orders').select('count', { count: 'exact' })
      const { data: customers } = await supabase.from('profiles').select('count', { count: 'exact' }).eq('role', 'customer')
      const { data: agents } = await supabase.from('profiles').select('count', { count: 'exact' }).eq('role', 'agent')
      const { data: pendingOrders } = await supabase.from('orders').select('count', { count: 'exact' }).eq('status', 'pending')

      setStats({
        totalOrders: orders?.[0]?.count || 0,
        totalCustomers: customers?.[0]?.count || 0,
        totalAgents: agents?.[0]?.count || 0,
        pendingOrders: pendingOrders?.[0]?.count || 0,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const navLinks = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Orders', href: '/admin/orders' },
    { name: 'Customers', href: '/admin/customers' },
    { name: 'Agents', href: '/admin/agents' },
    { name: 'Rates', href: '/admin/rates' },
  ]

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="layout-container">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/admin" className="text-xl font-bold text-primary">
            Admin Panel
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/auth/login')
              }}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="sidebar">
          <nav>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={activePage === link.href ? 'active' : ''}
                onClick={() => setActivePage(link.href)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-primary">{stats.totalCustomers}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Agents</p>
                <p className="text-2xl font-bold text-primary">{stats.totalAgents}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-warning">{stats.pendingOrders}</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
