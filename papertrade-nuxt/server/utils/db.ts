import { promises as fs } from 'node:fs'
import path from 'node:path'

/**
 * DB sederhana: Upstash Redis (REST) kalau dikonfigurasi — leaderboard &
 * cooldown faucet jadi PERSISTEN saat redeploy — fallback ke file JSON lokal.
 */

// Simple per-process mutex biar read-modify-write nggak ngaco saat dev.
const locks = new Map<string, Promise<unknown>>()

type DbValue = unknown

function kvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ''), token }
}

function filePath(): string {
  const dir = process.env.DB_DIR || path.join(process.cwd(), '.data')
  return path.join(dir, 'db.json')
}

async function readAll(): Promise<Record<string, DbValue>> {
  try {
    const raw = await fs.readFile(filePath(), 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function kvGet(key: string): Promise<DbValue> {
  const kv = kvConfig()
  if (kv) {
    const res = await $fetch<{ result: string | null }>(`${kv.url}/get/${key}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
      responseType: 'json'
    })
    if (res?.result == null) return undefined
    try { return JSON.parse(res.result) } catch { return res.result }
  }
  const all = await readAll()
  return all[key]
}

async function kvSet(key: string, value: DbValue): Promise<void> {
  const kv = kvConfig()
  if (kv) {
    const body = JSON.stringify(value ?? null)
    // Upstash REST: POST /set/key dgn body value
    await $fetch(`${kv.url}/set/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kv.token}`, 'Content-Type': 'text/plain' },
      body
    })
    return
  }
  try {
    const all = await readAll()
    all[key] = value
    await fs.mkdir(path.dirname(filePath()), { recursive: true })
    await fs.writeFile(filePath(), JSON.stringify(all), 'utf8')
  } catch {
    // Filesystem read-only (mis. serverless tanpa KV) → diabaikan.
  }
}

/** Baca nilai dengan default. */
export async function dbRead<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await kvGet(key)
    return (v === undefined ? fallback : (v as T)) as T
  } catch {
    return fallback
  }
}

/** Tulis nilai. */
export async function dbWrite(key: string, value: DbValue): Promise<void> {
  try { await kvSet(key, value) } catch {}
}

/** Read-modify-write atomik per key (serialized perks-process). */
export async function dbMutate<T>(key: string, fn: (cur: unknown) => T | Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve()
  const task = prev.catch(() => {}).then(async () => {
    const cur = await dbRead<unknown>(key, undefined as unknown)
    const next = await fn(cur)
    if (next !== undefined) await dbWrite(key, next)
    return next as T
  })
  locks.set(key, task.catch(() => {}))
  return task
}

export const DB_KEYS = {
  positions: 'positions',
  scores: 'scores',
  sentiment: 'sentiment'
}
