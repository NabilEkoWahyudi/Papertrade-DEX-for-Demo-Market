export interface PairMeta {
  symbol: string
  base: string
  name: string
  color: string
}

export const PAIRS: PairMeta[] = [
  { symbol: 'BTCUSDT', base: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { symbol: 'ETHUSDT', base: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { symbol: 'SOLUSDT', base: 'SOL', name: 'Solana', color: '#14F195' },
  { symbol: 'BNBUSDT', base: 'BNB', name: 'BNB', color: '#F0B90B' },
  { symbol: 'XRPUSDT', base: 'XRP', name: 'XRP', color: '#23292F' },
  { symbol: 'DOGEUSDT', base: 'DOGE', name: 'Dogecoin', color: '#C2A633' },
  { symbol: 'ADAUSDT', base: 'ADA', name: 'Cardano', color: '#0033AD' },
  { symbol: 'AVAXUSDT', base: 'AVAX', name: 'Avalanche', color: '#E84142' },
  { symbol: 'LINKUSDT', base: 'LINK', name: 'Chainlink', color: '#2A5ADA' }
]

export const TV_SYMBOL = (symbol: string) => `BINANCE:${symbol}`

export interface PairStat {
  symbol: string
  price: number
  change: number
  volume: number
}

export interface Ticker24h {
  price: number
  changePct: number
  high: number
  low: number
  quoteVolume: number
}

export type DepthEntry = [string, string]

export interface Depth {
  bids: DepthEntry[]
  asks: DepthEntry[]
}

export const isPair = (s: string) => PAIRS.some(p => p.symbol === s)

/** Locale-aware: bundel minuscule "k", "m", "b". */
export function fmtVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toFixed(2)
}

export function fmtPrice(p: number): string {
  if (!Number.isFinite(p)) return '--'
  return p < 1 ? p.toFixed(4) : p.toFixed(2)
}
