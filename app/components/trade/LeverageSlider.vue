<script setup lang="ts">
import type { Side } from '~/types/position'

const props = defineProps<{ side: Side }>()
const lev = defineModel<number>({ default: 20 })
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-1.5">
      <span class="text-[10px] font-black text-sub uppercase tracking-wider">Leverage</span>
      <span class="num text-gold font-black">{{ lev }}x</span>
    </div>
    <input
      v-model.number="lev"
      type="range"
      min="1" max="100"
      :style="{ accentColor: props.side === 'LONG' ? '#0ecb81' : '#f6465d' }"
      class="w-full"
    >
    <div class="flex justify-between text-[9px] text-sub mt-1"><span>1x</span><span>100x</span></div>
  </div>
</template>
