import { useWalletStore } from '~/stores/wallet'

/** Cooldown faucet: sumber kebenaran ada di SERVER, UI cuma menampilkan countdown. */
export function useFaucet() {
  const wallet = useWalletStore()

  const now = ref(Date.now())
  const { pause, resume } = useIntervalFn(() => {
    now.value = Date.now()
  }, 1000)
  onMounted(() => resume())
  onUnmounted(() => pause())

  const cooldownMs = computed(() => Math.max(0, (wallet.nextClaimAt ?? 0) - now.value))
  const ready = computed(() => !!wallet.address && cooldownMs.value <= 0)
  const countdown = computed(() => {
    if (cooldownMs.value <= 0) return ''
    const t = Math.ceil(cooldownMs.value / 1000)
    const h = Math.floor(t / 3600)
    const m = Math.floor((t % 3600) / 60)
    const s = t % 60
    return `${h ? h + 'H ' : ''}${m ? m + 'M ' : ''}${s}S`
  })

  const claim = () => wallet.claimFaucet()

  return { paperBalance: computed(() => wallet.paperBalance), ready, countdown, claim, refreshBalance: wallet.refreshBalance }
}
