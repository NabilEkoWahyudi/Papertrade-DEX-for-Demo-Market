export interface SolanaProvider {
  publicKey?: unknown
  connect(opts?: Record<string, unknown>): Promise<{ publicKey?: unknown } | void>
  disconnect?(): Promise<void>
  on?(event: string, cb: (...args: unknown[]) => void): void
}

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider }
    solana?: SolanaProvider
    solflare?: SolanaProvider
    backpack?: SolanaProvider
    trustwallet?: { solana?: SolanaProvider }
    TradingView?: any
  }
}

export {}
