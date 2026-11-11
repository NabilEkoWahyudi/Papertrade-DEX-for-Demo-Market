export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  // DevTools off: Nuxt DevTools + vite-plugin-inspect menginstrumentasi semua
  // transform di dev mode → bikin server dev jauh lebih berat. (Aktifkan lagi
  // manual dengan `npx nuxi devtools enable` kalau perlu.)
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt'
  ],

  tailwindcss: { cssPath: '~/assets/css/main.css' },

  components: [{ path: '~/components', pathPrefix: false }],

  typescript: { strict: true, typeCheck: false },

  runtimeConfig: {
    // --- PRIVATE (server only, jangan pernah dibundle ke klien) ---
    openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemma-3n-e4b-it:free',
    solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY || '',
    solanaCluster: process.env.SOLANA_CLUSTER || 'devnet',
    paperMint: process.env.PAPER_MINT || '9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d',
    faucetAmount: Number(process.env.FAUCET_AMOUNT) || 1000,
    faucetCooldownHours: Number(process.env.FAUCET_COOLDOWN_HOURS) || 24,
    rewardAmount: Number(process.env.REWARD_AMOUNT) || 100,
    kvRestApiUrl: process.env.KV_REST_API_URL || '',
    kvRestApiToken: process.env.KV_REST_API_TOKEN || '',
    // --- PUBLIC ---
    public: {
      solanaCluster: 'devnet',
      paperMint: '9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d',
      binanceWs: 'wss://data-stream.binance.vision/ws',
      binanceRest: 'https://data-api.binance.vision/api/v3'
    }
  },

  app: {
    head: {
      titleTemplate: '%s · PaperTrade DEX',
      htmlAttrs: { lang: 'id' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Terminal trading simulasi Perps di Solana Devnet — harga pasar asli Binance, risiko nol, token $PAPER, dan sinyal AI Paratrader.'
        }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // Preconnect: TCP+TLS ke domain berat dimulai selagi HTML di-parse.
        { rel: 'preconnect', href: 'https://s.tradingview.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://data-api.binance.vision', crossorigin: '' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap'
        }
      ]
    }
  },

  // Aktifkan preset Vercel saat deploy: NITRO_PRESET=vercel npm run build
  ...(process.env.NITRO_PRESET === 'vercel' ? { nitro: { preset: 'vercel' } } : {})
})
