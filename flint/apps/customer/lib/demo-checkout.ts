export function isDemoCheckoutEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const value = (env.NEXT_PUBLIC_DEMO_CHECKOUT ?? '').trim().toLowerCase()
  return value === '1'
}