import { useWebSocket } from '@vueuse/core'
import { useMarketStore } from '~/stores/market'

/**
 * Buka dua stream Binance utk pair aktif:
 *  - <symbol>@ticker          → harga live, high/low/24h
 *  - <symbol>@depth20@100ms   → order book depth
 * Auto-reconnect + reopen otomatis saat ganti pair.
 * Panggil dari onMounted (client-only).
 */
export function useBinanceStream() {
  const market = useMarketStore()
  const config = useRuntimeConfig()
  const base = config.public.binanceWs

  const tickerUrl = computed(() => `${base}/${market.symbol.toLowerCase()}@ticker`)
  const depthUrl = computed(() => `${base}/${market.symbol.toLowerCase()}@depth20@100ms`)

  const { status: tickerStatus, send: tickerSend, close: tickerClose } = useWebSocket(tickerUrl, {
    autoReconnect: { retries: 20, delay: 1500, onFailed: () => market.pushTicker({ c: String(market.markPrice || 0) }) },
    // Tanpa heartbeat: Binance ping/pong di level WebSocket ditangani browser;
    // heartbeat app-level cuma memicu balasan error frame dari Binance.
    onMessage: (_ws, e) => {
      try { market.pushTicker(JSON.parse(e.data)) } catch {}
    }
  })

  const { status: depthStatus, send: depthSend, close: depthClose } = useWebSocket(depthUrl, {
    autoReconnect: { retries: 20, delay: 1500 },
    onMessage: (_ws, e) => {
      try { market.pushDepth(JSON.parse(e.data)) } catch {}
    }
  })

  return { tickerStatus, depthStatus, tickerSend, depthSend, tickerClose, depthClose }
}
