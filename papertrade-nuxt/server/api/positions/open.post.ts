import { isSolanaAddress, isWhitelistedSymbol, fetchBinancePrice } from '../../utils/binance'
import { dbMutate } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readJsonBody(event)
  const b = body

  const wallet = String(b.wallet ?? '')
  const symbol = String(b.symbol ?? '').toUpperCase()
  const side = String(b.side ?? '').toUpperCase()
  const leverage = Number(b.leverage ?? 0)
  const collateralUsd = Number(b.collateralUsd ?? 0)

  if (!isSolanaAddress(wallet)) throw createError({ statusCode: 400, data: { message: 'Wallet invalid' } })
  if (!isWhitelistedSymbol(symbol)) throw createError({ statusCode: 400, data: { message: 'Pair tidak di-whitelist' } })
  if (side !== 'LONG' && side !== 'SHORT') throw createError({ statusCode: 400, data: { message: 'Side harus LONG/SHORT' } })
  if (!(leverage >= 1 && leverage <= 100)) throw createError({ statusCode: 400, data: { message: 'Leverage 1-100x' } })
  if (!(collateralUsd > 0 && collateralUsd < 10_000_000)) throw createError({ statusCode: 400, data: { message: 'Collateral tidak wajar' } })

  enforceRate(event, 'position-open', 120, 60 * 60 * 1000)

  // SEC: harga entry diambil SERVER (bukan yang diklaim klien).
  let entryPrice: number
  try {
    entryPrice = await fetchBinancePrice(symbol)
  } catch {
    throw createError({ statusCode: 503, data: { message: 'Binance lagi ngambek, coba buka posisi lagi.' } })
  }

  const id = globalThis.crypto?.randomUUID()
    ? globalThis.crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

  const record = {
    id,
    wallet,
    symbol,
    side,
    base: String(b.pairBase ?? symbol),
    leverage,
    collateralUsd,
    entryPrice,
    size: (collateralUsd * leverage) / entryPrice,
    openedAt: Date.now(),
    status: 'OPEN' as const
  }

  await dbMutate<Record<string, unknown>>('positions', (cur) => ({
    ...((cur as Record<string, unknown>) ?? {}),
    [id]: record
  }))

  return { id, entryPrice }
})
