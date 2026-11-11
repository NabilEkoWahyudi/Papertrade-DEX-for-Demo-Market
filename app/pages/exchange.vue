<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { usePositionStore } from '~/stores/position'
import { useUiStore } from '~/stores/ui'
import { useBinanceStream } from '~/composables/useBinanceStream'
import { beep } from '~/utils/beep'
import { fmtPrice } from '~/types/market'
import type { TradeAlertType } from '~/stores/ui'

useSeoMeta({
  title: 'Exchange',
  description: 'Terminal Perps PaperTrade — Long/Short dgn leverage sampai 100x, harga live Binance, token $PAPER.'
})

const market = useMarketStore()
const pos = usePositionStore()
const ui = useUiStore()
const config = useRuntimeConfig()
const mobileTab = computed({
  get: () => ui.mobileTab,
  set: (v) => { ui.mobileTab = v }
})

// --- Market data (client-only; socket juga) ---
if (import.meta.client) {
  onMounted(() => {
    useBinanceStream()
    refreshSolPrice()
    const { pause } = useIntervalFn(refreshSolPrice, 30_000)
    onUnmounted(() => pause())
  })
}

async function refreshSolPrice() {
  try {
    const res = await $fetch<{ price: string }>(`${config.public.binanceRest}/ticker/price`, { query: { symbol: 'SOLUSDT' } })
    const v = parseFloat(res.price)
    if (Number.isFinite(v) && v > 0) market.solPrice = v
  } catch {
    // Fallback harga SOL tipap terakhir
  }
}

// --- Auto-exit TP/SL/likuidasi per tick + ALERT besar (tengah-atas + bunyi) ---
watch(() => market.markPrice, async (price) => {
  const reason = pos.checkMark(price)
  if (!reason) return
  const sym = pos.activePosition?.symbol ?? market.symbol
  const res = await pos.close(reason)
  const type: TradeAlertType = reason === 'TP HIT!' ? 'tp' : reason === 'SL HIT!' ? 'sl' : 'liq'
  beep(type)
  const pnlTxt = res ? `${res.pnl >= 0 ? '+' : '-'}$${Math.abs(res.pnl).toFixed(2)}` : ''

  if (type === 'tp') {
    const detail = `${sym} ditutup otomatis di ${fmtPrice(price)} — PnL ${pnlTxt}${res?.rewardTx ? ' + reward $PAPER terkirim' : ''}`
    ui.fireTradeAlert({ type, title: 'TAKE PROFIT HIT!', detail })
    ui.ok(`TP HIT! PnL ${pnlTxt}${res?.rewardTx ? ' — reward $PAPER terkirim' : ''}`)
  } else if (type === 'sl') {
    const detail = `${sym} kena SL di ${fmtPrice(price)} — PnL ${pnlTxt}`
    ui.fireTradeAlert({ type, title: 'STOP LOSS HIT!', detail })
    ui.info(`SUT! Posisi kena SL. PnL ${pnlTxt}`)
  } else {
    ui.fireTradeAlert({ type, title: 'LIQUIDATED!', detail: `${sym} dilikuidasi di ${fmtPrice(price)} — margin hangus.` })
    ui.err('BUSTED! Posisi dilikuidasi.')
  }
})
</script>

