/**
 * Demo mock backend for the Courier Booking Platform.
 *
 * Implements the external service endpoints used by the Courier Booking API so
 * the full customer flow can be exercised locally without live credentials:
 *
 *   - Supabase Auth:        GET  /auth/v1/user
 *   - Supabase REST:        GET  /rest/v1/rates
 *                           POST /rest/v1/orders
 *                           GET  /rest/v1/orders
 *                           GET  /rest/v1/orders/:id
 *                           PATCH /rest/v1/orders/:id
 *                           GET  /rest/v1/payments
 *                           POST /rest/v1/payments
 *                           GET  /rest/v1/notifications
 *                           POST /rest/v1/notifications
 *                           GET  /rest/v1/profiles
 *   - Razorpay:              POST /v1/orders
 *                           GET  /v1/payments/:id
 *   - MSG91:                 POST /sms/v3/sendText
 *
 * Start with:  node scripts/demo/mock-backend.mjs
 * (defaults to http://127.0.0.1:4999, override with PORT)
 */
import { createServer } from 'node:http'

const PORT = Number(process.env.PORT ?? 4999)
const HOST = '127.0.0.1'

const CUSTOMER_ID = '11111111-1111-1111-1111-111111111111'
const AGENT_ID = '33333333-3333-3333-3333-333333333333'
const ADMIN_ID = '44444444-4444-4444-4444-444444444444'

const usersByToken = {
  'demo-customer-token': {
    id: CUSTOMER_ID,
    email: 'demo.courier@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    phone: '9999999999',
    full_name: 'Demo Customer',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    is_anonymous: false,
    email_confirmed_at: '2026-01-01T00:00:00Z',
  },
  'demo-agent-token': {
    id: AGENT_ID,
    email: 'demo.agent@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    phone: '9888888888',
    full_name: 'Demo Agent',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    is_anonymous: false,
    email_confirmed_at: '2026-01-01T00:00:00Z',
  },
  'demo-admin-token': {
    id: ADMIN_ID,
    email: 'demo.admin@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    phone: '9777777777',
    full_name: 'Demo Admin',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    is_anonymous: false,
    email_confirmed_at: '2026-01-01T00:00:00Z',
  },
}

function getToken(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  return token
}

function getAuthUser(req) {
  const token = getToken(req)
  const user = usersByToken[token]
  if (!user) {
    return { status: 401, body: { message: 'Invalid API token' } }
  }
  return {
    status: 200,
    body: {
      access_token: token,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: '',
      user,
    },
  }
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  })
  res.end(payload)
}

