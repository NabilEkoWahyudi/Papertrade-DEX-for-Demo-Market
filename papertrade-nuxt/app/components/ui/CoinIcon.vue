<script setup lang="ts">
import { COIN_ICONS } from '~/utils/coinIcons'
import { PAIRS } from '~/types/market'

const props = withDefaults(defineProps<{ symbol?: string; size?: number }>(), {
  symbol: '',
  size: 18
})

const key = computed(() => {
  const s = (props.symbol || '').toUpperCase()
  if (COIN_ICONS[s]) return s
  const base = s.replace(/(USDT|USD|PERP)$/g, '')
  if (COIN_ICONS[base]) return base
  const pair = PAIRS.find(p => p.symbol === s)
  return pair && COIN_ICONS[pair.base] ? pair.base : ''
})

const icon = computed(() => (key.value ? COIN_ICONS[key.value] : undefined))
const fallback = computed(() => (props.symbol || '?').replace(/USDT$/g, '').slice(0, 3).toUpperCase())
</script>

<template>
  <svg
    v-if="icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    class="shrink-0 inline-block align-middle"
    aria-hidden="true"
  >
    <template v-if="icon.custom">
      <!-- eslint-disable-next-line vue/no-v-html — markup statis dari file lokal -->
      <g v-html="icon.inner" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="12" :fill="icon.color" />
      <path
        :d="icon.path"
        fill="#ffffff"
        transform="translate(12,12) scale(0.62) translate(-12,-12)"
      />
    </template>
  </svg>
  <span
    v-else
    class="inline-flex items-center justify-center rounded-full bg-panel2 border border-borderp text-sub font-black"
    :style="{ width: props.size + 'px', height: props.size + 'px', fontSize: Math.max(8, props.size * 0.38) + 'px' }"
  >{{ fallback }}</span>
</template>
