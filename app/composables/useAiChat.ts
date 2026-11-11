import { useChatStore } from '~/stores/chat'
import { useMarketStore } from '~/stores/market'
import { storeToRefs } from 'pinia'
import { fetchKlines, summarizeCandles } from '~/composables/useChartContext'

/** Bangun konteks harga + tren 2 menit terakhir untuk AI (paritas dgn versi lama). */
export function buildMarketData(market: ReturnType<typeof useMarketStore>): string {
  const price = market.markPrice
  const trendPct = market.trendPct
  const trend = trendPct >= 0 ? 'NAIK (BULLISH)' : 'TURUN (BEARISH)'
  return [
    `ASSET: ${market.symbol}`,
    `PRICE: $${price ? price.toFixed(2) : '--'}`,
    `TREND 2 MENIT TERAKHIR: ${trend} (${trendPct.toFixed(2)}%).`,
    'Jika Trend NAIK tajam (>0.5%), pertimbangkan SHORT (Overbought).',
    'Jika Trend TURUN tajam (<-0.5%), pertimbangkan LONG (Oversold).'
  ].join(' | ')
}

export function useAiChat() {
  const chat = useChatStore()
  const market = useMarketStore()
  const { messages, sending } = storeToRefs(chat)

  // Pengaturan OpenRouter: diisi user via UI, disimpan di localStorage browser.
  // Dikirim per-request ke server — server TIDAK menyimpan key ini.
  const aiApiKey = ref('')
  const aiModel = ref('')

  if (import.meta.client) {
    onMounted(() => {
      try {
        const raw = localStorage.getItem('papertrade.ai')
        if (raw) {
          const s = JSON.parse(raw) as { apiKey?: string; model?: string }
          aiApiKey.value = s.apiKey ?? ''
          aiModel.value = s.model ?? ''
        }
      } catch {
        // localStorage rusak → mulai kosong.
      }
    })
  }

  function saveAiSettings(key: string, model: string) {
    aiApiKey.value = key.trim()
    aiModel.value = model.trim()
    try {
      localStorage.setItem('papertrade.ai', JSON.stringify({ apiKey: aiApiKey.value, model: aiModel.value }))
    } catch {}
  }

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || chat.sending) return

    // --- Konteks chart: candle Binance FRESH sesuai symbol + timeframe chart aktif ---
    // (diambil tiap kirim pesan biar selalu sinkron dgn yang ditampilkan TradingView)
    let chartData = ''
    try {
      const config = useRuntimeConfig()
      const rest = String(config.public.binanceRest ?? 'https://data-api.binance.vision/api/v3')
      const candles = await fetchKlines(rest, market.symbol, market.timeframe, 60)
      chartData = summarizeCandles(candles, market.symbol, market.timeframe)
    } catch {
      // gagal ambil klines → AI tetap jawab tanpa data chart
    }

    // --- Ingatan AI: kirim 12 pesan terakhir (tanpa pesan yg baru dipush ini) ---
    const history = messages.value
      .slice(-12)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text.slice(0, 600) }))

    chat.push('user', msg)
    chat.sending = true
    try {
      const res = await $fetch<{ reply: string }>('/api/chat', {
        method: 'POST',
        // Timeout 45s di sisi browser: tombol KIRIM nggak boleh ngambek selamanya.
        signal: AbortSignal.timeout(45_000),
        body: {
          message: msg,
          marketData: buildMarketData(market),
          chartData: chartData || undefined,
          history,
          apiKey: aiApiKey.value || undefined,
          model: aiModel.value || undefined
        }
      })
      chat.push('ai', res.reply || 'AI lagi bengong Boss.')
    } catch (e) {
      const err = e as { name?: string; statusCode?: number; data?: { statusCode?: number; message?: string } }
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        chat.push('ai', 'Model AI-nya kelamaan jawab (>45 detik), gua cancel biar nggak macet. Coba lagi Boss.')
      } else if (err?.statusCode === 429 || err?.data?.statusCode === 429) {
        chat.push('ai', 'Kirim pesan kekejegan Boss — kasih jeda 1 menit dulu, rate limit-nya nyampe.')
      } else {
        chat.push('ai', 'AI-nya lagi NGADAT Boss, coba lagi.')
      }
    } finally {
      chat.sending = false
    }
  }

  return { messages, sending, send, aiApiKey, aiModel, saveAiSettings }
}
