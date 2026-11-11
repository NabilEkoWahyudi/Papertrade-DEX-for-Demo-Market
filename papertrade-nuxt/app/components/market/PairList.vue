<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { PAIRS, fmtPrice, fmtVolume } from '~/types/market'

const market = useMarketStore()
const config = useRuntimeConfig()
const REST_URL = config.public.binanceRest
const loading = ref(true)

const tabs = ref<'Semua' | 'Cross' | 'Isolated'>('Semua')
const sortMode = ref<'volume' | 'price' | 'change'>('volume')

async function refresh() {
  if (import.meta.server) return
  try {
    const symbols = PAIRS.map(p => p.symbol)
    const q = encodeURIComponent(JSON.stringify(symbols))
    const data = await $fetch<Array<{ symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }>>(
      `${REST_URL}/ticker/24hr?symbols=${q}`
    )
    const next: Record<string, { price: number; change: number; volume: number }> = {}
    for (const d of data ?? []) {
      next[d.symbol] = {
        price: parseFloat(d.lastPrice),
        change: parseFloat(d.priceChangePercent),
        volume: parseFloat(d.quoteVolume)
      }
    }
    market.pairStats = next
    loading.value = false
  } catch {
    loading.value = false
  }
}

if (import.meta.client) {
  onMounted(() => {
    void refresh()
    const { pause } = useIntervalFn(refresh, 10_000)
    onUnmounted(() => pause())
  })
}

const rows = computed(() => {
  const arr = PAIRS.map(p => ({
    ...p,
    ...(market.pairStats[p.symbol] ?? { price: 0, change: 0, volume: 0 })
  }))
  if (sortMode.value === 'price') arr.sort((a, b) => b.price - a.price)
  else if (sortMode.value === 'change') arr.sort((a, b) => b.change - a.change)
  else arr.sort((a, b) => b.volume - a.volume)
  return arr
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="panel-header">
      <span>PAIR LIST</span>
      <div class="flex gap-1">
        <button v-for="t in (['Semua','Cross','Isolated'] as const)" :key="t" class="px-1.5 rounded" :class="tabs === t ? 'text-accent' : ''" @click="tabs = t">{{ t }}</button>
      </div>
    </div>

    <div class="px-1 py-1 flex gap-1 border-b border-borderp text-[10px]">
      <button v-for="m in ([['volume', 'Volume'], ['price', 'Harga'], ['change', '24h%']] as const)" :key="m[0]" class="px-2 py-1 rounded" :class="sortMode === m[0] ? 'bg-accent/15 text-accent' : 'text-sub'" @click="sortMode = m[0]">{{ m[1] }}</button>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
    <button
      v-for="p in rows"
      :key="p.symbol"
      class="w-full grid grid-cols-[1.4fr_1fr_1fr] items-center px-3 py-2 text-left hover:bg-panel2 transition-colors"
      :class="market.symbol === p.symbol ? 'bg-panel2' : ''"
      @click="market.setSymbol(p.symbol)"
    >
      <span class="flex items-center gap-1.5 text-[11px] font-bold">
        <CoinIcon :symbol="p.base" :size="15" />
        {{ p.base }}<span class="text-sub font-normal">/USDT</span>
      </span>
      <span class="num text-[11px] text-textp text-right">{{ fmtPrice(p.price) }}</span>
      <span class="num text-[11px] text-right" :class="p.change >= 0 ? 'text-long' : 'text-short'">
        {{ p.change >= 0 ? '+' : '' }}{{ p.change.toFixed(2) }}%<br>
        <span class="text-sub">${{ fmtVolume(p.volume) }}</span>
      </span>
    </button>
    <Skeleton v-if="loading" class="m-3 h-20" />
    </div>
  </div>
</template>
