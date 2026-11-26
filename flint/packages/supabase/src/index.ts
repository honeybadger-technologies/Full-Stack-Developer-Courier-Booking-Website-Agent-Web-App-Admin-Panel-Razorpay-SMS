import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session, User, WebSocketLikeConstructor } from '@supabase/supabase-js';

// Lazy initialization - client is created on first access
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;
let isInitialized = false;

function getSupabaseUrl() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  }
  return '';
}

function getSupabaseAnonKey() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  }
  return '';
}

function getSupabaseServiceKey() {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.SUPABASE_SERVICE_KEY || '';
  }
  return '';
}

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

// Create Supabase client (lazy initialization)
// This function always returns a valid client (possibly a mock if not configured)
function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance && !isInitialized) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();

    if (!url || !key) {
      console.warn('Supabase client not initialized: missing URL or key');
      console.warn('NEXT_PUBLIC_SUPABASE_URL:', url ? 'set' : 'missing');
      console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'set' : 'missing');
      // Return a minimal mock client that throws on use
      supabaseInstance = {
        auth: {
          getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
          getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
          onAuthStateChange: () => ({ data: { subscription: null } }),
          signOut: async () => ({ error: new Error('Supabase not configured') }),
        },
        from: (table: string) => ({
          select: (columns: string) => ({
            eq: (column: string, value: any) => ({
              single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            }),
          }),
        }),
        rpc: (fn: string, params?: any) => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      } as unknown as SupabaseClient;
    } else {
      supabaseInstance = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
        realtime: { transport: ServerWebSocketStub as unknown as WebSocketLikeConstructor },
      });
    }
    isInitialized = true;
  }
  return supabaseInstance as SupabaseClient;
}

// Server-side client with service key for admin operations
function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseAdminInstance && !isInitialized) {
    const url = getSupabaseUrl();
    const key = getSupabaseServiceKey();

    if (url && key) {
      supabaseAdminInstance = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        realtime: { transport: ServerWebSocketStub as unknown as WebSocketLikeConstructor },
      });
    } else {
      supabaseAdminInstance = null;
    }
    isInitialized = true;
  }
  return supabaseAdminInstance;
}

// Export the client - will be initialized on first access
export const supabase = getSupabaseClient();

// Server-side client with service key for admin operations
export const supabaseAdmin: SupabaseClient | null = getSupabaseAdminClient();

// Re-export types
export type { Session, User };

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// Helper function to check if user has specific role
export async function hasRole(role: 'customer' | 'agent' | 'admin'): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Get user role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === role;
}

// Helper function to get current user's role
export async function getUserRole(): Promise<'customer' | 'agent' | 'admin' | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role || null;
}
