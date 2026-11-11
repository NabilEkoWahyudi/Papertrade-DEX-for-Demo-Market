<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()
</script>

<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center w-max max-w-[92vw]">
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="rounded-lg px-4 py-3 text-xs font-semibold shadow-lg border max-w-[360px] cursor-pointer text-center"
        :class="[
          t.tone === 'ok' ? 'bg-long/15 border-long/40 text-long' : '',
          t.tone === 'err' ? 'bg-short/15 border-short/40 text-short' : '',
          t.tone === 'info' ? 'bg-panel2 border-borderp text-textp' : ''
        ]"
        @click="ui.dismiss(t.id)"
      >
        {{ t.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
