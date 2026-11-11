import { isSolanaAddress, fetchBinancePrice } from '../../utils/binance'
import { transferPaper } from '../../utils/solana'
import { dbRead, dbMutate } from '../../utils/db'

interface ScoreEntry {
  profit: number
  wins: number
  losses: number
  updatedAt: number
}

export default defineEventHandler(async (event) => {
  const body = await readJsonBody(event)
  const positionId = String(body.positionId ?? '')
  const wallet = String(body.wallet ?? '')

  if (!isSolanaAddress(wallet)) {
    throw createError({ statusCode: 400, data: { message: 'Wallet invalid' } })
  }
  enforceRate(event, 'position-claim', 240, 60 * 60 * 1000)

  const positions = await dbRead<Record<string, Record<string, unknown>>>('positions', {})
  const rec = positions[positionId]

  if (!rec) {
    throw createError({ statusCode: 404, data: { message: 'Posisi tidak ketemu di server.' } })
  }
  if (String(rec.wallet) !== wallet) {
    throw createError({ statusCode: 403, data: { message: 'Bukan posisi lu, Boss.' } })
  }
  if (rec.status === 'CLOSED') {
    return {
      success: true,
      alreadyClosed: true,
      win: Boolean(rec.win),
      pnl: Number(rec.pnl ?? 0)
    }
  }

  // Verifikasi harga terkini (antichat versi baru: entry dicatat server).
  let mark: number
  try {
    mark = await fetchBinancePrice(String(rec.symbol))
  } catch {
    throw createError({
      statusCode: 503,
      data: { message: 'Binance lagi down saat claim. Tahan posisi, coba lagi.' }
    })
  }

  const side = String(rec.side)
  const entry = Number(rec.entryPrice)
  const size = Number(rec.size)
  const pnl = side === 'LONG' ? (mark - entry) * size : (entry - mark) * size
  const win = pnl > 0

  // Catat ke leaderboard (persisten DB, bukan RAM).
  if (wallet) {
    await dbMutate<Record<string, ScoreEntry>>('scores', (cur) => {
      const s = (cur as Record<string, ScoreEntry>) ?? {}
      const prev = s[wallet] ?? { profit: 0, wins: 0, losses: 0, updatedAt: 0 }
      s[wallet] = {
        profit: prev.profit + (win ? pnl : 0),
        wins: prev.wins + (win ? 1 : 0),
        losses: prev.losses + (win ? 0 : 1),
        updatedAt: Date.now()
      }
      return s
    })
  }

  let rewardTx: string | undefined
  let rewardError: string | undefined
  if (win) {
    const config = useRuntimeConfig(event)
    try {
      rewardTx = await transferPaper(wallet, Number(config.rewardAmount) || 100, {
        privateKey: String(config.solanaPrivateKey || ''),
        cluster: String(config.solanaCluster || 'devnet'),
        mint: String(config.paperMint)
      })
    } catch (e) {
      rewardError = e instanceof Error ? e.message : 'Gagal kirim reward.'
    }
  }

  await dbMutate<Record<string, unknown>>('positions', (cur) => {
    const m = (cur as Record<string, Record<string, unknown>>) ?? {}
    const prev = m[positionId] ?? {}
    m[positionId] = {
      ...prev,
      exitPrice: mark,
      pnl,
      win,
      rewardTx,
      rewardError,
      status: 'CLOSED',
      closedAt: Date.now()
    }
    return m
  })

  return {
    success: true,
    win,
    pnl,
    rewardTx,
    rewardError,
    message: rewardTx
      ? 'Reward $PAPER terkirim ke wallet lu!'
      : rewardError
        ? `Cuan tercatat, tapi reward gagal: ${rewardError}`
        : win
          ? 'Cuan tercatat di Leaderboard!'
          : 'Loss tercatat. Gaspol next time, Boss.'
  }
})
