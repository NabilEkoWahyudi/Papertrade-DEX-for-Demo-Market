<script setup lang="ts">
defineProps<{ options: Array<{ label: string; value: string }> }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <select v-model="model" class="field">
    <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
  </select>
</template>
