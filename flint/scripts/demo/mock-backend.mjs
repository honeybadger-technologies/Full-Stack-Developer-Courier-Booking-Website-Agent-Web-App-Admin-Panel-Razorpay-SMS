/**
 * Demo mock backend for the Courier Booking Platform.
 *
 * Implements the external service endpoints used by the Courier Booking API so
 * the full customer flow can be exercised locally without live credentials:
 *
 *   - Supabase Auth:        GET  /auth/v1/user
 *                           POST /auth/v1/token?grant_type=password
 *                           POST /auth/v1/logout
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
import { createHmac } from 'node:crypto'

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

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_SECRET || 'rzp_demo_secret'
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_demo_secret'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'courier-demo'

function signPayment(razorpayOrderId, razorpayPaymentId) {
  return createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
}

function findTokenByEmail(email) {
  for (const token of Object.keys(usersByToken)) {
    if (usersByToken[token]?.email === email) {
      return token
    }
  }
  return null
}

function signWebhookPayload(rawBody) {
  return createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex')
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
      refresh_token: 'demo-refresh-token',
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
    const row = Array.isArray(result) ? result[0] : result
    if (row === null || row === undefined) {
      return sendError(res, 406, { message: 'JSON object requested but no row found' })
    }
    return sendJson(res, status, row)
  }
  return sendJson(res, status, Array.isArray(result) ? result : [result])
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
const profileById = new Map()
for (const token of Object.keys(usersByToken)) {
  const u = usersByToken[token]
  if (u?.id) {
    profileById.set(u.id, u)
  }
}

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
const agentPickups = new Map()
const notifications = []
let orderSeq = 0
// Start above the seeded payment ids (pay_demo_1..4 / rzp_order_demo_1..4) so
// freshly created demo payments never collide with seeded ones.
let paymentSeq = 100
let notificationSeq = 0
let pickupSeq = 0

// Seed orders so admin dashboards and agent flows have data to work with.
orders.set('ord_demo_1', {
  id: 'ord_demo_1',
  order_number: 'HBC-1001',
  customer_id: CUSTOMER_ID,
  receiver_name: 'Demo Receiver',
  receiver_address: '12 Example Street',
  destination_country: 'United Kingdom',
  weight: 2,
  scheduled_pickup_date: '2026-02-01T10:00:00Z',
  status: 'pending',
  razorpay_order_id: null,
  razorpay_payment_id: null,
  total_amount: 360,
  phone: '9999999999',
  notes: null,
  created_at: '2026-01-05T09:00:00Z',
  updated_at: '2026-01-05T09:00:00Z',
})

orders.set('ord_demo_2', {
  id: 'ord_demo_2',
  order_number: 'HBC-1002',
  customer_id: CUSTOMER_ID,
  receiver_name: 'Demo Receiver Two',
  receiver_address: '45 Example Road',
  destination_country: 'United States',
  weight: 5,
  scheduled_pickup_date: '2026-02-05T14:00:00Z',
  status: 'pending',
  razorpay_order_id: 'rzp_order_demo_2',
  razorpay_payment_id: 'pay_demo_2',
  total_amount: 1000,
  phone: '9999999999',
  notes: null,
  created_at: '2026-01-07T11:30:00Z',
  updated_at: '2026-01-07T11:30:00Z',
})

orders.set('ord_demo_3', {
  id: 'ord_demo_3',
  order_number: 'HBC-1003',
  customer_id: CUSTOMER_ID,
  receiver_name: 'Demo Receiver Three',
  receiver_address: '78 Example Avenue',
  destination_country: 'United Arab Emirates',
  weight: 8,
  scheduled_pickup_date: '2026-02-10T09:00:00Z',
  status: 'picked_up',
  razorpay_order_id: 'rzp_order_demo_3',
  razorpay_payment_id: 'pay_demo_3',
  total_amount: 2000,
  phone: '9999999999',
  notes: null,
  created_at: '2026-01-09T08:00:00Z',
  updated_at: '2026-02-12T10:00:00Z',
})

orders.set('ord_demo_4', {
  id: 'ord_demo_4',
  order_number: 'HBC-1004',
  customer_id: CUSTOMER_ID,
  receiver_name: 'Demo Receiver Four',
  receiver_address: '56 Example Lane',
  destination_country: 'Germany',
  weight: 3,
  scheduled_pickup_date: '2026-02-15T13:00:00Z',
  status: 'shipped',
  razorpay_order_id: 'rzp_order_demo_4',
  razorpay_payment_id: 'pay_demo_4',
  total_amount: 900,
  phone: '9999999999',
  notes: null,
  created_at: '2026-01-11T07:30:00Z',
  updated_at: '2026-02-18T15:00:00Z',
})

paymentsByOrder.set('ord_demo_1', {
  id: 'pay_demo_1',
  order_id: 'ord_demo_1',
  razorpay_order_id: null,
  razorpay_payment_id: null,
  amount: 360,
  status: 'pending',
  payment_method: 'upi',
  created_at: '2026-01-05T09:00:00Z',
})

paymentsByOrder.set('ord_demo_2', {
  id: 'pay_demo_2',
  order_id: 'ord_demo_2',
  razorpay_order_id: 'rzp_order_demo_2',
  razorpay_payment_id: 'pay_demo_2',
  amount: 1000,
  status: 'completed',
  payment_method: 'upi',
  created_at: '2026-01-07T11:30:00Z',
})

paymentsByOrder.set('ord_demo_3', {
  id: 'pay_demo_3',
  order_id: 'ord_demo_3',
  razorpay_order_id: 'rzp_order_demo_3',
  razorpay_payment_id: 'pay_demo_3',
  amount: 2000,
  status: 'completed',
  payment_method: 'upi',
  created_at: '2026-02-12T10:00:00Z',
})

paymentsByOrder.set('ord_demo_4', {
  id: 'pay_demo_4',
  order_id: 'ord_demo_4',
  razorpay_order_id: 'rzp_order_demo_4',
  razorpay_payment_id: 'pay_demo_4',
  amount: 900,
  status: 'completed',
  payment_method: 'upi',
  created_at: '2026-02-18T15:00:00Z',
})

agentPickups.set('apt_demo_1', {
  id: 'apt_demo_1',
  order_id: 'ord_demo_2',
  agent_id: AGENT_ID,
  pickup_location: 'Warehouse Demo Hub',
  actual_weight: 5,
  photo_url: null,
  status: 'scheduled',
  scanned_qr: null,
  created_at: '2026-02-06T09:00:00Z',
})

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

  // CORS preflight: answer with 204 + CORS headers so browsers can call the API.
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    })
    return res.end()
  }

  try {
    // --- Supabase Auth ---
    if (pathname === '/auth/v1/user') {
      const result = getAuthUser(req)
      return sendJson(res, result.status, result.body)
    }

    // --- Supabase Auth: password grant token exchange ---
    if (pathname === '/auth/v1/token' && method === 'POST') {
      const body = await readBody(req)
      const grantType =
        url.searchParams.get('grant_type') || (typeof body?.grant_type === 'string' ? body.grant_type : '')
      if (grantType !== 'password') {
        return sendJson(res, 400, { error: 'unsupported_grant_type', error_description: 'Unsupported grant type', message: 'Unsupported grant type' })
      }
      const email = typeof body?.email === 'string' ? body.email : ''
      const password = typeof body?.password === 'string' ? body.password : ''
      const token = findTokenByEmail(email)
      const user = token ? usersByToken[token] : null
      if (!user || password !== DEMO_PASSWORD) {
        return sendJson(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', message: 'Invalid login credentials' })
      }
      const session = {
        access_token: token,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'demo-refresh-token',
        user,
      }
      return sendJson(res, 200, session)
    }

    if (pathname === '/auth/v1/logout' && method === 'POST') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      })
      return res.end()
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
        const selectParam = url.searchParams.get('select') || ''
        const prefer = String(req.headers.prefer || '')
        const wantsCount = selectParam.includes('count') || prefer.includes('count=exact')
        if (wantsCount) {
          return sendJson(res, 200, [{ count: rows.length }])
        }
        let out = sortByCreatedAtDesc(rows)
        if (selectParam) {
          out = out.map((order) => {
            const row = { ...order }
            if (selectParam.includes('profiles')) {
              row.profiles = profileById.get(String(order.customer_id ?? '')) ?? null
            }
            if (selectParam.includes('payments')) {
              const payment = [...paymentsByOrder.values()].find((p) => p.order_id === order.id)
              row.payments = payment ? [payment] : []
            }
            return row
          })
        }
        return sendResult(res, 200, out, single)
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const order = insertOrder(body)
        return sendJson(res, 201, order)
      }
      if (method === 'PATCH') {
        const body = await readBody(req)
        const filters = parseFilters(url.searchParams)
        const rows = applyFilters([...orders.values()], filters)
        const order = rows[0] ?? null
        if (!order) return sendError(res, 404, { message: 'Order not found' })
        Object.assign(order, body)
        order.updated_at = new Date().toISOString()
        return sendJson(res, 200, order)
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
      const selectParam = url.searchParams.get('select') || ''
      const prefer = String(req.headers.prefer || '')
      const wantsCount = selectParam.includes('count') || prefer.includes('count=exact')
      if (wantsCount) {
        return sendJson(res, 200, [{ count: rows.length }])
      }
      return sendResult(res, 200, single ? (rows[0] ?? null) : rows, single)
    }

    // --- Supabase REST: agent pickups ---
    if (pathname === '/rest/v1/agent_pickups') {
      if (method === 'GET') {
        const rows = applyFilters([...agentPickups.values()], parseFilters(url.searchParams))
        const selectParam = url.searchParams.get('select') || ''
        const out = rows.map((pickup) => {
          const row = { ...pickup }
          if (selectParam.includes('orders')) {
            row.orders = orders.get(String(pickup.order_id ?? '')) ?? null
          }
          return row
        })
        return sendResult(res, 200, out, single)
      }
      if (method === 'POST') {
        const body = await readBody(req)
        const pickup = {
          id: `apt_${++pickupSeq}`,
          order_id: typeof body.order_id === 'string' ? body.order_id : '',
          agent_id: typeof body.agent_id === 'string' ? body.agent_id : '',
          pickup_location: typeof body.pickup_location === 'string' ? body.pickup_location : '',
          actual_weight: typeof body.actual_weight === 'number' ? body.actual_weight : null,
          photo_url: null,
          status: typeof body.status === 'string' ? body.status : 'scheduled',
          scanned_qr: null,
          created_at: new Date().toISOString(),
        }
        agentPickups.set(pickup.id, pickup)
        return sendJson(res, 201, pickup)
      }
      return sendError(res, 405, { message: 'Method not allowed' })
    }

    // --- Razorpay ---
    if (pathname === '/v1/orders' && method === 'POST') {
      const body = await readBody(req)
      const orderId = `rzp_order_demo_${paymentSeq + 1}`
      const paymentId = `pay_demo_${paymentSeq + 1}`
      const receipt = typeof body.receipt === 'string' ? body.receipt : ''
      const courierOrderId = receipt.replace(/^rcpt_/, '')
      const existingPayment = courierOrderId
        ? [...paymentsByOrder.values()].find((p) => p.order_id === courierOrderId)
        : null
      const payment = existingPayment ?? {
        id: paymentId,
        order_id: courierOrderId,
        razorpay_order_id: orderId,
        razorpay_payment_id: null,
        amount: body.amount ?? 0,
        status: 'pending',
        payment_method: 'upi',
        created_at: new Date().toISOString(),
      }
      payment.order_id = courierOrderId
      payment.razorpay_order_id = orderId
      payment.razorpay_payment_id = null
      payment.amount = body.amount ?? 0
      payment.status = 'pending'
      paymentsByOrder.set(courierOrderId, payment)
      return sendJson(res, 200, {
        id: orderId,
        entity: 'order',
        amount: body.amount ?? 0,
        currency: 'INR',
        status: 'created',
      })
    }

    const paymentMatch = /^\/v1\/payments\/([^/]+)$/.exec(pathname)
    if (paymentMatch && method === 'GET') {
      const paymentId = decodeURIComponent(paymentMatch[1])
      const payment = [...paymentsByOrder.values()].find((p) => p.id === paymentId)
      if (!payment) return sendError(res, 404, { message: 'Payment not found' })
      return sendJson(res, 200, { ...payment, order_id: payment.razorpay_order_id || payment.order_id })
    }

    // --- Razorpay demo checkout: turn a created Razorpay order into a captured payment
    if (pathname === '/v1/demo/checkout' && method === 'POST') {
      const body = await readBody(req)
      const razorpayOrderId = typeof body.razorpayOrderId === 'string' ? body.razorpayOrderId : ''
      const payment = [...paymentsByOrder.values()].find(
        (p) => p.razorpay_order_id === razorpayOrderId || p.id === razorpayOrderId,
      )
      if (!payment) {
        return sendError(res, 404, { message: 'Payment not found' })
      }
      const razorpayPaymentId = payment.id
      payment.status = 'captured'
      payment.razorpay_payment_id = razorpayPaymentId
      payment.signature = signPayment(razorpayOrderId, razorpayPaymentId)
      return sendJson(res, 200, { razorpayPaymentId, razorpaySignature: payment.signature })
    }

    // --- Razorpay webhooks (demo helper that signs a payment.captured event) ---
    if (pathname === '/v1/webhooks/payment-captured' && method === 'POST') {
      const body = await readBody(req)
      const orderId = typeof body.order_id === 'string' ? body.order_id : ''
      const amount = Math.round(Number(body.amount) || 0)
      const payload = { event: 'payment.captured', payload: { payment: { entity: { order_id: orderId, amount } } } }
      const rawBody = JSON.stringify(payload)
      const signedPayload = { event: payload.event, payload: payload.payload }
      return sendJson(res, 200, { event: signedPayload.event, payload: signedPayload.payload, signature: signWebhookPayload(rawBody), rawBody })
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