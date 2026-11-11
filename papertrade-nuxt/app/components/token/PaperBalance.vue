<script setup lang="ts">
import { useWalletStore } from '~/stores/wallet'

defineProps<{ compact?: boolean }>()

const wallet = useWalletStore()

if (import.meta.client && wallet.address) {
  onMounted(() => void wallet.refreshBalance())
}
</script>

<template>
  <div v-if="wallet.address" class="flex items-center gap-2" :class="compact ? '' : 'bg-panel border border-borderp rounded-lg px-3 py-2'">
    <div class="text-right">
      <div class="text-[8px] text-sub font-black uppercase">Wallet Balance</div>
      <div class="num text-gold font-bold text-[13px]">{{ wallet.paperBalance.toLocaleString('id-ID') }} $PAPER</div>
    </div>
  </div>
</template>
