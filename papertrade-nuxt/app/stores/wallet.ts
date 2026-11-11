import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SolanaProvider } from '~/types/global'
import { scanDetectedWallets, type DetectedWallet } from '~/composables/useWalletDetection'

export const useWalletStore = defineStore('wallet', () => {
  // --- State ---
  const address = ref<string | null>(null)
  const providerId = ref<string | null>(null)
  const providerLabel = ref<string | null>(null)
  const providerType = ref<'known' | 'standard' | 'injected' | null>(null)
  const paperBalance = ref(0)
  const nextClaimAt = ref(0)
  const connecting = ref(false)

  // Wallet yang lagi aktif (tidak dipersist; fallback ke rescan kalau hilang).
  let currentDw: DetectedWallet | null = null

  // --- Helpers ---
  function extractAddress(provider: SolanaProvider, resp: unknown): string | null {
    const fromResp = (resp as { publicKey?: unknown })?.publicKey
    const pk = fromResp ?? provider.publicKey
    if (pk && typeof (pk as { toJSON?: unknown; toString: unknown }).toString === 'function') {
      return (pk as { toString(): string }).toString()
    }
    // Wallet Standard menyimpan address langsung di resp.accounts
    const std = (resp as { accounts?: Array<{ address?: string }> })?.accounts?.[0]?.address
    if (typeof std === 'string' && std) return std
    return null
  }

  function matchPersisted(): DetectedWallet | undefined {
    if (currentDw) return currentDw
    const all = scanDetectedWallets()
    return (
      all.find(d => d.id === providerId.value) ??
      all.find(d => d.label.toLowerCase() === (providerLabel.value ?? '').toLowerCase())
    )
  }

  // --- Actions ---
  async function connectDetected(dw: DetectedWallet): Promise<{ ok: boolean; message?: string }> {
    connecting.value = true
    try {
      let addr: string | null = null

      if (dw.kind === 'standard' && dw.standard) {
        const res = await dw.standard.features?.['standard:connect']?.connect?.()
        addr = res?.accounts?.[0]?.address ?? null
      } else if (dw.provider) {
        const resp = await dw.provider.connect({})
        addr = extractAddress(dw.provider, resp)
      }

      if (!addr) throw new Error('No address returned')
      address.value = addr
      providerId.value = dw.id
      providerLabel.value = dw.label
      providerType.value = dw.kind
      currentDw = dw
      // Detach kalau user disconnect dari extension-nya.
      dw.provider?.on?.('disconnect', () => { paperBalance.value = 0 })
      void refreshBalance()
      return { ok: true }
    } catch {
      return { ok: false, message: `Koneksi ke ${dw.label} ditolak atau gagal, Boss.` }
    } finally {
      connecting.value = false
    }
  }

  async function tryAutoConnect(): Promise<void> {
    if (!address.value || !providerType.value || connecting.value) return
    // Wallet Standard kadang announce belakangan → coba lagi sekali.
    let dw = matchPersisted()
    if (!dw && providerType.value === 'standard') {
      await new Promise(r => setTimeout(r, 900))
      dw = matchPersisted()
    }
    if (!dw) return
    try {
      if (dw.kind === 'standard' && dw.standard) {
        const res = await dw.standard.features?.['standard:connect']?.connect?.()
        const addr = res?.accounts?.[0]?.address ?? null
        if (addr) {
          address.value = addr
          currentDw = dw
          void refreshBalance()
        }
      } else if (dw.provider) {
        // onlyIfTrusted → silent kalau user belum approve, tanpa popup.
        const resp = await dw.provider.connect({ onlyIfTrusted: true })
        const addr = extractAddress(dw.provider, resp) ?? address.value
        if (addr) {
          address.value = addr
          currentDw = dw
          dw.provider.on?.('disconnect', () => { paperBalance.value = 0 })
          void refreshBalance()
        }
      }
    } catch {
      // User belum trust / nolak — jangan logout paksa.
    }
  }

  function disconnect() {
    const dw = currentDw
    try {
      if (dw?.standard) void dw.standard.features?.['standard:disconnect']?.disconnect?.()
      else void dw?.provider?.disconnect?.()
    } catch { /* diabaikan */ }
    currentDw = null
    address.value = null
    providerId.value = null
    providerLabel.value = null
    providerType.value = null
    paperBalance.value = 0
    nextClaimAt.value = 0
  }

  async function refreshBalance(): Promise<number> {
    if (!address.value) return 0
    try {
      const data = await $fetch<{ balance: number }>(`/api/balance?wallet=${address.value}`)
      paperBalance.value = Number(data.balance) || 0
    } catch {
      // server bisa lagi tidur; jangan crash UI
    }
    return paperBalance.value
  }

  async function claimFaucet(): Promise<{ success: boolean; message?: string; tx?: string; nextClaimAt?: number }> {
    if (!address.value) return { success: false, message: 'Connect wallet dulu!' }
    try {
      const data = await $fetch<{ success: boolean; message?: string; tx?: string; nextClaimAt?: number }>('/api/faucet', {
        method: 'POST',
        body: { userWallet: address.value }
      })
      if (data.success) {
        if (data.nextClaimAt) nextClaimAt.value = data.nextClaimAt
        void refreshBalance()
      }
      return data
    } catch (e: unknown) {
      const err = e as { data?: { message?: string; nextClaimAt?: number } }
      if (err?.data?.nextClaimAt) nextClaimAt.value = err.data.nextClaimAt
      return { success: false, message: err?.data?.message || 'Faucet lagi error, coba lagi.' }
    }
  }

  return {
    address, providerId, providerLabel, providerType, paperBalance, nextClaimAt, connecting,
    connectDetected, tryAutoConnect, disconnect, refreshBalance, claimFaucet
  }
}, {
  persist: { pick: ['address', 'providerId', 'providerLabel', 'providerType'] }
})
