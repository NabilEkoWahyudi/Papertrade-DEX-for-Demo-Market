<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open" class="fixed inset-0 z-[999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" @click.self="emit('close')">
      <div class="w-full max-w-sm bg-panel border border-borderp rounded-2xl p-6 shadow-2xl">
        <slot />
      </div>
    </div>
  </Teleport>
</template>
