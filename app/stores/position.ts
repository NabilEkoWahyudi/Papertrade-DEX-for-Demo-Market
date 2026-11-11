import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ActivePosition, ClosedPosition, OpenPositionInput, CloseReason
} from '~/types/position'
import {
  computeLiqPrice, computePnl, computeRoe
} from '~/types/position'
import { PAIRS } from '~/types/market'
import { useMarketStore } from './market'
import { useWalletStore } from './wallet'

export interface SettlementResult {
  win: boolean
  pnl: number
  rewardTx?: string
  rewardError?: string
  alreadyClosed?: boolean
}

export const usePositionStore = defineStore('position', () => {
  const market = useMarketStore()
  const wallet = useWalletStore()

  // --- State ---
  const activePosition = ref<ActivePosition | null>(null)
  const history = ref<ClosedPosition[]>([])
  // Trade yang "di-share" ke PnL Card (dari riwayat / trade yang baru ditutup).
  const shareTrade = ref<ClosedPosition | null>(null)

  // --- Getters ---
  const mark = computed(() => market.markPrice || activePosition.value?.entry || 0)
  const pnl = computed(() => {
    const p = activePosition.value
    if (!p) return 0
    return computePnl(p.side, p.entry, mark.value || p.entry, p.size)
  })
  const roe = computed(() => computeRoe(pnl.value, activePosition.value?.collateralUsd ?? 0))

  // --- Actions ---
  async function open(input: OpenPositionInput): Promise<ActivePosition> {
    const gen = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)

    const position: ActivePosition = {
      id: gen,
      serverId: null,
      symbol: input.symbol,
      side: input.side,
      entry: input.entry,
      lev: input.lev,
      collateralUsd: input.collateralUsd,
      size: input.collateralUsd > 0 && input.entry > 0
        ? (input.collateralUsd * input.lev) / input.entry
        : 0,
      liq: computeLiqPrice(input.side, input.entry, input.lev),
      tp: input.tp,
      sl: input.sl,
      rawCol: input.rawCol,
      curr: input.curr,
      openedAt: Date.now()
    }
    activePosition.value = position
    shareTrade.value = null // posisi baru → PnL Card fokus ke posisi live

    // Validasi di server: harga entry diambil SERVER dari Binance (bukan diklaim klien).
    const base = PAIRS.find(p => p.symbol === input.symbol)?.base ?? input.symbol
    if (wallet.address) {
      try {
        const res = await $fetch<{ id: string; entryPrice: number }>('/api/positions/open', {
          method: 'POST',
          body: {
            wallet: wallet.address,
            symbol: input.symbol,
            side: input.side,
            leverage: input.lev,
            collateralUsd: input.collateralUsd,
            pairBase: base
          }
        })
        if (res?.id && activePosition.value?.id === position.id) {
          activePosition.value.serverId = res.id
          if (res.entryPrice > 0) {
            activePosition.value.entry = res.entryPrice
            activePosition.value.size = (activePosition.value.collateralUsd * activePosition.value.lev) / res.entryPrice
            activePosition.value.liq = computeLiqPrice(activePosition.value.side, res.entryPrice, activePosition.value.lev)
          }
        }
      } catch {
        // Server offline → tetap jalankan simulasi lokal (tanpa reward).
      }
    }
    return activePosition.value!
  }

  async function close(reason: CloseReason): Promise<SettlementResult | null> {
    const p = activePosition.value
    if (!p) return null
    const exit = mark.value || p.entry
    const profit = computePnl(p.side, p.entry, exit, p.size)
    const win = profit > 0
    const closed: ClosedPosition = {
      id: p.id,
      symbol: p.symbol,
      side: p.side,
      entry: p.entry,
      exit,
      lev: p.lev,
      collateralUsd: p.collateralUsd,
      size: p.size,
      pnl: profit,
      roe: computeRoe(profit, p.collateralUsd),
      tp: p.tp,
      sl: p.sl,
      rawCol: p.rawCol,
      curr: p.curr,
      openedAt: p.openedAt,
      closedAt: Date.now(),
      reason,
      win
    }
    history.value.unshift(closed)
    activePosition.value = null
    // Trade selesai → otomatis masuk PnL Card, jadi bisa langsung di-share.
    shareTrade.value = closed

    // Settle di server (validasi + leaderboard + reward $PAPER).
    if (p.serverId && wallet.address) {
      try {
        const res = await $fetch<{ win: boolean; rewardTx?: string; rewardError?: string; pnl: number; alreadyClosed?: boolean }>('/api/positions/claim', {
          method: 'POST',
          body: { positionId: p.serverId, wallet: wallet.address }
        })
        closed.win = res.win
        if (res.rewardTx) closed.rewardTx = res.rewardTx
        return { win: res.win, pnl: res.pnl, rewardTx: res.rewardTx, rewardError: res.rewardError, alreadyClosed: res.alreadyClosed }
      } catch {
        return { win, pnl: profit }
      }
    }
    return { win, pnl: profit }
  }

  /** Dijalankan setiap tick harga. Auto-exit TP/SL + likuidasi sederhana. */
  function checkMark(price: number): CloseReason | null {
    const p = activePosition.value
    if (!p || !price || price <= 0) return null
    if (p.side === 'LONG') {
      if (p.sl && price <= p.sl) return 'SL HIT!'
      if (p.tp && price >= p.tp) return 'TP HIT!'
      if (p.liq && price <= p.liq) return 'LIQ!'
    } else {
      if (p.sl && price >= p.sl) return 'SL HIT!'
      if (p.tp && price <= p.tp) return 'TP HIT!'
      if (p.liq && price >= p.liq) return 'LIQ!'
    }
    return null
  }

  /** Masukkan trade dari riwayat ke PnL Card buat di-share. */
  function shareFromHistory(h: ClosedPosition) {
    shareTrade.value = h
  }

  function reset() {
    activePosition.value = null
    history.value = []
    shareTrade.value = null
  }

  return {
    activePosition, history, shareTrade, mark, pnl, roe,
    open, close, checkMark, shareFromHistory, reset
  }
}, {
  persist: { pick: ['activePosition', 'history'] }
})