<template>
  <div class="flex flex-col" style="height: calc(100vh - 56px); margin-top: 0;">
    <MarketBar />

    <!-- ===== DESKTOP ≥1280: 3 kolom ===== -->
    <div class="hidden lg:grid flex-1 min-h-0 grid-cols-[300px_1fr_290px] overflow-hidden">
      <!-- KIRI: pair list, form, posisi, AI -->
      <div class="flex flex-col border-r border-borderp overflow-y-auto">
        <PairList class="panel border-r-0" />
        <PositionForm class="mt-2 panel" />
        <PositionCard v-if="pos.activePosition" class="mt-2" />
        <PositionHistory class="mt-2 panel" />
        <div class="p-3 mt-auto">
          <ParatraderChat />
        </div>
      </div>

      <!-- TENGAH -->
      <div class="flex flex-col min-w-0 overflow-y-auto">
        <PairTicker />
        <div class="flex items-start justify-between gap-3 px-3 py-2 border-b border-borderp">
          <TimeframeTabs v-model="market.timeframe" class="mt-1" />
          <PaperBalance compact />
        </div>
        <div class="relative bg-black" style="min-height: 380px; height: 52vh;">
          <TradingViewChart :symbol="market.symbol" :interval="market.timeframe" />
        </div>
        <div class="panel flex-1 min-h-[180px]">
          <LatestTrades />
        </div>
        <div class="panel mt-2 mb-2">
          <Leaderboard />
        </div>
      </div>

      <!-- KANAN: saldo/faucet, order book, converter, poll, pnl export -->
      <div class="flex flex-col border-l border-borderp overflow-y-auto">
        <div class="panel flex items-center justify-between gap-2 px-3 py-2 border-r-0">
          <PaperBalance />
          <FaucetButton />
        </div>
        <OrderBook class="flex-1 min-h-[260px]" />
        <CurrencyConverter />
        <SentimentPoll />
        <PnlCard />
      </div>
    </div>

    <!-- ===== TABLET 768–1279: 2 kolom ===== -->
    <div class="hidden lg:hidden md:grid flex-1 min-h-0 grid-cols-2 overflow-y-auto">
      <div class="border-r border-borderp">
        <PairTicker />
        <div class="relative bg-black" style="height: 320px;">
          <TradingViewChart :symbol="market.symbol" :interval="market.timeframe" />
        </div>
        <div class="border-t border-borderp" style="height: 260px;">
          <OrderBook />
        </div>
      </div>
      <div class="flex flex-col gap-2 p-2">
        <div class="flex items-center justify-between gap-2">
          <PaperBalance /> <FaucetButton />
        </div>
        <PositionForm class="panel" />
        <PositionCard v-if="pos.activePosition" />
        <PositionHistory class="panel" />
        <ParatraderChat />
        <PairList class="panel" />
      </div>
    </div>

    <!-- ===== MOBILE <768: tab tunggal ===== -->
    <div class="lg:hidden md:hidden flex flex-col flex-1 min-h-0">
      <div class="m-2">
        <Tabs
          :options="['CHART', 'OB', 'TRADE', 'AI', 'LB']"
          :model-value="mobileTab"
          @update:model-value="(v?: string) => (mobileTab = ((v ?? 'CHART') as 'CHART' | 'OB' | 'TRADE' | 'AI' | 'LB'))"
        />
      </div>

      <div v-show="mobileTab === 'CHART'" class="flex-1 min-h-0 overflow-y-auto">
        <PairTicker />
        <div class="bg-black" style="height: 340px;">
          <TradingViewChart :symbol="market.symbol" :interval="market.timeframe" />
        </div>
        <div class="panel" style="height: 200px;"><LatestTrades /></div>
      </div>

      <div v-show="mobileTab === 'OB'" class="flex-1 min-h-0 overflow-y-auto">
        <div class="m-2 flex items-center justify-between gap-2"><PaperBalance /> <FaucetButton /></div>
        <div class="panel mx-2" style="height: 480px;"><OrderBook /></div>
        <CurrencyConverter class="mx-2 mt-2" />
      </div>

      <div v-show="mobileTab === 'TRADE'" class="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        <PositionForm class="panel" />
        <PositionCard v-if="pos.activePosition" />
        <PositionHistory class="panel" />
        <PnlCard />
      </div>

      <div v-show="mobileTab === 'AI'" class="flex-1 min-h-0 p-2 overflow-y-auto">
        <ParatraderChat />
      </div>

      <div v-show="mobileTab === 'LB'" class="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        <Leaderboard class="panel" />
        <SentimentPoll class="panel" />
        <PairList class="panel" />
      </div>
    </div>
  </div>
</template>