function sendError(res, status, message) {
  sendJson(res, status, { message })
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function parseFilters(searchParams) {
  const filters = []
  for (const [key, value] of searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue
    const eqMatch = /^eq\.(.*)$/s.exec(value)
    const actual = eqMatch ? decodeURIComponent(eqMatch[1]) : decodeURIComponent(value)
    filters.push({ key, value: actual })
  }
  return filters
}

function applyFilters(rows, filters) {
  let out = [...rows]
  for (const filter of filters) {
    out = out.filter((row) => String(row?.[filter.key] ?? '') === filter.value)
  }
  return out
}

function sortByCreatedAtDesc(rows) {
  return [...rows].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
}

function wantsSingle(req) {
  const accept = String(req.headers.accept || '')
  return accept.includes('application/vnd.pgrst.object+json')
}

function sendResult(res, status, result, single) {
  if (single) {
    if (result === null || result === undefined) {
      return sendError(res, 406, { message: 'JSON object requested but no row found' })
    }
    return sendJson(res, status, result)
  }
  return sendJson(res, status, Array.isArray(result) ? result : [result])
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const rates = [
  {
    id: 'rate_uk',
    destination_country: 'United Kingdom',
    weight_range_min: 1,
    weight_range_max: 10,
    base_rate: 150,
    margin_percent: 20,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'rate_us',
    destination_country: 'United States',
    weight_range_min: 1,
    weight_range_max: 20,
    base_rate: 200,
    margin_percent: 25,
    active: true,
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'rate_uae',
    destination_country: 'United Arab Emirates',
    weight_range_min: 1,
    weight_range_max: 30,
    base_rate: 250,
    margin_percent: 15,
    active: true,
    created_at: '2026-01-03T00:00:00Z',
  },
]

const orders = new Map()
const paymentsByOrder = new Map()
const notifications = []
let orderSeq = 0
let paymentSeq = 0
let notificationSeq = 0

function insertOrder(body) {
  orderSeq += 1
  const id = `ord_${orderSeq}`
  const order = {
    id,
    order_number: `HBC-${orderSeq}`,
    customer_id: body.customer_id ?? CUSTOMER_ID,
    receiver_name: body.receiver_name ?? '',
    receiver_address: body.receiver_address ?? '',
    destination_country: body.destination_country ?? '',
    weight: body.weight ?? 0,
    scheduled_pickup_date: body.scheduled_pickup_date ?? null,
    status: body.status ?? 'pending',
    razorpay_order_id: body.razorpay_order_id ?? null,
    razorpay_payment_id: body.razorpay_payment_id ?? null,
    total_amount: body.total_amount ?? 0,
    phone: body.phone ?? null,
    notes: body.notes ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  orders.set(id, order)
  if (body.razorpay_order_id) {
    paymentsByOrder.set(id, {
      id: `pay_demo_${paymentSeq + 1}`,
      order_id: id,
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: `pay_demo_${paymentSeq + 1}`,
      amount: body.total_amount ?? 0,
      status: 'captured',
      payment_method: 'upi',
      created_at: new Date().toISOString(),
    })
  }
  return order
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const pathname = url.pathname.replace(/\/+$/, '') || '/'
  const single = wantsSingle(req)
  const method = (req.method || 'GET').toUpperCase()

  try {
    // --- Supabase Auth ---
    if (pathname === '/auth/v1/user') {
      const result = getAuthUser(req)
      return sendJson(res, result.status, result.body)
    }

    // --- Supabase REST: rates ---
    if (pathname === '/rest/v1/rates') {
      if (method === 'GET') {
        const rows = applyFilters(rates, parseFilters(url.searchParams)).sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at)),
        )
        return sendResult(res, 200, rows, single)
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const rate = {
          id: `rate_${Date.now()}`,
          destination_country: body.destination_country ?? '',
          weight_range_min: body.weight_range_min ?? 1,
          weight_range_max: body.weight_range_max ?? 10,
          base_rate: body.base_rate ?? 0,
          margin_percent: body.margin_percent ?? 0,
          active: body.active ?? true,
          created_at: new Date().toISOString(),
        }
        rates.push(rate)
        return sendJson(res, 201, [rate])
      }
      return sendError(res, 405, { message: 'Method not allowed' })
    }

    // --- Supabase REST: orders ---
    if (pathname === '/rest/v1/orders') {
      if (method === 'GET') {
        const rows = applyFilters([...orders.values()], parseFilters(url.searchParams))
        return sendResult(res, 200, sortByCreatedAtDesc(rows), single)
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const order = insertOrder(body)
        return sendJson(res, 201, order)
      }
      return sendError(res, 405, { message: 'Method not allowed' })
    }

    const orderMatch = /^\/rest\/v1\/orders\/([^/]+)$/.exec(pathname)
    if (orderMatch) {
      const id = decodeURIComponent(orderMatch[1])
      if (method === 'GET') {
        const order = orders.get(id)
        if (!order) return sendError(res, 406, { message: 'JSON object requested but no row found' })
        return sendJson(res, 200, order)
      }
      if (method === 'PATCH') {
        const body = await readBody(req)
        const order = orders.get(id)
        if (!order) return sendError(res, 404, { message: 'Order not found' })
        Object.assign(order, body)
        order.updated_at = new Date().toISOString()
        return sendJson(res, 200, order)
      }
      return sendError(res, 405, { message: 'Method not allowed' })
    }

    // --- Supabase REST: payments ---
    if (pathname === '/rest/v1/payments') {
      if (method === 'GET') {
        const rows = applyFilters([...paymentsByOrder.values()], parseFilters(url.searchParams))
        return sendResult(res, 200, single ? (rows[0] ?? null) : rows, single)
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const orderId = body.order_id || url.searchParams.get('order_id')?.replace(/^eq\./, '') || ''
        const existing = [...paymentsByOrder.values()].find((p) => p.order_id === orderId)
        const payment = existing ?? {
          id: `pay_demo_${++paymentSeq}`,
          order_id: orderId,
          razorpay_order_id: body.razorpay_order_id ?? null,
          razorpay_payment_id: body.razorpay_payment_id ?? null,
          amount: body.amount ?? 0,
          status: body.status ?? 'pending',
          payment_method: body.payment_method ?? null,
          created_at: new Date().toISOString(),
        }
        if (body.status) payment.status = body.status
        if (body.razorpay_payment_id) payment.razorpay_payment_id = body.razorpay_payment_id
        paymentsByOrder.set(orderId, payment)
        return sendJson(res, 201, payment)
      }
      if (method === 'PATCH') {
        const body = await readBody(req)
        const filters = parseFilters(url.searchParams)
        const payment = [...paymentsByOrder.values()].find((p) =>
          filters.every((f) => String(p?.[f.key] ?? '') === f.value),
        )
        if (!payment) {
          return sendError(res, 404, { message: 'Payment not found' })
        }
        if (body.status) payment.status = body.status
        if (body.razorpay_payment_id) payment.razorpay_payment_id = body.razorpay_payment_id
        if (typeof body.amount === 'number') payment.amount = body.amount
        return sendJson(res, 200, payment)
      }
      return sendError(res, 405, { message: 'Method not allowed' })
    }

    // --- Supabase REST: notifications ---
    if (pathname === '/rest/v1/notifications') {
      if (method === 'GET') {
        return sendJson(res, 200, notifications)
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const notification = {
          id: `ntf_${++notificationSeq}`,
          order_id: body.order_id ?? '',
          type: body.type ?? 'sms',
          template: body.template ?? 'order_confirmed',
          status: body.status ?? 'pending',
          msg91_id: body.msg91_id ?? null,
          created_at: new Date().toISOString(),
        }
        notifications.push(notification)
        return sendJson(res, 201, notification)
      }
      return sendError(res, 405, { message: 'Method not allowed' })
    }

    // --- Supabase REST: profiles ---
    if (pathname === '/rest/v1/profiles') {
      const rows = applyFilters(
        [
          { id: CUSTOMER_ID, role: 'customer' },
          { id: AGENT_ID, role: 'agent' },
          { id: ADMIN_ID, role: 'admin' },
        ],
        parseFilters(url.searchParams),
      )
      return sendResult(res, 200, single ? (rows[0] ?? null) : rows, single)
    }

    // --- Razorpay ---
    if (pathname === '/v1/orders' && method === 'POST') {
      const body = await readBody(req)
      const orderId = `rzp_order_demo_${paymentSeq + 1}`
      const paymentId = `pay_demo_${paymentSeq + 1}`
      paymentsByOrder.set(orderId, {
        id: paymentId,
        order_id: orderId,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        amount: body.amount ?? 0,
        status: 'captured',
        payment_method: 'upi',
        created_at: new Date().toISOString(),
      })
      return sendJson(res, 200, { id: orderId, entity: 'order', amount: body.amount ?? 0, currency: 'INR', status: 'created' })
    }

    const paymentMatch = /^\/v1\/payments\/([^/]+)$/.exec(pathname)
    if (paymentMatch && method === 'GET') {
      const paymentId = decodeURIComponent(paymentMatch[1])
      const payment = [...paymentsByOrder.values()].find((p) => p.id === paymentId)
      if (!payment) return sendError(res, 404, { message: 'Payment not found' })
      return sendJson(res, 200, payment)
    }

    // --- MSG91 ---
    if (pathname === '/sms/v3/sendText' && method === 'POST') {
      const body = await readBody(req)
      return sendJson(res, 200, {
        type: 'success',
        messageId: `msg91_demo_${++notificationSeq}`,
        smsId: `msg91_demo_${notificationSeq}`,
        senderId: body.senderid ?? 'CNRPAYR',
        mobileNumber: body.mobiles?.[0]?.number ?? '',
      })
    }

    return sendError(res, 404, { message: `No mock endpoint for ${method} ${pathname}` })
  } catch (error) {
    console.error('[mock-backend] error handling', error)
    if (!res.headersSent) sendError(res, 500, { message: 'Internal mock backend error' })
    else res.end()
  }
})

server.listen(PORT, HOST, () => {
  console.log(`[mock-backend] Courier Booking mock backend listening on http://${HOST}:${PORT}`)
})