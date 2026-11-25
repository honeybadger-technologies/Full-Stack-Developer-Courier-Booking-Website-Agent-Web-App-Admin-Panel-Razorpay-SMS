import Link from 'next/link'
import { supabase } from '@cbp/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [todayPickups, setTodayPickups] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (!session?.user) {
        router.push('/auth/login')
        return
      }

      // Check if user is an agent
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'agent') {
        router.push('/auth/login')
      }
    }

    checkSession()
  }, [router])

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="layout-container">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-lg font-bold text-primary">
            Agent App
          </Link>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-primary">{todayPickups}</span> pickups today
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/auth/login')
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-20">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 text-center text-gray-500 text-sm">
        Courier Agent App - India Post
      </footer>
    </div>
  )
}
