import { getRequestIP } from 'h3'
import type { H3Event } from 'h3'

const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const arr = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (arr.length >= limit) {
    buckets.set(key, arr)
    const oldest = arr[0] ?? now
    const retryAfter = Math.ceil((windowMs - (now - oldest)) / 1000)
    return { ok: false, retryAfter }
  }
  arr.push(now)
  buckets.set(key, arr)
  return { ok: true, retryAfter: 0 }
}

export function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'anon'
}

/** Guard: lempar 429 kalau melewati batas. */
export function enforceRate(event: H3Event, scope: string, limit: number, windowMs: number) {
  const { ok, retryAfter } = rateLimit(`${scope}:${clientIp(event)}`, limit, windowMs)
  if (!ok) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests',
      data: { message: `Jeda dikit Boss (${retryAfter}s).` }
    })
  }
}
