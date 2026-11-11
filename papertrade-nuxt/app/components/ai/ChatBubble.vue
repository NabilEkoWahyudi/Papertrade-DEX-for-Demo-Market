<script setup lang="ts">
defineProps<{
  role: 'user' | 'ai'
  text: string
}>()
</script>

<template>
  <!-- AMAN XSS: interpolasi teks, BUKAN v-html -->
  <div class="flex" :class="role === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[85%] px-3 py-2 rounded-lg text-[11px] leading-relaxed shadow-sm whitespace-pre-line break-words"
      :class="role === 'user'
        ? 'bg-wau text-[#e9edef] rounded-tr-none'
        : 'bg-waai text-[#e9edef] rounded-tl-none'"
    >
      {{ text }}
    </div>
  </div>
</template>
