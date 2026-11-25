import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey

function makeClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key) {
    return null
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

const anonClient = makeClient(supabaseUrl, supabaseAnonKey)
const adminClient = makeClient(supabaseUrl, supabaseServiceKey)

export async function getAuthUser(request: Request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  if (!token) {
    return { user: null as User | null, error: 'missing bearer token' }
  }
  const result = anonClient
    ? await anonClient.auth.getUser(token)
    : { data: { user: null }, error: new Error('Supabase not configured') }
  return { user: result.data.user ?? null, error: result.error }
}

export function getSupabaseAdmin(): SupabaseClient | null {
  return adminClient
}