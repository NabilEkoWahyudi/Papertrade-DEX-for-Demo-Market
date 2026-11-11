# PaperTrade DEX — Nuxt Rebuild

Rebuild dari [`Papertrade-DEX-for-Demo-Market`](https://github.com/NabilEkoWahyudi/Papertrade-DEX-for-Demo-Market) (HTML/JS vanilla + Vercel Functions) menjadi aplikasi **Nuxt (Vue 3 + TypeScript + Pinia + Tailwind + VueUse)**. Lihat `PROJECT.md` untuk brief lengkapnya.

## Fitur

**Paritas dgn versi lama:**
- Chart TradingView (BTC/ETH/SOL + 6 pair tambahan), ganti pair via market bar & pair list
- Order book live `@depth20@100ms` + harga mark naik/turun
- Ticker 24h (change, high, low, volume)
- Form posisi **LONG/SHORT** — leverage 1–100x, modal USDT/USDC/SOL, TP/SL
- **Smart decimal input** (`0,05` → `0.05`, leading zero aman) via `useDecimalInput`
- Kalkulasi **position size** & **harga likuidasi**
- Posisi aktif **PnL & ROE real-time** (bebas NaN%), tombol close, **auto-exit TP/SL**
- Persistensi posisi & wallet (Pinia persisted state)
- **Wallet detection dinamis** — semua wallet Solana yang terpasang di browser otomatis terdeteksi (provider injected dikenal + **Wallet Standard** + scan generik `window`), tinggal klik untuk login + auto-reconnect
- **Faucet 1.000 $PAPER / 24 jam** + saldo $PAPER
- **AI Paratrader** (chat bergaya WhatsApp, harga + tren dikirim sbg konteks)
- **PnL Card** export PNG (digambar manual via Canvas 2D — andal, tanpa dependensi html-to-image)
- **Leaderboard Top Degens**

**Tambahan sesuai desain referensi:** navbar + market bar + search, pair list (sort harga/volume), riwayat posisi, latest transaksi on-chain devnet + link Solana Explorer, currency converter, sentiment poll, halaman marketing (Home, Platform, Wallet, Contact — tanpa pricing, app ini pure gratis), layout responsif 3 kolom → 2 kolom → tab mobile (Chart / OB / Trade / AI / LB).

**Tanpa emoji:** seluruh UI memakai icon SVG stroke lokal (`app/utils/uiIcons.ts` via `<UiIcon>`), tiap pair memakai **icon crypto asli** yang di-bundle lokal (`app/utils/coinIcons.ts` via `<CoinIcon>` — BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, LINK), dan favicon SVG ada di `public/favicon.svg`.

## Hardening (perbaikan dari versi lama)

| Masalah lama | Solusi di repo ini |
|---|---|
| Cooldown faucet cuman di `localStorage` | Validasi cooldown **per wallet di server** (`/api/faucet`) + rate limit per IP + penyimpanan KV |
| `/api/claim-reward` percaya `entryPrice` dari klien | Posisi dicatat server saat dibuka (`/api/positions/open`), entry price **diambil server dari Binance**; claim (`/api/positions/claim`) memvalidasi PDPT kembali |
| Leaderboard mock/in-memory (hilang saat redeploy) | Leaderboard tersimpan di **Upstash Redis / Vercel KV** (fallback file JSON `.data/db.json` untuk dev) |
| Dua backend duplikat (Vercel Fn + Express) | **Satu set Nitro route** di `server/api/`, satu sumber prompt di `server/utils/ai.ts` |
| `reward.js` mint placeholder & tx dummy | Semua transfer $\paper pakai implementasi SPL **sungguhan** (`server/utils/solana.ts`) |
| Frontend logika terpecah (inline script vs app.js) | Satu sumber: Pinia stores + composables |
| Dependensi tak terdaftar | `package.json` lengkap (web3.js, spl-token, bs58, css, pinia, dll) |
| Secret bocor ke klien | Kunci hanya di `runtimeConfig` privat/env server; `.env.example` disertakan |
| XSS via `innerHTML` | Chat memakai interpolasi `{{ }}` (tanpa `v-html`) |
| mint/freeze authority dipegang dev | Di-dokumentasikan: batasi/revoke sebelum dipublikasikan |

## Cara Jalan Lokal

```bash
npm install

cp .env.example .env
# isi:
#   OPENROUTER_API_KEY=...   (dari https://openrouter.ai)
#   SOLANA_PRIVATE_KEY=...   (wallet devnet saja, base58)
npm run dev
```

Buka `http://localhost:3000`.

> Without env keys: aplikasi tetap jalan (market data live), tapi faucet/reward gagal transfer & AI menjawab "API key belum dipasang".

## ENV Variables

Semua **server-only** (tidak pernah dibundle ke klien):

```bash
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemma-3n-e4b-it:free
SOLANA_PRIVATE_KEY=            # base58, wallet devnet saja
SOLANA_CLUSTER=devnet
PAPER_MINT=9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d
FAUCET_AMOUNT=1000
FAUCET_COOLDOWN_HOURS=24
REWARD_AMOUNT=100
KV_REST_API_URL=              # Upstash Redis / Vercel KV (opsional tapi disarankan)
KV_REST_API_TOKEN=
```

## Deploy ke Vercel

```bash
# set env di dashboard Vercel, lalu:
NITRO_PRESET=vercel npm run build
# atau set nitro: { preset: 'vercel' } di nuxt.config.ts
```
Pastikan `KV_REST_API_URL/TOKEN` di isi supaya leaderboard & cooldown faucet **bertahan setelah redeploy**.

## Scripts Token (manual — lanjutan `blockchain/` di repo lama, sekarang `scripts/`)

```bash
npm run token:create      # bikin mint baru (hati-hati!)
npm run token:mint        # tambah supply
npm run token:transfer    # kirim ke wallet lain
npm run token:metadata    # update metadata Metaplex
```

## Arsitektur

```
app/
├─ components/  layout · ticker · chart · market · trade · token · social · ai · ui
├─ composables/ useBinanceStream · useWallet · useWalletDetection · usePosition · useFaucet · useAiChat · useDecimalInput
├─ stores/      market · wallet · position · chat · ui
├─ pages/       index · exchange · platform · wallet · contact
├─ types/       market · position
server/
├─ api/         chat.post · faucet.post · balance.get · leaderboard.get
│               sentiment.get/post · positions/open.post · positions/claim.post
└─ utils/       binance.ts · solana.ts · db.ts (KV) · rateLimit.ts · ai.ts · body.ts
scripts/        create_token · mint_supply · transfer · set_metadata
public/         favicon.svg
```

Screenshot: jalankan `npm run dev` lalu buka `/exchange`.
