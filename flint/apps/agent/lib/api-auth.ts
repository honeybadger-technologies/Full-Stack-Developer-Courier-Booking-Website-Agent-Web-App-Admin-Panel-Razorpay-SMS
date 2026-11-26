import { createClient, type SupabaseClient, type User, type WebSocketLikeConstructor } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey

// Minimal WebSocket transport stub. Server-side usage never opens realtime
// channels, and Node.js runtimes without a native WebSocket global must not
// eagerly instantiate the realtime client.
class ServerWebSocketStub {
  static readonly CONNECTING: number = 0
  static readonly OPEN: number = 1
  static readonly CLOSING: number = 2
  static readonly CLOSED: number = 3
  readonly readyState = 0
  readonly url = ''
  readonly protocol = ''
  close(_code?: number, _reason?: string) {}
  send(_data: string) {}
  onopen: ((this: unknown, ev: Event) => unknown) | null = null
  onmessage: ((this: unknown, ev: MessageEvent) => unknown) | null = null
  onclose: ((this: unknown, ev: CloseEvent) => unknown) | null = null
  onerror: ((this: unknown, ev: Event) => unknown) | null = null
  addEventListener(_type: string, _listener: EventListener) {}
  removeEventListener(_type: string, _listener: EventListener) {}
  dispatchEvent(_event: Event) {
    return false
  }
}

function makeClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key) {
    return null
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ServerWebSocketStub as unknown as WebSocketLikeConstructor },
  })
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