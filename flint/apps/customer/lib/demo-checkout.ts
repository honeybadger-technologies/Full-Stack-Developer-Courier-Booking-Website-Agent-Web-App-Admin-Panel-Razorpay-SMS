export function isDemoCheckoutEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const value = (env.NEXT_PUBLIC_DEMO_CHECKOUT ?? '').trim().toLowerCase()
  return value === '1'
}

export function getDemoCheckoutBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const base = (env.NEXT_PUBLIC_RAZORPAY_BASE_URL ?? '').trim()
  return base
}

export function canUseDemoCheckout(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const demo = isDemoCheckoutEnabled(env)
  const baseUrl = getDemoCheckoutBaseUrl(env)
  return demo && !!baseUrl
}

export interface DemoPaymentInput {
  orderId: string
  amount: number
  baseUrl: string
  authToken: string
  fetchFn?: typeof fetch
}

export interface DemoPaymentResult {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export async function runDemoPayment(input: DemoPaymentInput): Promise<DemoPaymentResult> {
  const doFetch: typeof fetch = input.fetchFn ?? fetch

  const createRes = await doFetch('/api/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.authToken ? { Authorization: `Bearer ${input.authToken}` } : {}),
    },
    body: JSON.stringify({ orderId: input.orderId, amount: input.amount }),
  })
  const createData = await createRes.json()
  const razorpayOrderId = createData?.razorpayOrderId
  if (!createRes.ok || !razorpayOrderId) {
    throw new Error('We could not start the payment. Please try again.')
  }

  const demoRes = await doFetch(`${input.baseUrl}/demo/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razorpayOrderId }),
  })
  const demoData = await demoRes.json()
  const razorpayPaymentId = demoData?.razorpayPaymentId
  const razorpaySignature = demoData?.razorpaySignature
  if (!demoRes.ok || !razorpayPaymentId || !razorpaySignature) {
    throw new Error('We could not start the demo payment. Please try again.')
  }

  const verifyRes = await doFetch('/api/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.authToken ? { Authorization: `Bearer ${input.authToken}` } : {}),
    },
    body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  })
  const verifyData = await verifyRes.json()
  if (!verifyRes.ok || verifyData?.verified !== true) {
    throw new Error('We could not confirm your payment. Please try again.')
  }

  return { razorpayOrderId, razorpayPaymentId, razorpaySignature }
}