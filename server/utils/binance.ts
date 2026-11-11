/** Whitelist pair yang boleh dipakai (samakan dgn app/types/market.ts PAIRS). */
export const WHITELIST_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT'] as const

export const isWhitelistedSymbol = (s: unknown): s is string =>
  typeof s === 'string' && (WHITELIST_SYMBOLS as readonly string[]).includes(s)

/** Regex alamat Solana base58. */
export const isSolanaAddress = (s: unknown): s is string =>
  typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)

const priceCache = new Map<string, { t: number; v: number }>()
const BINANCE_REST = process.env.BINANCE_REST || 'https://data-api.binance.vision/api/v3'
const PRICE_TTL = 5_000

/** Harga spot terkini dgn cache 5 detik biar hemat rate-limit Binance. */
export async function fetchBinancePrice(symbol: string): Promise<number> {
  const hit = priceCache.get(symbol)
  if (hit && Date.now() - hit.t < PRICE_TTL) return hit.v

  const res = await $fetch<{ price: string }>(`${BINANCE_REST}/ticker/price`, {
    query: { symbol: symbol.toUpperCase() }
  })
  const v = parseFloat(res?.price)
  if (!Number.isFinite(v) || v <= 0) throw new Error(`Invalid price for ${symbol}`)
  priceCache.set(symbol, { t: Date.now(), v })
  return v
}

/** Malas nge-cache eksklusif? return 0 biar pemanggil fallback. */
export async function fetchSolPriceSafe(): Promise<number> {
  try { return await fetchBinancePrice('SOLUSDT') } catch { return 0 }
}
