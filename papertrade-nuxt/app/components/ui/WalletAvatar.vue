<script setup lang="ts">
const props = withDefaults(defineProps<{ label: string; color: string; size?: number }>(), { size: 30 })

const initial = computed(() => (props.label || 'W').trim().charAt(0).toUpperCase())

// Teks hitam di atas warna terang, putih di atas warna gelap.
const fg = computed(() => {
  const hex = props.color.replace('#', '')
  if (hex.length !== 6) return '#ffffff'
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#0b0e11' : '#ffffff'
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full font-black shrink-0 select-none"
    :style="{
      width: (props.size ?? 30) + 'px',
      height: (props.size ?? 30) + 'px',
      background: props.color,
      color: fg,
      fontSize: Math.round((props.size ?? 30) * 0.45) + 'px'
    }"
  >{{ initial }}</span>
</template>
