<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { useDecimalInput } from '~/composables/useDecimalInput'
import { PAIRS, fmtPrice } from '~/types/market'

const market = useMarketStore()
const asset = ref('BTCUSDT')

const assetInput = useDecimalInput('1')
const usdInput = useDecimalInput('')

const price = computed(() => market.pairStats[asset.value]?.price || 0)

const toUsd = computed<string>({
  get: () => {
    if (!Number.isFinite(assetInput.num) || !price.value) return usdInput.value || ''
    return (assetInput.num * price.value).toPrecision(8)
  },
  set: (v) => { usdInput.value = v }
})

const toAsset = computed<string>({
  get: () => {
    if (!Number.isFinite(usdInput.num) || !price.value) return assetInput.value || ''
    return (usdInput.num / price.value).toPrecision(8)
  },
  set: (v) => { assetInput.value = v }
})
</script>

<template>
  <div>
    <div class="panel-header"><span>CONVERTER</span><span class="num">{{ price ? fmtPrice(price) : '--' }}</span></div>
    <div class="p-3 flex flex-col gap-2">
    <div class="flex gap-2">
      <select v-model="asset" class="field w-28">
        <option v-for="p in PAIRS" :key="p.symbol" :value="p.symbol">{{ p.base }}/USDT</option>
      </select>
      <input v-model="assetInput.value" type="text" inputmode="decimal" placeholder="Jumlah koin" class="field flex-1">
    </div>
    <div class="text-center text-sub text-[10px] flex items-center justify-center"><UiIcon name="swap" :size="14" /></div>
    <input v-model="toAsset" type="text" inputmode="decimal" placeholder="Nilai USD" class="field" hidden>
    <input v-model="usdInput.value" type="text" inputmode="decimal" placeholder="Nilai USD" class="field">
    <p class="text-[10px] text-sub">Ketik di salah satu field, satunya otomatis — harga live Binance.</p>
    </div>
  </div>
</template>
