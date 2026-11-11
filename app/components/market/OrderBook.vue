<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { fmtPrice } from '~/types/market'

const market = useMarketStore()

const rows = computed(() => {
  const asks = market.depth.asks.slice(0, 12).reverse() // tertinggul di atas
  const bids = market.depth.bids.slice(0, 12)
  const maxQty = Math.max(
    ...asks.map(a => parseFloat(a[1])),
    ...bids.map(b => parseFloat(b[1])),
    0.0000001
  )
  const askRows = asks.map(([p, q]) => ({
    price: parseFloat(p),
    qty: parseFloat(q),
    w: Math.min((parseFloat(q) / maxQty) * 100, 100),
    side: 'ask' as const
  }))
  const bidRows = bids.map(([p, q]) => ({
    price: parseFloat(p),
    qty: parseFloat(q),
    w: Math.min((parseFloat(q) / maxQty) * 100, 100),
    side: 'bid' as const
  }))
  return { askRows, bidRows, maxQty }
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="panel-header"><span>ORDER BOOK</span><span>Depth 20 @100ms</span></div>
    <div class="px-1 pb-1 flex flex-col text-[10px] text-sub border-b border-borderp">
      <div class="flex px-2 py-1"><span class="w-1/3">PRICE (USDT)</span><span class="w-1/3 text-right">SIZE</span><span class="w-1/3 text-right">TOTAL</span></div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <div v-for="(r,i) in rows.askRows" :key="'a'+i" class="relative flex px-2 py-[2px] num text-[11px] leading-4">
        <div class="absolute right-0 top-0 bottom-0 bg-short/10" :style="{ width: r.w + '%' }" />
        <span class="w-1/3 text-short relative z-10">{{ fmtPrice(r.price) }}</span>
        <span class="w-1/3 text-right text-textp relative z-10">{{ r.qty.toFixed(3) }}</span>
        <span class="w-1/3 text-right text-sub relative z-10">{{ (r.qty * r.price).toFixed(0) }}</span>
      </div>
    </div>

    <div class="py-2 px-2 bg-panel2 border-y border-borderp flex items-center justify-center">
      <span class="num font-black text-base" :class="market.priceUp ? 'text-long' : 'text-short'">
        {{ fmtPrice(market.markPrice) }}
      </span>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <div v-for="(r,i) in rows.bidRows" :key="'b'+i" class="relative flex px-2 py-[2px] num text-[11px] leading-4">
        <div class="absolute right-0 top-0 bottom-0 bg-long/10" :style="{ width: r.w + '%' }" />
        <span class="w-1/3 text-long relative z-10">{{ fmtPrice(r.price) }}</span>
        <span class="w-1/3 text-right text-textp relative z-10">{{ r.qty.toFixed(3) }}</span>
        <span class="w-1/3 text-right text-sub relative z-10">{{ (r.qty * r.price).toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>
