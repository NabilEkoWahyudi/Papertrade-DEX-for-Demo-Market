# PAPERTRADE DEX — Rebuild dengan Vue 3 + Nuxt

> Brief project untuk **migrasi dan redesign** repo [`Papertrade-DEX-for-Demo-Market`](https://github.com/NabilEkoWahyudi/Papertrade-DEX-for-Demo-Market) dari HTML/JS vanilla + Vercel Functions menjadi aplikasi **Nuxt (Vue 3 + TypeScript)**, dengan tampilan mengacu pada gambar referensi (dark exchange dashboard).

---

## 1. Ringkasan

**PaperTrade DEX** adalah terminal trading simulasi (Perps: Long/Short + leverage) di atas **Solana Devnet**. Pengguna melatih trading memakai **harga pasar asli** (Binance) dengan **risiko nol**, memakai token SPL **$PAPER** sebagai mata uang demo, dibantu **AI Paratrader** untuk sinyal Entry / TP / SL.

Repo saat ini sudah punya semua fitur inti, tetapi dibangun dengan kode yang tersebar dan sebagian duplikat. Project ini bertujuan:

1. **Memindahkan** seluruh fitur ke arsitektur Nuxt yang rapi, bertipe (TypeScript), dan mudah dikembangkan.
2. **Mendesain ulang** UI mengikuti gambar referensi (layout 3 kolom, pair list, order book, tabel transaksi, converter, poll).
3. **Memperbaiki celah** yang ada di versi lama (validasi server, faucet, leaderboard persisten) — lihat bagian 8.

### Identitas Project
| Item | Nilai |
|---|---|
| Nama | PaperTrade DEX — Demo Market |
| Jaringan | Solana **Devnet** (bukan mainnet) |
| Token | **$PAPER** (SPL, 9 desimal) |
| Mint Address | `9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d` |
| Data pasar | Binance WebSocket & REST (publik) |
| Lisensi | GNU GPL v3 (sesuai repo) |

> **Disclaimer:** Seluruh trading bersifat simulasi. Tidak ada uang asli, dan sinyal AI bukan saran keuangan.

---

## 2. Kondisi Repo Saat Ini (Baseline)

```
Papertrade-DEX-for-Demo-Market/
├─ public/
│  ├─ index.html        # UI + inline script (state, WS, faucet, posisi, PnL card)
│  ├─ app.js            # versi lain dari logika yang sama (ID elemen tidak sinkron)
│  └─ style.css
├─ api/                 # Vercel Serverless Functions
│  ├─ chat.js           # AI Paratrader (OpenRouter)
│  ├─ faucet.js         # kirim 1.000 $PAPER
│  ├─ balance.js        # saldo $PAPER wallet
│  ├─ reward.js         # kirim reward (mint masih placeholder)
│  └─ leaderboard.js    # data statis/mock
├─ blockchain/          # script satu kali (create/mint/transfer/metadata token)
├─ server.ts            # Express lokal: duplikat chat + claim-reward + leaderboard (in-memory)
├─ vercel.json
└─ package.json         # baru memuat axios (dependensi Solana belum terdaftar)
```

**Fitur yang sudah ada:**
- Chart **TradingView widget** (BTC/USDT, dark, timezone Asia/Jakarta, toolbar gambar aktif).
- **Order book** live dari Binance (`@depth20@100ms`), harga live (`@ticker`).
- Pilih aset: **BTC / ETH / SOL (USDT)**.
- Form posisi: **LONG / SHORT**, leverage **1–100x**, modal dalam **USDT / USDC / SOL**, **Take Profit / Stop Loss**, kalkulasi size & harga likuidasi.
- **Smart decimal input** (koma → titik, nol di depan tidak terhapus).
- Posisi aktif + **PnL & ROE real-time**, **auto-exit** saat TP/SL tersentuh, tersimpan di `localStorage`.
- **Connect wallet**: Phantom, Solflare (kode lama juga menyiapkan Backpack & Trust), auto-reconnect.
- **Faucet 1.000 $PAPER** per 24 jam + tampilan saldo $PAPER.
- **AI Paratrader**: chat bergaya Lo/Gue, menerima harga + tren 2 menit terakhir, wajib memberi RRR minimal 1 : 1,5.
- **PnL Card** export gambar (html2canvas).
- **Leaderboard "Top Degens"**.

---

## 3. Referensi Desain (gambar)

Gambar referensi adalah dashboard exchange gelap bergaya "Cryptonite". Elemen-elemennya dipetakan ke fitur PaperTrade sebagai berikut:

| Elemen di gambar | Dipakai di PaperTrade sebagai |
|---|---|
| Navbar (Home, Pricing, Platform, Contact, Crypto Wallet, **Exchange**), tombol Login & Try Demo | Navbar; **Login → Connect Wallet**, **Try Demo → Claim 1K $PAPER / masuk ke Exchange** |
| Market bar (Cryptocurrencies, Markets, search, pilih koin) | Search pair + dropdown aset |
| Ticker pair (BTC/USDT, 24h change/low/high/volume) | `PairTicker` dari stream Binance `@ticker` |
| Order form Limit/Market + tombol Buy | **Form posisi Long/Short** (leverage, modal, TP/SL) — tab Limit/Market bisa jadi fase lanjutan |
| All Orders (Order History / Trade History) | **Posisi aktif + riwayat posisi** |
| Pair list (All / Cross / Isolated, Price, Volume) | Daftar pair (BTC, ETH, SOL, dst.) + filter & sort |
| Converter BTC ⇄ USD | Converter aset ⇄ USD (opsional: ⇄ $PAPER) |
| Candlestick + volume + timeframe + Trading view/Original | **TradingView widget** (default) atau `lightweight-charts` untuk tampilan "Original" |
| Order book dengan depth bar (merah/hijau) | `OrderBook` dari `@depth20@100ms` |
| Latest transaction (akun, tanggal, hash, nilai) | **Latest trades / transaksi on-chain devnet** (faucet, reward) dengan link ke explorer |
| Poll "How do you feel about Bitcoin today?" | Sentiment poll (Good / Bad) |

**Tambahan khas PaperTrade** (tidak ada di gambar, tetap dipertahankan): panel **AI Paratrader**, **Faucet + saldo $PAPER**, **Leaderboard**, dan **PnL Card**.

---

## 4. Tech Stack Target

| Kebutuhan | Pilihan |
|---|---|
| Framework | **Nuxt 3** (Vue 3, `<script setup>`, TypeScript) |
| State | **Pinia** (+ `pinia-plugin-persistedstate` untuk posisi & wallet) |
| Styling | **Tailwind CSS**, design tokens dari repo lama (lihat bagian 7) |
| Chart | **TradingView widget** (`tv.js`) + opsional `lightweight-charts` |
| Utilitas | **VueUse** (`useWebSocket`, `useLocalStorage`, `useIntervalFn`, `useClipboard`) |
| Blockchain | `@solana/web3.js`, `@solana/spl-token`, `bs58` (server) |
| Wallet | Wallet Standard / adapter: **Phantom, Solflare, Backpack** (+ Trust opsional) |
| Backend | **Nitro server routes** di `server/api/` (menggantikan `api/*.js` dan `server.ts`) |
| Database | **SQLite/Turso** atau **Upstash Redis / Vercel KV** (leaderboard & cooldown faucet) |
| AI | **OpenRouter** (model saat ini: `google/gemma-3n-e4b-it:free`) |
| Export gambar | `html2canvas` atau `html-to-image` |
| Deploy | **Vercel** (preset Nitro `vercel`) |

---

## 5. Arsitektur & Struktur Folder

```
papertrade-nuxt/
├─ app/
│  ├─ assets/css/main.css
│  ├─ components/
│  │  ├─ layout/        AppNavbar.vue · MarketBar.vue · WalletModal.vue
│  │  ├─ ticker/        PairTicker.vue
│  │  ├─ chart/         TradingViewChart.vue · TimeframeTabs.vue
│  │  ├─ market/        OrderBook.vue · PairList.vue · LatestTrades.vue · SentimentPoll.vue
│  │  ├─ trade/         PositionForm.vue · LeverageSlider.vue · PositionCard.vue
│  │  │                 PositionHistory.vue · CurrencyConverter.vue · PnlCard.vue
│  │  ├─ token/         FaucetButton.vue · PaperBalance.vue
│  │  ├─ social/        Leaderboard.vue
│  │  ├─ ai/            ParatraderChat.vue · ChatBubble.vue
│  │  └─ ui/            Button · Tabs · Input · Select · Modal · Toast · Skeleton
│  ├─ composables/
│  │  ├─ useBinanceStream.ts   # ticker + depth + reconnect
│  │  ├─ useWallet.ts          # connect, auto-reconnect, disconnect
│  │  ├─ usePosition.ts        # buka/tutup posisi, PnL, ROE, likuidasi, auto TP/SL
│  │  ├─ useDecimalInput.ts    # koma → titik, aman untuk "0,05"
│  │  ├─ useFaucet.ts
│  │  └─ useAiChat.ts
│  ├─ stores/   market.ts · wallet.ts · position.ts · chat.ts
│  ├─ pages/    index.vue · exchange.vue · pricing.vue · platform.vue · wallet.vue · contact.vue
│  ├─ layouts/  default.vue
│  └─ types/    market.ts · position.ts
├─ server/
│  ├─ api/
│  │  ├─ chat.post.ts
│  │  ├─ faucet.post.ts
│  │  ├─ balance.get.ts
│  │  ├─ leaderboard.get.ts
│  │  ├─ positions/claim.post.ts   # pengganti claim-reward (validasi server)
│  │  └─ sentiment.post.ts
│  ├─ utils/   solana.ts · binance.ts · rateLimit.ts · db.ts
│  └─ middleware/
├─ scripts/    # pindahan dari /blockchain (create_token, mint_supply, transfer, set_metadata)
├─ public/
├─ .env.example
├─ nuxt.config.ts
└─ package.json
```

### Pemetaan File Lama → Baru

| Lama | Baru |
|---|---|
| `public/index.html` (inline script) + `public/app.js` | Komponen + composable + store (satu sumber logika) |
| `api/chat.js` + route `/api/chat` di `server.ts` | `server/api/chat.post.ts` |
| `api/faucet.js` | `server/api/faucet.post.ts` |
| `api/balance.js` | `server/api/balance.get.ts` |
| `api/leaderboard.js` + `/api/leaderboard` di `server.ts` | `server/api/leaderboard.get.ts` (data dari DB) |
| `api/reward.js` + `/api/claim-reward` | `server/api/positions/claim.post.ts` |
| `blockchain/*.ts` | `scripts/*.ts` (dijalankan manual, bukan bagian runtime) |
| `vercel.json` rewrites | Tidak perlu (Nuxt/Nitro menangani routing) |

### Alur Data
1. Halaman `exchange.vue` membaca **pair aktif** dari store `market`.
2. `useBinanceStream` membuka WebSocket Binance (`@ticker`, `@depth20@100ms`) dan menulis ke store.
3. `usePosition` menghitung PnL/ROE dari harga mark pada setiap tick dan memicu **auto-exit** TP/SL.
4. Aksi yang menyangkut token ($PAPER, faucet, reward, leaderboard) selalu lewat **server route**, tidak langsung dari browser.
5. Komponen chart & WebSocket dirender **client-only** (`<ClientOnly>`); halaman marketing memakai SSR/prerender.

---

## 6. Fitur & Spesifikasi

### 6.1 MVP (paritas dengan repo lama)
- [ ] Layout 3 kolom sesuai referensi, responsif.
- [ ] Chart TradingView (BTC/ETH/SOL), ganti pair dari dropdown / pair list.
- [ ] Order book live + depth bar, harga mark berwarna naik/turun.
- [ ] Ticker 24h (change, low, high, volume).
- [ ] Form posisi **Long/Short**, leverage 1–100x, modal USDT/USDC/SOL, TP/SL.
- [ ] **Smart decimal input** (`0,05` → `0.05`).
- [ ] Kalkulasi **position size** dan **harga likuidasi**.
- [ ] Posisi aktif dengan **PnL & ROE real-time** (tanpa `NaN%`), tombol close, **auto-exit TP/SL**.
- [ ] Persistensi posisi & wallet (Pinia persisted state).
- [ ] Connect wallet (Phantom, Solflare, Backpack) + auto-reconnect.
- [ ] **Faucet 1.000 $PAPER/24 jam** + saldo $PAPER.
- [ ] **AI Paratrader** (chat bubble, harga + tren dikirim sebagai konteks).
- [ ] **PnL Card** export PNG.
- [ ] **Leaderboard** top 10.

### 6.2 Tambahan dari Referensi Desain
- [ ] Navbar + market bar + pair search.
- [ ] Pair list (All / Cross / Isolated, sort harga & volume).
- [ ] Riwayat posisi (Order History / Trade History).
- [ ] Latest trades / transaksi devnet dengan link ke Solana Explorer (cluster devnet).
- [ ] Currency converter.
- [ ] Sentiment poll.
- [ ] Halaman marketing: Home, Pricing, Platform, Wallet, Contact.

### 6.3 Fase Lanjutan
- [ ] Tab **Limit / Market** pada form (limit order simulasi).
- [ ] Banyak posisi sekaligus (saat ini hanya satu `activePosition`).
- [ ] Funding rate / fee simulasi, margin call.
- [ ] Streaming respons AI & riwayat chat.
- [ ] Light theme.

### 6.4 Aturan Bisnis Penting
- Harga mark = harga live Binance.
- Size = `(modal_USD × leverage) / harga_entry`.
- PnL: LONG `(mark − entry) × size`, SHORT `(entry − mark) × size`.
- ROE = `PnL / modal_USD × 100`.
- Likuidasi (versi sederhana repo): LONG `entry − entry/lev`, SHORT `entry + entry/lev`.
- Konversi modal SOL → USD memakai harga `SOLUSDT` (fallback jika gagal diambil).
- Prompt AI: format "SETUP PARATRADER" (Posisi, Entry, SL, TP, Leverage, Alasan) dan **RRR minimal 1 : 1,5**.

---

## 7. Design Tokens

Diambil dari `style.css` repo lama agar identitas visual tetap konsisten, lalu dipadukan dengan gaya gambar referensi.

| Token | Nilai | Penggunaan |
|---|---|---|
| `--bg` | `#0b0e11` | Latar halaman |
| `--panel` | `#161a1e` | Panel / card |
| `--border` | `#2b3139` | Garis pemisah |
| `--text` | `#eaecef` | Teks utama |
| `--sub` | `#848e9c` | Teks sekunder |
| `--accent` | `#3772ff` | Tombol utama, link, aksen |
| `--green` | `#0ecb81` | Long, bid, profit |
| `--red` | `#f6465d` | Short, ask, loss |
| `--gold` | `#f0b90b` | Tombol PnL/share |

- **Font:** Inter (UI) dan JetBrains Mono / Roboto Mono (angka, order book). Gunakan `tabular-nums`.
- **Bentuk:** radius 10–16px, border tipis, tanpa shadow berat; panel rapat (spirit "zero-gap") tanpa celah hitam di bawah chart.
- **Ikon koin** (BTC oranye `#F7931A`) mengikuti gambar referensi.

---

## 8. Catatan Keamanan & Perbaikan dari Versi Lama

Hal-hal berikut ditemukan saat membaca repo dan sebaiknya dibereskan selama migrasi:

1. **Cooldown faucet hanya di browser.** Batas 24 jam disimpan di `localStorage`, sedangkan `/api/faucet` tidak memeriksa apa pun. Siapa pun bisa memanggil endpoint langsung atau menghapus storage untuk klaim berulang. → Simpan waktu klaim **per wallet di server (DB/KV)** dan tolak klaim sebelum 24 jam; tambahkan rate limit per IP.
2. **Klaim reward mempercayai data dari klien.** `/api/claim-reward` menerima `entryPrice` dan `side` dari request, lalu hanya membandingkannya dengan harga sekarang. Klien bisa mengirim `entryPrice` palsu agar selalu "menang". → Catat posisi **di server** saat dibuka (entry price diambil server dari Binance), lalu validasi klaim terhadap catatan tersebut.
3. **Leaderboard** saat ini mock (`api/leaderboard.js`) atau disimpan di RAM server (`server.ts`) sehingga hilang saat restart/redeploy. → Pindahkan ke database.
4. **Dua backend duplikat** (Vercel Functions dan Express) dengan prompt AI yang disalin. → Satu set Nitro server routes, satu sumber prompt di `server/utils`.
5. **`reward.js` masih memakai mint placeholder** (`MASUKAN_ALAMAT_TOKEN_DISINI`) dan `server.ts` memakai tx hash dummy. → Isi dengan implementasi transfer sungguhan atau hapus.
6. **Logika frontend terpecah** antara inline script `index.html` dan `app.js` dengan ID elemen berbeda. → Satukan menjadi composable/store.
7. **`package.json` belum mencantumkan** `@solana/web3.js`, `@solana/spl-token`, `bs58`, `express`, `dotenv`, dsb. → Daftarkan lengkap di project baru.
8. **Private key dev** (`SOLANA_PRIVATE_KEY`) dan `OPENROUTER_API_KEY` hanya boleh ada di environment server (`runtimeConfig` privat), jangan pernah di `runtimeConfig.public` atau commit. Sediakan `.env.example`. Gunakan wallet khusus devnet dengan saldo seperlunya.
9. **Render HTML dari input** (chat memakai `innerHTML`) rawan XSS. → Di Vue gunakan interpolasi `{{ }}` / `v-text`, hindari `v-html` untuk pesan user maupun balasan AI.
10. **Kunci publik Solana & mint address** boleh publik; tetapi `mint authority` dan `freeze authority` masih dipegang wallet dev. Pertimbangkan membatasi/revoke authority bila token dipublikasikan lebih luas.

---

## 9. Environment Variables

```bash
# .env.example  (JANGAN commit file .env asli)
OPENROUTER_API_KEY=
SOLANA_PRIVATE_KEY=            # base58, wallet devnet saja
SOLANA_CLUSTER=devnet
PAPER_MINT=9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d
FAUCET_AMOUNT=1000
FAUCET_COOLDOWN_HOURS=24
KV_REST_API_URL=               # jika memakai Upstash / Vercel KV
KV_REST_API_TOKEN=
```

Contoh `nuxt.config.ts` minimal:

```ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/tailwindcss'],
  typescript: { strict: true },
  runtimeConfig: {
    openrouterApiKey: '',       // privat, hanya server
    solanaPrivateKey: '',       // privat, hanya server
    public: {
      solanaCluster: 'devnet',
      paperMint: '9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d',
      binanceWs: 'wss://data-stream.binance.vision/ws'
    }
  },
  nitro: { preset: 'vercel' }
})
```

---

## 10. Responsivitas

| Breakpoint | Layout |
|---|---|
| ≥ 1280px | 3 kolom: kiri (form + posisi + pair list), tengah (chart + trades), kanan (order book) |
| 768–1279px | 2 kolom; order book di bawah chart |
| < 768px | 1 kolom dengan tab: **Chart / Order Book / Trade / AI / Leaderboard** |

AI Paratrader pada layar besar tampil sebagai panel di kolom kiri; pada mobile menjadi tab atau drawer.

---

## 11. Roadmap

| Fase | Pekerjaan | Hasil |
|---|---|---|
| **1. Setup** | Init Nuxt, Tailwind, Pinia, VueUse, design tokens, `.env.example` | Project siap jalan |
| **2. UI Statis** | Semua komponen sesuai referensi dengan mock data | Tampilan menyerupai gambar |
| **3. Market Data** | `useBinanceStream`, ticker, order book, ganti pair, chart | Data live |
| **4. Trading Sim** | Form posisi, leverage, TP/SL, PnL/ROE, auto-exit, persistensi | Simulasi berfungsi |
| **5. Wallet & Token** | Connect wallet, saldo $PAPER, faucet (validasi server) | Integrasi Devnet |
| **6. AI & Social** | Paratrader chat, leaderboard (DB), PnL Card, poll | Fitur khas PaperTrade |
| **7. Halaman Lain** | Home, Pricing, Platform, Wallet, Contact + SEO | Situs lengkap |
| **8. Hardening** | Rate limit, validasi server, XSS check, error state, deploy Vercel | Siap rilis |

---

## 12. Kriteria Selesai

- Semua fitur di bagian 6.1 berjalan setara dengan versi lama.
- Tampilan desktop mendekati gambar referensi.
- Harga, order book, dan PnL terupdate real-time tanpa lag; tidak ada `NaN%`.
- Faucet dan klaim reward **tidak bisa dibypass** dari klien (cooldown & validasi di server).
- Leaderboard bertahan setelah redeploy.
- Tidak ada secret di bundle klien maupun di repository.
- Berjalan baik di desktop, tablet, dan mobile; Lighthouse halaman marketing ≥ 90 (Performance & SEO).
- README diperbarui: cara jalan lokal, env, deploy, dan screenshot.

---

## 13. Setup Cepat

```bash
npx nuxi@latest init papertrade-nuxt
cd papertrade-nuxt

npm i pinia @pinia/nuxt pinia-plugin-persistedstate @vueuse/nuxt
npm i @solana/web3.js @solana/spl-token bs58 html2canvas
npm i -D @nuxtjs/tailwindcss typescript

cp .env.example .env     # isi OPENROUTER_API_KEY & SOLANA_PRIVATE_KEY (devnet)
npm run dev
```

---

## 14. Catatan

- Desain referensi milik pembuat aslinya; gunakan sebagai inspirasi dan gunakan logo/brand PaperTrade sendiri.
- Binance public API & OpenRouter model gratis memiliki **rate limit**; tangani dengan cache/backoff dan pesan error yang jelas.
- Ini adalah simulator edukasi di **devnet**; $PAPER tidak memiliki nilai uang.
