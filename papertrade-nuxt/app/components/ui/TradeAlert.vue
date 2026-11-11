<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

const ui = useUiStore()

// Background SOLID (bukan tint transparan) + teks kontras.
const bgCls = computed(() => {
  switch (ui.tradeAlert?.type) {
    case 'tp': return 'bg-[#0ecb81]'
    case 'sl': return 'bg-[#f6465d]'
    default: return 'bg-[#a81f2d]'
  }
})

const txtCls = computed(() => (ui.tradeAlert?.type === 'tp' ? 'text-[#0b0e11]' : 'text-white'))
const icon = computed(() => (ui.tradeAlert?.type === 'tp' ? 'check' : 'warning'))
</script>

<template>
  <!-- Wrapper statis biar translate-x gak konflik dgn animasi -->
  <div class="fixed top-16 left-1/2 -translate-x-1/2 z-[9998] w-[min(380px,88vw)] pointer-events-none">
    <Transition name="talert">
      <div v-if="ui.tradeAlert" class="pointer-events-auto rounded-lg shadow-xl px-4 py-3 text-center" :class="bgCls">
        <div class="flex items-center justify-center gap-1.5" :class="txtCls">
          <UiIcon :name="icon" :size="15" />
          <span class="text-[13px] font-black tracking-wide">{{ ui.tradeAlert.title }}</span>
        </div>
        <p class="text-[10px] mt-1 leading-relaxed" :class="txtCls">{{ ui.tradeAlert.detail }}</p>
        <button
          class="mt-2.5 rounded-lg bg-[#0b0e11] text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 hover:brightness-125 transition-all cursor-pointer"
          @click="ui.dismissTradeAlert"
        >
          OK, GUA PAHAM
        </button>
      </div>
    </Transition>
  </div>
</template>

<style>
.talert-enter-active, .talert-leave-active { transition: all .25s ease; }
.talert-enter-from, .talert-leave-to { opacity: 0; transform: translateY(-14px) scale(0.98); }
</style>
