import { useWalletStore } from '~/stores/wallet'

export function useWallet() {
  const wallet = useWalletStore()

  const shortAddress = computed(() => {
    const a = wallet.address
    if (!a) return ''
    return a.slice(0, 4) + '...' + a.slice(-4)
  })

  return { wallet, shortAddress }
}
