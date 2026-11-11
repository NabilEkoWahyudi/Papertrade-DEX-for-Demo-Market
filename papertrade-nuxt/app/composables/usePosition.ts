import { useMarketStore } from '~/stores/market'
import { usePositionStore } from '~/stores/position'
import { useWalletStore } from '~/stores/wallet'
import { computeLiqPrice, type Side, type Currency } from '~/types/position'
import { isPair } from '~/types/market'
import { computed } from 'vue'

/**
 * Hitung estimasi position size & harga likuidasi sebelum submit.
 * Likuidasi versi sederhana: LONG entry - entry/lev, SHORT entry + entry/lev.
 */
export function usePosition() {
  const market = useMarketStore()
  const pos = usePositionStore()
  const wallet = useWalletStore()

  const estimate = (side: Side, collateralUsd: number, lev: number) => {
    const entry = market.markPrice
    if (!entry || !Number.isFinite(collateralUsd) || collateralUsd <= 0) {
      return { entry, size: 0, liq: null }
    }
    return {
      entry,
      size: (collateralUsd * lev) / entry,
      liq: computeLiqPrice(side, entry, lev)
    }
  }

  /** Modal dlm SOL dikonversi ke USD pakai harga SOLUSDT. */
  const toUsd = (amount: number, curr: Currency): number =>
    curr === 'SOL' ? amount * (market.solPrice || 0) : amount

  async function openPosition(
    side: Side,
    rawCol: number,
    curr: Currency,
    lev: number,
    tp: number | null,
    sl: number | null
  ): Promise<{ ok: boolean; message?: string }> {
    const entry = market.markPrice
    if (!wallet.address) return { ok: false, message: 'Connect wallet dulu Boss!' }
    if (!isPair(market.symbol)) return { ok: false, message: 'Pair tidak valid.' }
    if (entry <= 0) return { ok: false, message: 'Harga belum live, tunggu data market.' }
    if (!Number.isFinite(rawCol) || rawCol <= 0) return { ok: false, message: 'Modal tidak valid!' }

    const collateralUsd = toUsd(rawCol, curr)
    if (!Number.isFinite(collateralUsd) || collateralUsd <= 0) {
      return { ok: false, message: 'Harga SOL belum tersedia untuk konversi modal.' }
    }

    await pos.open({ side, symbol: market.symbol, entry, lev, collateralUsd, rawCol, curr, tp, sl })
    return { ok: true }
  }

  return {
    estimate, toUsd, openPosition,
    activePosition: computed(() => pos.activePosition),
    closePosition: (reason: 'MANUAL' | 'TP HIT!' | 'SL HIT!' | 'LIQ!') => pos.close(reason)
  }
}
