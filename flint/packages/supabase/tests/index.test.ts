import { describe, expect, it } from 'vitest'
import { resolveRouteAccess } from '../src/index'

describe('resolveRouteAccess', () => {
  it('allows a customer into the customer app and routes to the customer home', () => {
    const result = resolveRouteAccess({
      app: 'customer',
      role: 'customer',
      session: { user: { id: '11111111-1111-1111-1111-111111111111' } },
    })
    expect(result.allowed).toBe(true)
    expect(result.redirectTo).toBe('/customer/home')
  })

  it('allows an agent into the agent app and routes to the agent dashboard', () => {
    const result = resolveRouteAccess({
      app: 'agent',
      role: 'agent',
      session: { user: { id: '33333333-3333-3333-3333-333333333333' } },
    })
    expect(result.allowed).toBe(true)
    expect(result.redirectTo).toBe('/dashboard')
  })

  it('allows an admin into the admin app and routes to the admin dashboard', () => {
    const result = resolveRouteAccess({
      app: 'admin',
      role: 'admin',
      session: { user: { id: '44444444-4444-4444-4444-444444444444' } },
    })
    expect(result.allowed).toBe(true)
    expect(result.redirectTo).toBe('/')
  })

  it('requires a session and sends the user to the login route', () => {
    const result = resolveRouteAccess({ app: 'customer', role: 'customer', session: null })
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBe('/auth/login')
  })

  it('rejects a signed-in user whose profile has no role', () => {
    const result = resolveRouteAccess({
      app: 'agent',
      role: null,
      session: { user: { id: '33333333-3333-3333-3333-333333333333' } },
    })
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBeNull()
  })

  it('does not allow a wrong-role user into an app', () => {
    const result = resolveRouteAccess({
      app: 'customer',
      role: 'agent',
      session: { user: { id: '33333333-3333-3333-3333-333333333333' } },
    })
    expect(result.allowed).toBe(false)
    expect(result.redirectTo).toBeNull()
  })
})