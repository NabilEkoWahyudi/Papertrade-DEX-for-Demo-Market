<script setup lang="ts">
const props = defineProps<{ options: string[] }>()
const model = defineModel<string>()
</script>

<template>
  <div class="flex bg-bg border border-borderp rounded-[10px] p-1">
    <button
      v-for="o in props.options"
      :key="o"
      type="button"
      class="flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
      :class="model === o
        ? o === 'LONG' ? 'bg-long text-black' : o === 'SHORT' ? 'bg-short text-white' : 'bg-accent text-white'
        : 'text-sub hover:text-textp'"
      @click="model = o"
    >
      {{ o }}
    </button>
  </div>
</template>
