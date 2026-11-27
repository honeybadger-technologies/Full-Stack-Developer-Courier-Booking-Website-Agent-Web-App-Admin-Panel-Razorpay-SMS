import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:4999'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-demo-key'
const EMAIL = process.env.DEMO_EMAIL || 'demo.courier@example.com'
const PASSWORD = process.env.DEMO_PASSWORD || 'courier-demo'

class ServerWebSocketStub {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3
  readyState = 0
  url = ''
  protocol = ''
  close() {}
  send() {}
  onopen = null
  onmessage = null
  onclose = null
  onerror = null
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false
  }
}

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ServerWebSocketStub },
})

const { data, error } = await supabase.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
})

if (error) {
  console.error('signInWithPassword failed:', error.message)
  process.exit(1)
}

console.log('signed in as', data.user?.email)
console.log('access_token:', data.session?.access_token)
console.log('token_type:', data.session?.token_type)
console.log('expires_in:', data.session?.expires_in)
console.log('refresh_token:', data.session?.refresh_token)