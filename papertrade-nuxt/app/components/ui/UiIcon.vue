<script setup lang="ts">
import { UI_ICONS } from '~/utils/uiIcons'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 })

// Data markup berasal dari file lokal kita sendiri (bukan input user) → aman.
const inner = computed(() => UI_ICONS[props.name] ?? '')
</script>

<template>
  <svg
    v-if="inner"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0 inline-block align-middle"
    aria-hidden="true"
    v-html="inner"
  />
</template>
