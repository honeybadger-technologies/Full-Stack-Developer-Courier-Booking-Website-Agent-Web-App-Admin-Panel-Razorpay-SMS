import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTransport } from 'nodemailer'
import { POST } from '../../app/api/notifications/email/route'

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn(async () => ({ messageId: 'mock-smtp-message-id' })),
  })),
}))

const BASE_URL = 'http://localhost:3000'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

describe('POST /api/notifications/email', () => {
  beforeEach(() => {
    vi.mocked(createTransport).mockClear()
  })

  it('returns 400 when to, subject or body is missing', async () => {
    const res = await POST(
      makeRequest('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'demo@courier.com' }),
      })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'to, subject and body are required' })
  })

  it('sends the email through the configured transport', async () => {
    const res = await POST(
      makeRequest('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'demo@courier.com',
          subject: 'Order confirmed',
          body: 'Your courier booking is confirmed.',
        }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, messageId: 'mock-smtp-message-id' })
    expect(vi.mocked(createTransport)).toHaveBeenCalled()
  })
})