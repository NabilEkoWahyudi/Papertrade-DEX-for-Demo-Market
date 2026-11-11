export type Side = 'LONG' | 'SHORT'
export type Currency = 'USDT' | 'USDC' | 'SOL'

export interface ActivePosition {
  id: string
  serverId: string | null
  symbol: string
  side: Side
  entry: number
  lev: number
  collateralUsd: number
  size: number
  liq: number | null
  tp: number | null
  sl: number | null
  rawCol: number
  curr: Currency
  openedAt: number
}

export type CloseReason = 'MANUAL' | 'TP HIT!' | 'SL HIT!' | 'LIQ!'

export interface ClosedPosition {
  id: string
  symbol: string
  side: Side
  entry: number
  exit: number
  lev: number
  collateralUsd: number
  size: number
  pnl: number
  roe: number
  tp: number | null
  sl: number | null
  rawCol: number
  curr: Currency
  openedAt: number
  closedAt: number
  reason: CloseReason
  win: boolean
  rewardTx?: string
}

export interface OpenPositionInput {
  side: Side
  symbol: string
  entry: number
  lev: number
  collateralUsd: number
  rawCol: number
  curr: Currency
  tp: number | null
  sl: number | null
}

export const computeLiqPrice = (side: Side, entry: number, lev: number): number =>
  side === 'LONG' ? entry - entry / lev : entry + entry / lev

export const computePnl = (side: Side, entry: number, mark: number, size: number): number =>
  side === 'LONG' ? (mark - entry) * size : (entry - mark) * size

export const computeRoe = (pnl: number, collateralUsd: number): number =>
  collateralUsd > 0 ? (pnl / collateralUsd) * 100 : 0
