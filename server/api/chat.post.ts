export default defineEventHandler(async (event) => {
  const body = await readJsonBody(event)
  const message = String(body.message ?? '').slice(0, 600)
  const marketData = String(body.marketData ?? '').slice(0, 1200)
  // Konteks chart: candle Binance sesuai timeframe TradingView yang dilihat user.
  const chartData = String(body.chartData ?? '').slice(0, 2200)

  // Kredensial dari UI klien (disimpan di localStorage browser, dikirim
  // per-request — TIDAK disimpan/persist di server). Fallback ke env.
  const bodyKey = typeof body.apiKey === 'string' ? body.apiKey.trim().slice(0, 200) : ''
  const bodyModel = typeof body.model === 'string' && /^[A-Za-z0-9._/:-]{1,100}$/.test(body.model.trim())
    ? body.model.trim()
    : ''

  // Ingatan AI: riwayat percakapan dari klien. Max 12 pesan, tiap pesan 600 char.
  const rawHistory: Array<unknown> = Array.isArray(body.history) ? body.history : []
  const history = rawHistory
    .slice(-12)
    .map((m) => {
      const mm = m as { role?: unknown; text?: unknown }
      const role = mm?.role === 'user' || mm?.role === 'assistant' ? mm.role : null
      const text = typeof mm?.text === 'string' ? mm.text.trim().slice(0, 600) : ''
      return role && text ? { role, content: text } : null
    })
    .filter((m): m is { role: string; content: string } => m !== null)

  if (!message.trim()) {
    return { reply: 'Pesan kosong Boss. Mau analisa market?' }
  }

  // Anti spam
  enforceRate(event, 'chat', 20, 60_000)

  const config = useRuntimeConfig(event)
  const apiKey = bodyKey || config.openrouterApiKey || process.env.OPENROUTER_API_KEY || ''
  if (!apiKey) {
    return { reply: 'AI belum dikonfigurasi. Buka panel PARATRADER AI → tombol SETUP → isi API key + Model ID OpenRouter, Boss.' }
  }

  const model = bodyModel || config.openrouterModel || 'google/gemma-3n-e4b-it:free'
  const system = buildParatraderSystem(marketData, chartData)
  const payloadMessages = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: message }
  ]

  try {
    const res = await $fetch<{ choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        // Timeout keras 30s: model yang antri/lemot nggak boleh bikin request
        // ngegantung selamanya (ini penyebab utama AI "macet" sebelumnya).
        signal: AbortSignal.timeout(30_000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://papertrade.app',
          'X-Title': 'PaperTrade Perps'
        },
        body: {
          model,
          // Kalau model utama error/antri, OpenRouter otomatis coba fallback
          // ke model free default — request tetap dijawab, nggak macet.
          models: Array.from(new Set([model, 'google/gemma-3n-e4b-it:free'])),
          messages: payloadMessages,
          temperature: 0.7,
          max_tokens: 700
        }
      }
    )

    if (res?.error?.message) {
      return { reply: `Duh, OpenRouter lagi error Boss: ${res.error.message}` }
    }
    return { reply: res?.choices?.[0]?.message?.content || 'AI lagi bengong Boss.' }
  } catch (e) {
    const err = e as { name?: string; statusCode?: number; cause?: { name?: string }; data?: { error?: { message?: string } } }
    const timedOut = err?.name === 'AbortError' || err?.name === 'TimeoutError' || err?.cause?.name === 'TimeoutError'
    if (timedOut) {
      return { reply: 'Model AI-nya kelamaan jawab (>30 detik), gua cancel biar nggak macet. Coba lagi, atau ganti model lebih ringan di SETUP, Boss.' }
    }
    if (err?.statusCode === 401) {
      return { reply: 'API key OpenRouter ditolak (401). Cek lagi API key lu lewat tombol SETUP di panel AI, Boss.' }
    }
    const msg = err?.data?.error?.message
    return { reply: msg ? `AI-nya lagi NGADAT Boss: ${msg}` : 'AI-nya lagi NGADAT Boss, coba lagi.' }
  }
})
