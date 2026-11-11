import { ref } from 'vue'
import type { SolanaProvider } from '~/types/global'

/**
 * Deteksi wallet Solana yang terpasang di browser — dinamis:
 *  1. Provider injected yang dikenal (Phantom, Solflare, Backpack, Trust, Exodus, Glow)
 *  2. Wallet Standard (spec @wallet-standard) — wallet apa pun yang ikut standard
 *  3. Scan generik `window` — extension lain yang inject provider Solana-style
 * Hasil: daftar wallet yang benar-benar terpasang, siap dipakai login.
 */

// --- Tipe Wallet Standard (bentuk runtime, longgar biar semua wallet lolos) ---
export interface StandardWalletAccount {
  address: string
  publicKey?: unknown
}

export interface StandardWallet {
  name?: string
  version?: string
  icon?: string
  chains?: readonly string[]
  features?: Record<
    string,
    { connect?: () => Promise<{ accounts?: StandardWalletAccount[] } | void>; disconnect?: () => Promise<void> }
  >
  accounts?: readonly StandardWalletAccount[]
}

export interface DetectedWallet {
  /** id stabil: 'phantom' | 'standard:phantom' | 'injected:namaglobal' */
  id: string
  label: string
  kind: 'known' | 'standard' | 'injected'
  color: string
  provider?: SolanaProvider
  standard?: StandardWallet
}

// --- Warna brand + fallback palette ---
const BRAND_COLORS: Record<string, string> = {
  phantom: '#AB9FF2',
  solflare: '#FCB44B',
  backpack: '#E33E3F',
  trust: '#3375BB',
  exodus: '#1D2A39',
  glow: '#22e599'
}
const PALETTE = ['#AB9FF2', '#FCB44B', '#E33E3F', '#3375BB', '#14F195', '#627EEA', '#F0B90B', '#3468D1']

export function colorForLabel(label: string): string {
  const k = label.toLowerCase()
  for (const [name, color] of Object.entries(BRAND_COLORS)) {
    if (k.includes(name)) return color
  }
  let h = 0
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0
  const c = PALETTE[h % PALETTE.length]
  return c ?? '#AB9FF2'
}

// --- Registry Wallet Standard (singleton modul, survive antar komponen) ---
const standardWallets = new Map<string, StandardWallet>()

function registerStandardWallet(sw: StandardWallet | undefined | null): void {
  if (!sw || typeof sw !== 'object') return
  const name = String(sw.name ?? '').trim()
  if (!name) return
  // Hanya wallet yang mendukung Solana yang relevan untuk app ini.
  const chains = (sw.chains ?? []).map(String).map(c => c.toLowerCase())
  const feats = Object.keys(sw.features ?? {})
  const isSolana =
    chains.some(c => c.startsWith('solana:')) || feats.some(f => f.toLowerCase().startsWith('solana:'))
  if (!isSolana) return
  standardWallets.set(name.toLowerCase(), sw)
}

let listenersInstalled = false

function installStandardListeners(): void {
  if (import.meta.server || listenersInstalled) return
  listenersInstalled = true
  try {
    // API yang kita tawarkan ke wallet: mereka memanggil register(wallet).
    const api = { register: registerStandardWallet }

    // Protokol resmi @wallet-standard:
    //  - wallet dispatch 'register-wallet' dgn detail callback → kita panggil callback(api)
    //  - kita dispatch 'app-ready' dgn detail api → wallet yg load duluan register via api.register
    window.addEventListener('wallet-standard:register-wallet', ((e: Event) => {
      const cb = (e as CustomEvent).detail as ((api: unknown) => void) | undefined
      try { cb?.(api) } catch { /* wallet ngasih shape aneh → diabaikan */ }
    }) as EventListener)

    window.dispatchEvent(new CustomEvent('wallet-standard:app-ready', { detail: api }))

    // Protokol deprecated (v1, camelCase) — jaga kompatibilitas wallet lama.
    window.addEventListener('wallet-standard:appReady', ((e: Event) => {
      const d = ((e as CustomEvent).detail ?? {}) as { wallets?: StandardWallet[] }
      for (const w of d.wallets ?? []) registerStandardWallet(w)
    }) as EventListener)
    window.dispatchEvent(new Event('wallet-standard:registerWallet'))

    // Jalur deprecated lain: window.navigator.wallets (dipakai Phantom dkk sbg fallback)
    const navWallets = (window.navigator as unknown as { wallets?: Array<((api: unknown) => void)> }).wallets
    if (Array.isArray(navWallets)) {
      for (const cb of navWallets) {
        try { cb(api) } catch { /* diabaikan */ }
      }
    }
  } catch { /* browser aneh → diabaikan */ }
}

