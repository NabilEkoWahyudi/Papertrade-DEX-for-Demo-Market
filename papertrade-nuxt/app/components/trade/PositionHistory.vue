<script setup lang="ts">
import { usePositionStore } from '~/stores/position'
import { useUiStore } from '~/stores/ui'
import { fmtPrice } from '~/types/market'
import type { ClosedPosition } from '~/types/position'

const pos = usePositionStore()
const ui = useUiStore()

/** Share trade dari riwayat → PnL Card biar bisa di-export jadi gambar. */
function share(h: ClosedPosition) {
  pos.shareFromHistory(h)
  ui.ok('Trade masuk PnL Card — export di panel PNL CARD.')
}
</script>

<template>
  <div>
    <div class="panel-header"><span>RIWAYAT POSISI</span><span>{{ pos.history.length }} trade</span></div>
    <div class="overflow-y-auto max-h-52">
    <template v-if="pos.history.length">
      <div v-for="h in pos.history.slice(0, 20)" :key="h.id + '-' + h.closedAt" class="px-3 py-2 border-b border-borderp/60 text-[10px]">
        <div class="flex justify-between items-center gap-2">
          <span class="font-bold min-w-0 truncate" :class="h.side === 'LONG' ? 'text-long' : 'text-short'">
            {{ h.symbol }} {{ h.side }} {{ h.lev }}x
          </span>
          <span class="flex items-center gap-2 shrink-0">
            <span class="num font-bold" :class="h.pnl >= 0 ? 'text-long' : 'text-short'">
              {{ h.pnl >= 0 ? '+' : '-' }}${{ Math.abs(h.pnl).toFixed(2) }}
            </span>
            <button
              class="text-sub hover:text-gold transition-colors cursor-pointer"
              title="Share PnL trade ini ke PnL Card"
              @click="share(h)"
            >
              <UiIcon name="camera" :size="12" />
            </button>
          </span>
        </div>
        <div class="flex justify-between text-sub mt-0.5 num">
          <span class="flex items-center gap-1">
            {{ fmtPrice(h.entry) }} <UiIcon name="arrow-right" :size="10" class="shrink-0" /> {{ fmtPrice(h.exit) }} · ROE {{ (h.roe >= 0 ? '+' : '') + h.roe.toFixed(2) }}%
          </span>
          <span>
            {{ h.reason }} ·
            {{ new Date(h.closedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
            <span v-if="h.rewardTx" class="text-gold inline-flex align-middle"><UiIcon name="gift" :size="10" /></span>
          </span>
        </div>
      </div>
    </template>
    <p v-else class="text-[11px] text-sub text-center py-4">Belum ada trade terealisasi. Gaspol, Boss.</p>
    </div>
  </div>
</template>
