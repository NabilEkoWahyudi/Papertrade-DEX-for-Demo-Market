<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { PAIRS } from '~/types/market'

const market = useMarketStore()
const search = ref('')
const list = computed(() =>
  PAIRS.filter(p => !search.value || p.symbol.toLowerCase().includes(search.value.toLowerCase()))
)

function pick(s: string) {
  market.setSymbol(s)
}
</script>

<template>
  <div class="flex items-center gap-2 border-b border-borderp bg-panel px-3 py-2 overflow-x-auto no-scrollbar">
    <input
      v-model="search"
      type="text"
      placeholder="Search pair..."
      class="w-40 md:w-56 bg-bg border border-borderp rounded-md px-3 py-1.5 text-xs text-white"
    />
    <button
      v-for="p in list"
      :key="p.symbol"
      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold shrink-0 transition-colors"
      :class="market.symbol === p.symbol ? 'bg-accent/15 text-accent border border-accent/40' : 'text-sub hover:text-textp border border-transparent'"
      @click="pick(p.symbol)"
    >
      <CoinIcon :symbol="p.base" :size="16" />
      {{ p.base }}<span class="text-[9px] font-normal opacity-70">/USDT</span>
    </button>
  </div>
</template>
