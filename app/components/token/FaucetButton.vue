<script setup lang="ts">
import { useFaucet } from '~/composables/useFaucet'
import { useUiStore } from '~/stores/ui'

const { ready, countdown, claim, refreshBalance } = useFaucet()
const ui = useUiStore()
const loading = ref(false)

async function doClaim() {
  loading.value = true
  const res = await claim()
  loading.value = false
  if (res.success) {
    ui.ok('1.000 $PAPER kekirim! Habis itu balik besok ya, Boss.')
    void refreshBalance()
  } else {
    ui.err(res.message ?? 'Faucet lagi error.')
  }
}
</script>

<template>
  <button
    class="px-3 py-2 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all border"
    :class="ready && !loading ? 'bg-gold text-black border-transparent hover:brightness-110 cursor-pointer' : 'bg-panel2 text-sub border-borderp cursor-not-allowed'"
    :disabled="!ready || loading"
    @click="doClaim"
  >
    {{ loading ? 'Mengirim...' : countdown ? `${countdown}` : 'Claim 1K $PAPER' }}
  </button>
</template>
