import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client bypasses RLS. Import from '@honeybadger-courier/db/server'
// in route handlers / server components only; 'server-only' fails the build
// if a client component pulls this in.
let client: SupabaseClient | undefined

export function getSupabaseService(): SupabaseClient {
  if (!client) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}