// --- Scan provider injected yang dikenal ---
const GENERIC_SKIP = new Set(['ethereum', 'phantom', 'solflare', 'backpack', 'trustwallet', 'xnft', 'exodus', 'glowSolana'])

function genericLabel(key: string, p: Record<string, unknown>): string {
  if (p.isPhantom === true) return 'Phantom'
  if (p.isSolflare === true) return 'Solflare'
  if (p.isBackpack === true) return 'Backpack'
  if (p.isTrustWallet === true || p.isTrust === true) return 'Trust Wallet'
  if (p.isExodus === true) return 'Exodus'
  if (p.isGlow === true) return 'Glow'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function scanDetectedWallets(): DetectedWallet[] {
  if (import.meta.server) return []
  installStandardListeners()

  const out: DetectedWallet[] = []
  const seenProviders = new Set<unknown>()
  const seenLabels = new Set<string>()

  const push = (dw: DetectedWallet) => {
    const k = dw.label.toLowerCase()
    if (!k || seenLabels.has(k)) return
    seenLabels.add(k)
    out.push(dw)
  }

  const w = window as unknown as Record<string, any>

  // 1) Provider injected yang dikenal — punya label & warna brand.
  const known: Array<{ id: string; label: string; find: () => SolanaProvider | undefined }> = [
    { id: 'phantom', label: 'Phantom', find: () => w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : undefined) },
    { id: 'solflare', label: 'Solflare', find: () => w.solflare ?? (w.solana?.isSolflare ? w.solana : undefined) },
    { id: 'backpack', label: 'Backpack', find: () => w.backpack ?? w.xnft?.injected?.solana },
    { id: 'trust', label: 'Trust Wallet', find: () => w.trustwallet?.solana },
    { id: 'exodus', label: 'Exodus', find: () => w.exodus?.solana },
    { id: 'glow', label: 'Glow', find: () => w.glowSolana }
  ]
  for (const k of known) {
    const p = k.find()
    if (!p || seenProviders.has(p)) continue
    seenProviders.add(p)
    push({ id: k.id, label: k.label, kind: 'known', color: colorForLabel(k.label), provider: p })
  }

  // 2) Wallet Standard — wallet apa pun (Nama acak pun tetap kepick).
  for (const [key, sw] of standardWallets) {
    const label = String(sw.name ?? key)
    push({ id: 'standard:' + key, label, kind: 'standard', color: colorForLabel(label), standard: sw })
  }

  // 3) Scan generik `window` — extension Solana yang nggak ikut standard & nggak dikenal.
  try {
    for (const [key, val] of Object.entries(window)) {
      if (GENERIC_SKIP.has(key)) continue
      if (!val || typeof val !== 'object') continue
      const p = val as unknown as SolanaProvider & Record<string, unknown>
      if (seenProviders.has(p)) continue
      if (typeof p.connect !== 'function') continue
      // Harus bau Solana: punya publicKey / isConnected / isSolana.
      const solanaish = p.isSolana === true || 'publicKey' in p || 'isConnected' in p
      // Buang provider EVM-only.
      const evmOnly = p.isMetaMask === true || p.isCoinbaseWallet === true || p.isRabby === true || p.isBraveWallet === true
      if (!solanaish || evmOnly) continue
      seenProviders.add(p)
      const label = genericLabel(key, p)
      push({ id: 'injected:' + key, label, kind: 'injected', color: colorForLabel(label), provider: p })
    }
  } catch { /* window aneh → diabaikan */ }

  return out
}

// --- Composable reaktif ---
const detected = ref<DetectedWallet[]>([])
const scanning = ref(true)

function rescan(): void {
  detected.value = scanDetectedWallets()
}

export function useWalletDetection() {
  if (import.meta.client) {
    // Rescan beberapa kali: extension kadang inject belakangan setelah app mount.
    setTimeout(rescan, 300)
    setTimeout(rescan, 1200)
    setTimeout(rescan, 3000)
    setTimeout(() => { scanning.value = false }, 1400)
    // Reaksi cepat kalau wallet baru announce setelah initial rescan.
    const early = () => rescan()
    window.addEventListener('wallet-standard:register-wallet', early, { once: false })
    onUnmounted(() => window.removeEventListener('wallet-standard:register-wallet', early))
  }
  rescan()
  return { detected, scanning, rescan }
}
