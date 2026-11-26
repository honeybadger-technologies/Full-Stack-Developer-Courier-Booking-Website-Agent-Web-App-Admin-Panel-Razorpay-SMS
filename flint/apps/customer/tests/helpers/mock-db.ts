import { vi } from 'vitest'

export const ok = (data: unknown, error: unknown = null) => ({ data, error })

export type QueryResult = { data: unknown; error?: unknown }
export type QueryBuilder = Record<string, unknown> & PromiseLike<QueryResult>

/**
 * Builds a fake Supabase query builder that resolves to the given result.
 * Supports the fluent chains used by the API routes:
 *   - select/insert/update/upsert/delete/eq/order -> awaitable (thenable)
 *   - single() -> resolves directly to the result
 */
export function mockDbQuery(result: QueryResult): QueryBuilder {
  const final: QueryResult = result
  const b: Record<string, unknown> = {
    then: (onFulfilled: (value: QueryResult) => QueryResult, onRejected: (reason: unknown) => QueryResult) =>
      Promise.resolve(final).then(onFulfilled, onRejected),
  }
  b.select = vi.fn((): unknown => b)
  b.insert = vi.fn((): unknown => b)
  b.update = vi.fn((): unknown => b)
  b.upsert = vi.fn((): unknown => b)
  b.delete = vi.fn((): unknown => b)
  b.eq = vi.fn((): unknown => b)
  b.order = vi.fn((): unknown => b)
  b.single = vi.fn((): Promise<QueryResult> => Promise.resolve(final))
  return b as unknown as QueryBuilder
}

/**
 * Makes the `from` mock dispatch on the table name so multi-step handlers
 * (e.g. orders -> profiles) can return different results per table.
 */
export function mockFrom(fromMock: ReturnType<typeof vi.fn>, table: string, result: QueryResult) {
  fromMock.mockImplementation((t: string) => {
    if (t === table) {
      return mockDbQuery(result)
    }
    return mockDbQuery({ data: null, error: { message: `unexpected table: ${t}` } })
  })
}