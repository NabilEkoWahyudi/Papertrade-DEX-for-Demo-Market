<script setup lang="ts">
import { usePositionStore } from '~/stores/position'
import { useMarketStore } from '~/stores/market'
import { useUiStore } from '~/stores/ui'
import { fmtPrice } from '~/types/market'

const pos = usePositionStore()
const market = useMarketStore()
const ui = useUiStore()

const p = computed(() => pos.activePosition)
const pnlClass = computed(() => (pos.pnl >= 0 ? 'text-long' : 'text-short'))
const roeClass = computed(() => (pos.roe >= 0 ? 'text-long' : 'text-short'))

const pnlText = computed(() => (pos.pnl >= 0 ? '+' : '') + '$' + pos.pnl.toFixed(2))
const roeText = computed(() => (pos.roe >= 0 ? '+' : '') + (Number.isFinite(pos.roe) ? pos.roe.toFixed(2) : '0.00') + '%')

async function manualClose() {
  const res = await pos.close('MANUAL')
  if (res?.win) {
    ui.ok(`CUAN! +$${res.pnl.toFixed(2)}${res.rewardTx ? ' — reward $PAPER terkirim' : ''}`)
  } else if (res) {
    ui.info(res.pnl >= 0 ? 'Posisi ditutup.' : `Loss -$${Math.abs(res.pnl).toFixed(2)} — sabar, Boss.`)
  }
}
</script>

<template>
  <div v-if="p" class="panel">
    <div class="panel-header">
      <span class="flex items-center gap-1.5">
        <CoinIcon :symbol="p.symbol" :size="15" />
        <span :class="p.side === 'LONG' ? 'text-long' : 'text-short'">{{ p.side }}</span>
        <span>{{ p.symbol }}</span>
        <span class="text-sub">{{ p.lev }}x</span>
      </span>
      <span class="num font-black" :class="pnlClass">{{ pnlText }}</span>
    </div>

    <div class="p-3 flex flex-col gap-2.5 text-[11px]">
      <div class="flex items-center justify-between">
        <span class="text-sub">ROE</span>
        <span class="num font-black text-base" :class="roeClass">{{ roeText }}</span>
      </div>

      <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 num">
        <div class="flex justify-between"><span class="text-sub">Entry</span><span>{{ fmtPrice(p.entry) }}</span></div>
        <div class="flex justify-between"><span class="text-sub">Mark</span><span>{{ fmtPrice(market.markPrice) }}</span></div>
        <div class="flex justify-between"><span class="text-sub">Liq</span><span class="text-short">{{ p.liq ? fmtPrice(p.liq) : '--' }}</span></div>
        <div class="flex justify-between"><span class="text-sub">Size</span><span>{{ p.size.toFixed(4) }}</span></div>
        <div class="flex justify-between"><span class="text-sub">TP</span><span class="text-long">{{ p.tp ? fmtPrice(p.tp) : '—' }}</span></div>
        <div class="flex justify-between"><span class="text-sub">SL</span><span class="text-short">{{ p.sl ? fmtPrice(p.sl) : '—' }}</span></div>
        <div class="col-span-2 flex justify-between">
          <span class="text-sub">Modal</span>
          <span>{{ p.rawCol }} {{ p.curr }} (≈${{ p.collateralUsd.toFixed(2) }})</span>
        </div>
      </div>

      <button class="w-full py-2.5 rounded-lg bg-panel2 border border-borderp text-sub font-bold text-[11px] uppercase hover:text-textp transition" @click="manualClose">
        Close Position
      </button>
    </div>
  </div>
</template>
