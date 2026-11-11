import { dbRead } from '../utils/db'

interface ScoreEntry {
  profit: number
  wins?: number
  losses?: number
  updatedAt?: number
}

const SEEDS: Array<{ wallet: string; profit: number }> = [
  { wallet: 'E4QS...BH7F', profit: 25500 },
  { wallet: 'HUTA...TRAD', profit: 12800 },
  { wallet: 'D3GE...N69X', profit: 7400 }
]

export default defineEventHandler(async () => {
  const scores = await dbRead<Record<string, ScoreEntry>>('scores', {})
  const entries = Object.entries(scores)

  // Masih kosong → tampilkan seed mock biar UI nggak gefreng.
  const source: Array<{ wallet: string; profit: number, wins?: number, losses?: number }> =
    entries.length > 0
      ? entries.map(([wallet, s]) => ({
          wallet: wallet.length > 12 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet,
          profit: Math.round(s.profit ?? 0),
          wins: s.wins ?? 0,
          losses: s.losses ?? 0
        }))
      : SEEDS.map(s => ({ ...s, wins: 0, losses: 0 }))

  return source
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10)
    .map(({ wallet, profit }) => ({ wallet, profit }))
})
