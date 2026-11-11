<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'long' | 'short' | 'gold' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), { variant: 'primary', size: 'md', block: false })

const variantClass = computed(() => {
  switch (props.variant) {
    case 'long': return 'bg-long text-black hover:brightness-110'
    case 'short': return 'bg-short text-white hover:brightness-110'
    case 'gold': return 'bg-gold text-black hover:brightness-110'
    case 'ghost': return 'bg-transparent border border-borderp text-textp hover:border-accent'
    case 'primary':
    default: return 'bg-accent text-white hover:brightness-110'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'px-3 py-1.5 text-[11px]'
    case 'lg': return 'px-6 py-3.5 text-sm'
    default: return 'px-4 py-2.5 text-xs'
  }
})
</script>

<template>
  <button
    :class="[
      'rounded-lg font-bold uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
      variantClass,
      sizeClass,
      props.block ? 'w-full' : ''
    ]"
  >
    <slot />
  </button>
</template>
