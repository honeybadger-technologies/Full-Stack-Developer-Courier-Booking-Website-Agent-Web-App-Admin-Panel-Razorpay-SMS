/**
 * Builds the RequestInit for the customer create-order API call, attaching the
 * Supabase bearer token when available so `/api/orders` can resolve the caller.
 */
export function createOrderRequest(
  token: string | null | undefined,
  body: unknown,
): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }
}