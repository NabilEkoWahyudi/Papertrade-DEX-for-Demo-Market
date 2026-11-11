<script setup lang="ts">
const model = defineModel<string>({ default: '1' })
const options = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' }
]
</script>

<template>
  <div class="flex gap-1 bg-bg border border-borderp rounded-[8px] p-0.5 w-fit">
    <button
      v-for="o in options"
      :key="o.value"
      class="px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors"
      :class="model === o.value ? 'bg-accent text-white' : 'text-sub hover:text-textp'"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
