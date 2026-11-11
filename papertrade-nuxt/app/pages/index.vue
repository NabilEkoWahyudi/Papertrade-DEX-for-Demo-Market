<script setup lang="ts">
const feats = [
  { icon: 'cpu', title: 'AI Paratrader yang Lihat Harga', text: 'AI dikasih harga real-time + tren 2 menit di tiap analisa. Sinyal Entry, TP, SL dan leverage selalu cek RRR minimal 1:1,5.' },
  { icon: 'droplet', title: 'Faucet Harian $PAPER', text: '1.000 $PAPER per 24 jam. Cooldown dipegang server — nggak bisa diakali dengan hapus localStorage.' },
  { icon: 'chart', title: 'Harga & Order Book Real-Time', text: 'WebSocket Binance (@ticker & @depth20@100ms) dengan update di bawah 200ms.' },
  { icon: 'target', title: 'TP / SL Auto-Exit', text: 'Set Take Profit & Stop Loss, sistem menutup posisi otomatis begitu harga tersentuh.' },
  { icon: 'trophy', title: 'Leaderboard Top Degens', text: 'Skor cuan dicatat di database persisten — bertahan walau server di-redeploy.' },
  { icon: 'image', title: 'PnL Card Shareable', text: 'Export keuntungan jadi gambar PNG. Tanpa bug NaN% — dijamin klien maupun server memvalidasi.' }
]

useSeoMeta({
  title: 'PaperTrade DEX — Terminal Trading Simulasi',
  description: 'Latih trading Perps dengan data pasar asli Binance di atas Solana Devnet. Risiko nol, token $PAPER, AI Paratrader lengkap dengan Entry/TP/SL.'
})
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="bg-gradient-to-b from-panel to-bg border-b border-borderp">
      <div class="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <span class="chip-ok inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full mb-5">
          <UiIcon name="shield" :size="12" />SOLANA DEVNET · SIMULASI · RISIKO 0%
        </span>
        <h1 class="text-3xl md:text-5xl font-black leading-tight text-white">
          Terminal Trading Simulasi<br>
          <span class="text-gold">No.1 di Solana</span>, tanpa takut rugi.
        </h1>
        <p class="mt-4 text-sub max-w-xl text-sm md:text-base">
          Latih trading derivatif (Perps) dengan harga pasar <strong class="text-textp">asli</strong> Binance,
          token SPL <strong class="text-textp">$PAPER</strong> sebagai mata uang demo,
          plus asisten sinyal <strong class="text-textp">AI Paratrader</strong> yang nggak buta harga.
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <NuxtLink to="/exchange" class="bg-gold text-black font-black text-xs uppercase tracking-wide px-6 py-3.5 rounded-lg hover:brightness-110 transition">
            Try Demo — Claim 1K $PAPER
          </NuxtLink>
          <NuxtLink to="/platform" class="bg-transparent border border-borderp text-textp font-bold text-xs uppercase tracking-wide px-6 py-3.5 rounded-lg hover:border-accent transition">
            Lihat Platformnya
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="max-w-6xl mx-auto px-6 py-14">
      <h2 class="text-2xl font-black text-white">Fitur Utama</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
        <div v-for="f in feats" :key="f.title" class="panel rounded-xl p-5">
          <div class="mb-2.5 text-gold"><UiIcon :name="f.icon" :size="24" /></div>
          <h3 class="font-bold text-textp text-sm">{{ f.title }}</h3>
          <p class="mt-1.5 text-[12px] text-sub leading-relaxed">{{ f.text }}</p>
        </div>
      </div>
    </section>

    <!-- DISCLAIMER -->
    <section class="border-t border-borderp bg-panel">
      <div class="max-w-6xl mx-auto px-6 py-8 text-center text-[12px] text-sub flex items-center justify-center gap-1.5 flex-wrap">
        <UiIcon name="warning" :size="14" class="text-gold shrink-0" />
        <span>
          Disclaimer: Seluruh trading bersifat simulasi. Tidak ada uang asli. $PAPER tidak punya nilai ekonomi.
          Sinyal AI bukan saran finansial.
        </span>
      </div>
    </section>
  </div>
</template>
