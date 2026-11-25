'use client'

import Link from 'next/link'
import { supabase } from '@cbp/supabase'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CustomerLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isAuthRoute = !!pathname?.startsWith('/auth')
  const isPublicRoute = !!pathname?.startsWith('/tracking')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (!session?.user && !isAuthRoute && !isPublicRoute) {
        router.push('/auth/login')
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (!session?.user && !isAuthRoute && !isPublicRoute) {
        router.push('/auth/login')
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [router, isAuthRoute, isPublicRoute])

  if (isAuthRoute || isPublicRoute) {
    return <>{children}</>
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="layout-container">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Courier Booking
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

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Courier Booking Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}