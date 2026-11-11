import { readBody } from 'h3'
import type { H3Event } from 'h3'

/**
 * readBody yang toleran: kalau body datang sebagai string JSON
 * (mis. content-type text/plain), tetap di-parse.
 */
export async function readJsonBody(event: H3Event): Promise<Record<string, unknown>> {
  const raw = await readBody(event).catch(() => undefined)
  if (raw && typeof raw === 'string') {
    try { return JSON.parse(raw) as Record<string, unknown> } catch { return {} }
  }
  return (raw ?? {}) as Record<string, unknown>
}
