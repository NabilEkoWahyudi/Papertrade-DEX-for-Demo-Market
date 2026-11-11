<script setup lang="ts">
const steps = [
  { title: 'Connect Wallet', text: 'Phantom, Solflare, atau Backpack — plus auto-reconnect biar nggak nyambung ulang tiap buka tab.' },
  { title: 'Ambil $PAPER', text: 'Claim faucet dapat 1.000 $PAPER setiap 24 jam. Server yang pegang cooldown, bukan browser lu.' },
  { title: 'Baca market, tanya AI', text: 'Chart TradingView dengan alat gambar aktif. Paratrader AI ngasih setup: Posisi, Entry, SL, TP, Leverage, dan Alasan.' },
  { title: 'Buka posisi dengan leverage', text: 'LONG atau SHORT, leverage 1–100x, modal USDT/USDC/SOL dengan smart decimal input (0,05 aman).' },
  { title: 'Profit, naik leaderboard', text: 'Tutup posisi saat cuan, langsung tercatat di Leaderboard Top Degens + reward $PAPER dikirim on-chain.' }
]

useSeoMeta({ title: 'Platform', description: 'Fitur lengkap PaperTrade: AI Paratrader, faucet token, harga live, simulasi Perps di devnet.' })
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-black text-white">Platform</h1>
    <p class="text-sub mt-2 max-w-2xl text-sm">Semua yang PaperTrade punya, dijelaskan satu per satu.</p>
    <ol class="mt-10 space-y-8">
      <li v-for="(s, i) in steps" :key="s.title" class="flex gap-5 items-start">
        <div class="w-10 h-10 rounded-xl bg-accent/15 text-accent font-black flex items-center justify-center shrink-0" style="border:1px solid rgba(55,114,255,.3)">
          {{ i + 1 }}
        </div>
        <div>
          <h3 class="font-bold text-textp">{{ s.title }}</h3>
          <p class="text-sub text-sm mt-1 max-w-2xl">{{ s.text }}</p>
        </div>
      </li>
    </ol>
    <div class="mt-12">
      <NuxtLink to="/exchange" class="inline-block bg-gold text-black font-black text-xs uppercase tracking-wide px-6 py-3.5 rounded-lg hover:brightness-110 transition">
        Mulai Coba
      </NuxtLink>
    </div>
  </div>
</template>
