<script setup lang="ts">
import type { DetectedWallet } from '~/composables/useWalletDetection'
import { useWalletStore } from '~/stores/wallet'
import { useUiStore } from '~/stores/ui'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const wallet = useWalletStore()
const ui = useUiStore()
const { detected, scanning, rescan } = useWalletDetection()

// Modal dibuka → cek ulang extension yang terpasang (user bisa install dulu baru buka).
watch(() => props.open, (o) => {
  if (o) rescan()
})

async function pick(dw: DetectedWallet) {
  const res = await wallet.connectDetected(dw)
  if (res.ok) {
    ui.ok('Wallet terhubung! Selamat degen, Boss.')
    emit('close')
  } else {
    ui.err(res.message ?? 'Gagal connect.')
  }
}
</script>

<template>
  <Modal :open="props.open" @close="emit('close')">
    <div class="text-center mb-5">
      <div class="text-base font-black text-white">CONNECT WALLET</div>
      <div class="text-[11px] text-sub mt-1">Deteksi otomatis wallet Solana di browser lu</div>
    </div>

    <div v-if="detected.length" class="flex flex-col gap-2.5">
      <button
        v-for="dw in detected"
        :key="dw.id"
        class="flex items-center gap-3 px-4 py-3.5 bg-panel2 rounded-xl font-bold text-sm text-textp border border-transparent transition-all hover:border-accent hover:bg-[#22282e]"
        @click="pick(dw)"
      >
        <WalletAvatar :label="dw.label" :color="dw.color" :size="30" />
        <span class="flex-1 text-left">{{ dw.label }}</span>
        <span class="chip-ok text-[10px] font-semibold px-2 py-0.5 rounded">Terpasang</span>
      </button>
    </div>

    <div v-else class="bg-panel2 rounded-xl p-6 text-center text-xs text-sub space-y-2">
      <UiIcon name="wallet" :size="24" class="text-sub" />
      <p v-if="scanning">Nyaring wallet yang terpasang...</p>
      <p v-else>
        Tidak ada wallet terdeteksi.
        <br>Install extension Solana (Phantom, Solflare, Backpack, dll) dulu, lalu refresh halaman ini.
      </p>
    </div>

    <button class="mt-4 w-full text-center text-xs text-sub hover:text-textp" @click="emit('close')">Cancel</button>
  </Modal>
</template>
