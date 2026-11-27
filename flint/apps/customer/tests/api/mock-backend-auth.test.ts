import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const MOCK_PORT = 4997
const BASE_URL = `http://127.0.0.1:${MOCK_PORT}`
const MOCK_SERVER = fileURLToPath(new URL('../../../../scripts/demo/mock-backend.mjs', import.meta.url))

let serverProcess: ReturnType<typeof spawn> | null = null

const startServer = (): ReturnType<typeof spawn> =>
  spawn(process.execPath, [MOCK_SERVER], {
    env: { ...process.env, PORT: String(MOCK_PORT) },
    stdio: 'ignore',
  })

const stopServer = async (): Promise<void> => {
  if (!serverProcess) return
  serverProcess.kill('SIGTERM')
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 5000)
    serverProcess?.once('exit', () => {
      clearTimeout(timer)
      resolve(null)
    })
  })
}

const waitForServer = async (timeoutMs = 15000): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/auth/v1/user`)
      if (res) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('mock backend did not start in time')
}

describe('mock backend auth endpoints', () => {
  beforeAll(async () => {
    serverProcess = startServer()
    await waitForServer()
  }, 20000)

  afterAll(async () => {
    await stopServer()
  })

  it('rejects token requests with unsupported grant type', async () => {
    const res = await fetch(`${BASE_URL}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo.courier@example.com', password: 'courier-demo' }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('unsupported_grant_type')
  })

  it('exchanges a demo password grant for a session', async () => {
    const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo.courier@example.com', password: 'courier-demo' }),
    })
    expect(res.status).toBe(200)
    const session = (await res.json()) as {
      access_token: string
      token_type: string
      expires_in: number
      refresh_token: string
      user: { email: string }
    }
    expect(session.access_token).toBe('demo-customer-token')
    expect(session.token_type).toBe('bearer')
    expect(session.expires_in).toBeGreaterThan(0)
    expect(typeof session.refresh_token).toBe('string')
    expect(session.refresh_token.length).toBeGreaterThan(0)
    expect(session.user.email).toBe('demo.courier@example.com')
  })

  it('rejects a wrong password with invalid_grant', async () => {
    const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo.courier@example.com', password: 'wrong-password' }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('invalid_grant')
  })

  it('accepts demo logout', async () => {
    const res = await fetch(`${BASE_URL}/auth/v1/logout`, { method: 'POST' })
    expect(res.status).toBe(204)
  })
})