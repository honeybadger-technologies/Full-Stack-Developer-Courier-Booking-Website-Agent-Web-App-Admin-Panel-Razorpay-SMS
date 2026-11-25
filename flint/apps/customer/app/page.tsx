import { redirect } from 'next/navigation'
import { supabase } from '@cbp/supabase'
import { CustomerHomeWrapper } from '../components/customer-home-wrapper'

export default async function CustomerHome() {
  const { data: { session } } = await supabase.auth.getSession()

  // If user is not logged in, redirect to login
  if (!session?.user) {
    redirect('/auth/login')
  }

  return <CustomerHomeWrapper />
}
