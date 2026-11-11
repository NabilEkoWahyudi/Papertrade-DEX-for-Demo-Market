<script setup lang="ts">
const rows = ref<Array<{ wallet: string; profit: number }>>([])
const loaded = ref(false)

async function load() {
  try {
    const data = await $fetch<Array<{ wallet: string; profit: number }>>('/api/leaderboard')
    rows.value = data ?? []
    loaded.value = true
  } catch {}
}

if (import.meta.client) {
  onMounted(() => {
    void load()
    const { pause } = useIntervalFn(load, 30_000)
    onUnmounted(() => pause())
  })
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="panel-header"><span>TOP DEGENS</span><span class="text-gold">PROFIT $</span></div>
    <div class="flex-1 min-h-0 overflow-y-auto" style="min-height: 120px;">
    <template v-if="rows.length">
      <div
        v-for="(d, i) in rows"
        :key="d.wallet + i"
        class="flex justify-between items-center px-3 py-2 text-[11px] border-b border-borderp/60 num"
      >
        <span :class="i === 0 ? 'text-gold font-bold' : 'text-sub'">#{{ i + 1 }} <span class="text-textp ml-1">{{ d.wallet }}</span></span>
        <span class="font-bold text-long">+${{ d.profit.toLocaleString('id-ID') }}</span>
      </div>
    </template>
    <template v-else-if="loaded">
      <div class="p-3 text-[11px] text-sub text-center">Belum ada degen. Jadi yang pertama!</div>
    </template>
    <Skeleton v-else class="m-3 h-24" />
    </div>
  </div>
</template>
