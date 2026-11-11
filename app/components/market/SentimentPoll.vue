<script setup lang="ts">
const good = ref(0)
const bad = ref(0)
const total = ref(0)
const voted = ref(false)

async function load() {
  try {
    const res = await $fetch<{ good: number; bad: number; total: number }>('/api/sentiment')
    good.value = res.good
    bad.value = res.bad
    total.value = res.total
  } catch {}
}

if (import.meta.client) onMounted(load)

const goodPct = computed(() => (total.value ? Math.round((good.value / Math.max(total.value, 1)) * 100) : 0))
const badPct = computed(() => (total.value ? Math.round((bad.value / Math.max(total.value, 1)) * 100) : 0))

async function vote(v: 'good' | 'bad') {
  if (voted.value) return
  try {
    const res = await $fetch<{ good: number; bad: number; total: number }>('/api/sentiment', {
      method: 'POST',
      body: { vote: v }
    })
    good.value = res.good
    bad.value = res.bad
    total.value = res.total
    voted.value = true
  } catch {}
}
</script>

<template>
  <div>
    <div class="panel-header"><span>SENTIMENT POLL</span></div>
    <div class="p-3 flex flex-col gap-3">
    <p class="text-xs font-semibold text-textp">How do you feel about Bitcoin today?</p>
    <div class="flex gap-2">
      <Button variant="long" size="sm" @click="vote('good')">
        <span class="inline-flex items-center gap-1.5"><UiIcon name="thumbs-up" :size="12" /> Good</span>
      </Button>
      <Button variant="short" size="sm" @click="vote('bad')">
        <span class="inline-flex items-center gap-1.5"><UiIcon name="thumbs-down" :size="12" /> Bad</span>
      </Button>
    </div>
    <div v-if="total > 0" class="space-y-1.5">
      <div class="flex justify-between text-[10px] text-sub"><span>{{ goodPct }}% Good</span><span>{{ badPct }}% Bad</span></div>
      <div class="flex h-1.5 rounded overflow-hidden bg-panel2">
        <div class="bg-long" :style="{ width: goodPct + '%' }" />
        <div class="bg-short" :style="{ width: badPct + '%' }" />
      </div>
      <p v-if="voted" class="text-[10px] text-accent">Terima kasih, vote lu kecatat di server!</p>
    </div>
    </div>
  </div>
</template>
