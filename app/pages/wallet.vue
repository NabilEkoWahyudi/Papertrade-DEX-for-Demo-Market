<script setup lang="ts">
import type { DetectedWallet } from '~/composables/useWalletDetection'
import { useWalletStore } from '~/stores/wallet'
import { useWallet } from '~/composables/useWallet'
import { useUiStore } from '~/stores/ui'

useSeoMeta({ title: 'Wallet', description: 'Hubungkan wallet Solana & lihat saldo token $PAPER di devnet.' })

const wallet = useWalletStore()
const ui = useUiStore()
const config = useRuntimeConfig()
const { shortAddress } = useWallet()
const { detected, scanning, rescan } = useWalletDetection()

async function pick(dw: DetectedWallet) {
  const res = await wallet.connectDetected(dw)
  if (res.ok) ui.ok('Wallet terhubung!')
  else ui.err(res.message ?? 'Gagal connect.')
}
</script>

<template>
  <div class="max-w-xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-black text-white">Wallet</h1>

    <div v-if="wallet.address" class="panel rounded-xl p-5 mt-6">
      <div class="flex items-center justify-between">
        <div class="text-[10px] text-sub font-black uppercase">Terhubung via {{ wallet.providerLabel ?? 'wallet' }}</div>
        <WalletAvatar v-if="wallet.providerLabel" :label="wallet.providerLabel" :color="detected.find(d => d.label === wallet.providerLabel)?.color ?? '#AB9FF2'" :size="22" />
      </div>
      <div class="num text-white font-bold mt-1" style="background: none;">{{ shortAddress }}</div>
      <div class="num text-gold font-bold text-lg mt-3">{{ wallet.paperBalance.toLocaleString('id-ID') }} $PAPER</div>
      <div class="flex gap-2 mt-4">
        <FaucetButton />
        <button class="px-4 py-2 rounded-lg bg-panel2 border border-borderp text-sub text-[11px] font-bold uppercase hover:text-short" @click="wallet.disconnect()">
          Disconnect
        </button>
      </div>
    </div>

    <div v-else class="mt-6 flex flex-col gap-2.5">
      <p class="text-sub text-sm mb-1">Wallet Solana yang terdeteksi di browser lu:</p>
      <button
        v-for="dw in detected"
        :key="dw.id"
        class="flex items-center gap-3 px-4 py-3.5 bg-panel2 rounded-xl font-bold text-sm text-textp border border-transparent hover:border-accent hover:bg-[#22282e] transition-all"
        @click="pick(dw)"
      >
        <WalletAvatar :label="dw.label" :color="dw.color" :size="30" />
        <span class="flex-1 text-left">{{ dw.label }}</span>
        <span class="text-[10px] text-sub">Connect</span>
      </button>

      <div v-if="!detected.length" class="bg-panel2 rounded-xl p-6 text-center text-xs text-sub space-y-2">
        <UiIcon name="wallet" :size="24" class="text-sub" />
        <p v-if="scanning">Nyaring wallet yang terpasang...</p>
        <p v-else>
          Tidak ada wallet terdeteksi.
          <br>Install extension Solana (Phantom, Solflare, Backpack, dll) dulu, lalu refresh halaman ini.
        </p>
      </div>

      <button class="text-center text-[11px] text-sub hover:text-textp mt-1" @click="rescan()">Scan ulang</button>
    </div>

    <p class="text-[10px] text-sub mt-6">
      Mint $PAPER: <span class="num">{{ config.public.paperMint }}</span>
    </p>
  </div>
</template>
