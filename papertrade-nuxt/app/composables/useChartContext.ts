/**
 * "Mata" AI: ambil candle Binance yang sesuai dgn symbol + timeframe chart
 * TradingView yang lagi dilihat user, lalu diringkas jadi konteks teks
 * (harga, range, SMA20, RSI14, 10 candle terakhir O/H/L/C).
 */

export interface Candle {
  o: number
  h: number
  l: number
  c: number
  v: number
}

/** Interval TradingView ('1','5','15','60','240') -> interval klines Binance. */
const TF_MAP: Record<string, string> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h'
}

export const tfLabel = (tf: string) => TF_MAP[tf] ?? '1m'

export async function fetchKlines(rest: string, symbol: string, tf: string, limit = 60): Promise<Candle[]> {
  try {
    const raw = await $fetch<Array<Array<string | number>>>(`${rest}/klines`, {
      query: { symbol, interval: tfLabel(tf), limit: String(limit) }
    })
    return (raw ?? [])
      .map(k => ({
        o: Number(k[1]),
        h: Number(k[2]),
        l: Number(k[3]),
        c: Number(k[4]),
        v: Number(k[5])
      }))
      .filter(c => Number.isFinite(c.o) && Number.isFinite(c.c))
  } catch {
    // Binance kena limit / offline → AI tetap jalan tanpa data chart.
    return []
  }
}

/** RSI(14) simpel: rata-rata gain/loss 14 delta terakhir. */
function rsi14(closes: number[]): number {
  if (closes.length < 15) return 50
  let gain = 0
  let loss = 0
  for (let i = closes.length - 14; i < closes.length; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0)
    if (d >= 0) gain += d
    else loss -= d
  }
  if (loss === 0) return 100
  const rs = gain / 14 / (loss / 14)
  return 100 - 100 / (1 + rs)
}

export function summarizeCandles(candles: Candle[], symbol: string, tf: string): string {
  if (candles.length < 2) return ''
  const closes = candles.map(c => c.c)
  const last = closes[closes.length - 1] ?? 0
  const first = closes[0] ?? last
  const winHigh = Math.max(...candles.map(c => c.h))
  const winLow = Math.min(...candles.map(c => c.l))
  const chg = first > 0 ? ((last - first) / first) * 100 : 0
  const last20 = closes.slice(-20)
  const sma20 = last20.reduce((a, b) => a + b, 0) / (last20.length || 1)
  const rsi = rsi14(closes)
  const recent = candles
    .slice(-10)
    .map(c => `${c.o.toFixed(2)}/${c.h.toFixed(2)}/${c.l.toFixed(2)}/${c.c.toFixed(2)}`)
    .join(' | ')

  return [
    `CHART ${symbol} TF ${tfLabel(tf)} (candle Binance, sama dgn chart TradingView yang dilihat user):`,
    `LAST: ${last.toFixed(2)} | Perubahan window: ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% | HIGH: ${winHigh.toFixed(2)} | LOW: ${winLow.toFixed(2)}`,
    `SMA20: ${sma20.toFixed(2)} — harga ${last >= sma20 ? 'DI ATAS' : 'DI BAWAH'} SMA20 (${last >= sma20 ? 'BULLISH' : 'BEARISH'}) | RSI14: ${rsi.toFixed(1)} (${rsi >= 70 ? 'OVERBOUGHT' : rsi <= 30 ? 'OVERSOLD' : 'NETRAL'})`,
    `10 CANDLE TERAKHIR O/H/L/C (lama ke baru): ${recent}`
  ].join('\n')
}
