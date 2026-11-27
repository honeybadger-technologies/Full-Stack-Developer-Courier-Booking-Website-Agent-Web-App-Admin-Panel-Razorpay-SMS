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