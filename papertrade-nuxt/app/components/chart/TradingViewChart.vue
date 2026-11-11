<script setup lang="ts">
import { TV_SYMBOL } from '~/types/market'

const props = withDefaults(defineProps<{
  symbol: string
  interval?: string
}>(), { interval: '1' })

const loaded = ref(false)

// Widget embed langsung via iframe — tanpa tv.js (hemat ~250KB JS + 1 langkah hydrate).
const src = computed(() => {
  const q = new URLSearchParams({
    symbol: TV_SYMBOL(props.symbol),
    interval: props.interval,
    timezone: 'Asia/Jakarta',
    theme: 'dark',
    style: '1',
    withdateranges: '1',
    hide_side_toolbar: '0',
    symboledit: '0',
    saveimage: '0',
    hideideas: '1',
    locale: 'id'
  })
  return `https://s.tradingview.com/widgetembed/?${q.toString()}`
})

// Ganti pair/timeframe → iframe di-key ulang, overlay loading muncul sampai iframe load.
watch(src, () => { loaded.value = false })
</script>

<template>
  <div class="relative w-full h-full bg-black min-h-[340px]">
    <iframe
      :key="src"
      :src="src"
      class="absolute inset-0 w-full h-full border-0"
      allowtransparency="true"
      frameborder="0"
      title="TradingView Chart"
      @load="loaded = true"
    />
    <div v-if="!loaded" class="absolute inset-0 grid place-items-center text-sub text-xs">
      Memuat chart TradingView...
    </div>
  </div>
</template>
