<script setup lang="ts">
const wallet = useWalletStore()

interface OnchainTx { sig: string; blockTime: number | null; err: unknown }
const txs = ref<OnchainTx[]>([])

async function load() {
  if (!wallet.address || import.meta.server) return
  try {
    const res = await $fetch<{ result?: Array<{ signature: string; blockTime: number | null; err: unknown }> }>(
      'https://api.devnet.solana.com',
      {
        method: 'POST',
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [wallet.address, { limit: 10 }]
        }
      }
    )
    txs.value = (res?.result ?? []).map(s => ({
      sig: s.signature,
      blockTime: s.blockTime,
      err: s.err
    }))
  } catch {
    // RPC devnet bisa 429; diem aja.
  }
}

watch(() => wallet.address, () => void load(), { immediate: true })

if (import.meta.client) {
  onMounted(() => {
    void load()
    const { pause } = useIntervalFn(load, 30_000)
    onUnmounted(() => pause())
  })
}

const fmtTime = (t: number | null) =>
  t
    ? new Date(t * 1000).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--'

const shortSig = (s: string) => `${s.slice(0, 8)}...${s.slice(-6)}`
const explorerUrl = (s: string) => `https://explorer.solana.com/tx/${s}?cluster=devnet`
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="panel-header">
      <span>Latest Transactions On-Chain (Devnet)</span>
      <span class="text-accent inline-flex items-center gap-1">Explorer <UiIcon name="arrow-up-right" :size="11" /></span>
    </div>
    <div class="flex-1 min-h-0 overflow-y-auto text-[11px]">
    <template v-if="wallet.address">
      <a
        v-for="t in txs"
        :key="t.sig"
        :href="explorerUrl(t.sig)"
        target="_blank"
        rel="noopener"
        class="grid grid-cols-[92px_minmax(0,1fr)_auto] gap-2 px-3 py-1.5 border-b border-borderp/60 hover:bg-panel2 items-center"
      >
        <span class="text-sub">{{ fmtTime(t.blockTime) }}</span>
        <span class="num truncate" :class="t.err ? 'text-short' : 'text-long'">{{ shortSig(t.sig) }}</span>
        <span class="num text-[10px] px-1.5 py-0.5 rounded" :class="t.err ? 'chip-err' : 'chip-ok'">{{ t.err ? 'Gagal' : 'Sukses' }}</span>
      </a>
      <div v-if="txs.length === 0" class="px-3 py-6 text-center text-sub">
        Belum ada transaksi. Claim faucet dulu biar muncul di sini.
      </div>
    </template>
    <div v-else class="px-3 py-6 text-center text-sub">
      Connect wallet dulu buat lihat transaksi $PAPER di devnet.
    </div>
    </div>
  </div>
</template>
