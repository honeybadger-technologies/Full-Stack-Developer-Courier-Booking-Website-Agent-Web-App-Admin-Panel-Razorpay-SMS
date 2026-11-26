import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/sms/send/route'

const BASE_URL = 'http://localhost:3000'

function makeRequest(path: string, init?: RequestInit) {
  return new Request(`${BASE_URL}${path}`, init)
}

describe('POST /api/sms/send (agent)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 400 when phone or message is missing', async () => {
    const res = await POST(
      makeRequest('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9999999999' }),
      })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'phone and message are required' })
  })

  it('sends the SMS through the configured gateway', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ type: 'success', messageId: 'msg91_agent_1' }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await POST(
      makeRequest('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '9999999999', message: 'Please complete the pickup payment' }),
      })
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, msg91Id: 'msg91_agent_1' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})