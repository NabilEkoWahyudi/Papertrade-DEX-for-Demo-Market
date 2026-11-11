import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Depth, DepthEntry, Ticker24h } from '~/types/market'

export const useMarketStore = defineStore('market', () => {
  // --- State ---
  const symbol = ref('BTCUSDT')
  // Timeframe chart aktif (id TradingView): '1','5','15','60','240' — dipakai
  // TradingViewChart DAN buat ambil klines Binance sebagai konteks AI.
  const timeframe = ref('1')
  const ticker = ref<Ticker24h>({ price: 0, changePct: 0, high: 0, low: 0, quoteVolume: 0 })
  const depth = ref<Depth>({ bids: [], asks: [] })
  const priceHistory = ref<number[]>([])
  const solPrice = ref(0)
  const pairStats = ref<Record<string, { price: number; change: number; volume: number }>>({})

  // --- Getters ---
  const lastPrice = computed(() => priceHistory.value[priceHistory.value.length - 2] ?? 0)
  const markPrice = computed(() => ticker.value.price)
  const priceUp = computed(() => markPrice.value >= lastPrice.value)

  const trendPct = computed(() => {
    const h = priceHistory.value
    const first = h[0] ?? markPrice.value
    if (!first || !markPrice.value) return 0
    return ((markPrice.value - first) / first) * 100
  })

  // --- Actions ---
  function setSymbol(s: string) {
    if (s === symbol.value) return
    symbol.value = s
    depth.value = { bids: [], asks: [] }
    priceHistory.value = []
  }

  function pushTicker(raw: Record<string, string | undefined>) {
    const c = parseFloat(raw.c ?? '0')
    if (!Number.isFinite(c)) return
    const prev = ticker.value.price
    ticker.value = {
      price: c,
      changePct: parseFloat(raw.P ?? '0') || 0,
      high: parseFloat(raw.h ?? '0') || 0,
      low: parseFloat(raw.l ?? '0') || 0,
      quoteVolume: parseFloat(raw.q ?? '0') || 0
    }
    if (prev > 0) priceHistory.value.push(c)
    else priceHistory.value.push(c)
    if (priceHistory.value.length > 240) priceHistory.value.splice(0, priceHistory.value.length - 240)
  }

  // --- Throttle state utk depth ---
  const DEPTH_COMMIT_MS = 250
  let depthTimer: ReturnType<typeof setTimeout> | null = null
  let depthPending: { bids: DepthEntry[]; asks: DepthEntry[] } | null = null
  let depthLastCommit = 0

  function pushDepth(raw: { bids?: DepthEntry[]; asks?: DepthEntry[] }) {
    if (!Array.isArray(raw.bids) || !Array.isArray(raw.asks)) return
    // Throttle commit ke ~4x/detik: stream @100ms tetap ditampung (trailing),
    // tapi re-render OrderBook turun 60%. Visual masih terasa live.
    depthPending = { bids: raw.bids, asks: raw.asks }
    if (depthTimer) return
    const wait = Math.max(0, DEPTH_COMMIT_MS - (Date.now() - depthLastCommit))
    depthTimer = setTimeout(() => {
      depthTimer = null
      depthLastCommit = Date.now()
      if (depthPending) depth.value = depthPending
      depthPending = null
    }, wait)
  }

  return {
    symbol, timeframe, ticker, depth, priceHistory, solPrice, pairStats,
    lastPrice, markPrice, priceUp, trendPct,
    setSymbol, pushTicker, pushDepth
  }
})
