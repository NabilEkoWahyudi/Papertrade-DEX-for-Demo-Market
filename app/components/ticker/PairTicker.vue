<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { PAIRS, fmtPrice, fmtVolume } from '~/types/market'
import { computed } from 'vue'

const market = useMarketStore()
const meta = computed(() => PAIRS.find(p => p.symbol === market.symbol))
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-borderp bg-bg px-3 py-2">
    <div class="flex items-center gap-2">
      <CoinIcon :symbol="meta?.base" :size="20" />
      <span class="font-bold text-sm text-white">{{ meta?.base }}<span class="text-sub font-normal">/USDT</span></span>
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-panel2 text-sub border border-borderp">PERP</span>
    </div>

    <span class="num font-bold text-lg" :class="market.priceUp ? 'text-long' : 'text-short'">
      {{ fmtPrice(market.markPrice) }}
    </span>

    <div class="flex gap-x-5 text-[11px]">
      <div class="leading-tight">
        <div class="text-sub">24h Change</div>
        <div class="num font-bold" :class="market.ticker.changePct >= 0 ? 'text-long' : 'text-short'">
          {{ market.ticker.changePct >= 0 ? '+' : '' }}{{ market.ticker.changePct.toFixed(2) }}%
        </div>
      </div>
      <div class="leading-tight">
        <div class="text-sub">24h High</div>
        <div class="num text-textp">{{ fmtPrice(market.ticker.high) }}</div>
      </div>
      <div class="leading-tight">
        <div class="text-sub">24h Low</div>
        <div class="num text-textp">{{ fmtPrice(market.ticker.low) }}</div>
      </div>
      <div class="leading-tight">
        <div class="text-sub">24h Volume</div>
        <div class="num text-textp">${{ fmtVolume(market.ticker.quoteVolume) }}</div>
      </div>
    </div>
  </div>
</template>
