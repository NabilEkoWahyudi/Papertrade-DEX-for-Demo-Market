<script setup lang="ts">
import { usePosition } from '~/composables/usePosition'
import { useMarketStore } from '~/stores/market'
import { useUiStore } from '~/stores/ui'
import { fmtPrice } from '~/types/market'
import type { Side } from '~/types/position'

const market = useMarketStore()
const ui = useUiStore()
const { estimate, toUsd, openPosition } = usePosition()

const side = ref<Side>('LONG')
const lev = ref(20)

const collateral = useDecimalInput('100')
const currency = ref('USDT')
const tp = useDecimalInput('')
const sl = useDecimalInput('')

const collNum = computed(() => collateral.num)
const est = computed(() => estimate(side.value, toUsd(collNum.value, currency.value as 'USDT'), lev.value))

const sizeText = computed(() =>
  Number.isFinite(est.value.size) && est.value.size > 0 ? `${est.value.size.toFixed(4)} ${market.symbol.replace('USDT', '')}` : '--'
)
const liqText = computed(() => (est.value.liq ? fmtPrice(est.value.liq) : '--'))
const usdText = computed(() => {
  const usd = toUsd(collNum.value, currency.value as 'USDT')
  return Number.isFinite(usd) && collNum.value > 0 ? `$${usd.toFixed(2)}` : '--'
})

async function submit(s: Side) {
  const res = await openPosition(
    s,
    collNum.value,
    currency.value as 'USDT',
    lev.value,
    Number.isFinite(tp.num) ? tp.num : null,
    Number.isFinite(sl.num) ? sl.num : null
  )
  if (res.ok) ui.ok(`Posisi ${s} dibuka! Entry $${fmtPrice(market.markPrice)}`)
  else ui.err(res.message ?? 'Gagal buka posisi.')
}
</script>

<template>
  <div>
    <div class="panel-header"><span>FORM POSISI</span><span class="text-gold">PARATRADER</span></div>
    <div class="p-3 flex flex-col gap-3">
    <Tabs :options="['LONG', 'SHORT']" :model-value="side" @update:model-value="(v?: string) => (side = (v ?? 'LONG') as Side)" />

    <LeverageSlider v-model="lev" :side="side" />

    <div class="flex gap-2">
      <input
        v-model="collateral.value"
        type="text"
        inputmode="decimal"
        placeholder="Modal (0,05 aman)"
        class="field flex-1"
      >
      <select v-model="currency" class="field w-24">
        <option value="USDT">USDT</option>
        <option value="USDC">USDC</option>
        <option value="SOL">SOL</option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div>
        <div class="text-[9px] font-black text-long mb-1 uppercase">Take Profit</div>
        <input v-model="tp.value" type="text" inputmode="decimal" placeholder="Target" class="field">
      </div>
      <div>
        <div class="text-[9px] font-black text-short mb-1 uppercase">Stop Loss</div>
        <input v-model="sl.value" type="text" inputmode="decimal" placeholder="Invalid" class="field">
      </div>
    </div>

    <div class="bg-bg border border-borderp rounded-lg p-2.5 grid grid-cols-2 gap-2 text-[10px]">
      <div>
        <span class="text-sub block uppercase font-bold">Size</span>
        <strong class="num text-textp text-xs">{{ sizeText }}</strong>
      </div>
      <div>
        <span class="text-sub block uppercase font-bold">Liq Price</span>
        <strong class="num text-textp text-xs">{{ liqText }}</strong>
      </div>
      <div>
        <span class="text-sub block uppercase font-bold">Modal (USD)</span>
        <strong class="num text-textp text-xs">{{ usdText }}</strong>
      </div>
      <div>
        <span class="text-sub block uppercase font-bold">Mark</span>
        <strong class="num text-textp text-xs">{{ fmtPrice(market.markPrice) }}</strong>
      </div>
    </div>

    <div class="flex gap-2">
      <button class="flex-1 py-3.5 rounded-lg font-black text-sm uppercase tracking-wide bg-long text-black hover:brightness-110 transition" @click="submit('LONG')">
        LONG
      </button>
      <button class="flex-1 py-3.5 rounded-lg font-black text-sm uppercase tracking-wide bg-short text-white hover:brightness-110 transition" @click="submit('SHORT')">
        SHORT
      </button>
    </div>

    <p class="text-[9px] text-sub leading-relaxed">Modal berformat SOL dikonversi pakai harga SOLUSDT live. Entry dicatat di server dgn harga Binance saat dibuka (anti-cheat).</p>
    </div>
  </div>
</template>
