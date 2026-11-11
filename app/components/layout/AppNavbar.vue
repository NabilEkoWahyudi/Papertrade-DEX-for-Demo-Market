<script setup lang="ts">
import { useWalletStore } from '~/stores/wallet'
import { useWallet } from '~/composables/useWallet'

const walletStore = useWalletStore()
const { shortAddress } = useWallet()
const mobileNav = ref(false)
const open = ref(false)

if (import.meta.client) {
  onMounted(() => void walletStore.tryAutoConnect())
}
</script>

<template>
  <header class="h-14 border-b border-borderp bg-bg z-50 sticky top-0">
    <div class="h-full px-4 md:px-6 flex items-center justify-between">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="font-black text-sm tracking-[2px] text-white uppercase">
          PAPER<span class="text-gold">TRADE</span>
        </NuxtLink>
        <nav class="hidden md:flex items-center gap-5 text-xs font-semibold text-sub">
          <NuxtLink to="/" class="hover:text-textp">Home</NuxtLink>
          <NuxtLink to="/platform" class="hover:text-textp">Platform</NuxtLink>
          <NuxtLink to="/wallet" class="hover:text-textp">Wallet</NuxtLink>
          <NuxtLink to="/contact" class="hover:text-textp">Contact</NuxtLink>
          <NuxtLink to="/exchange" class="text-textp hover:text-gold underline underline-offset-4">Exchange</NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <PaperBalance v-if="walletStore.address" compact />
        <Button size="sm" @click="open = true">
          {{ walletStore.address ? shortAddress : 'Connect Wallet' }}
        </Button>
        <button class="md:hidden text-textp" @click="mobileNav = !mobileNav">
          <UiIcon name="menu" :size="20" />
        </button>
      </div>
    </div>

    <div v-if="mobileNav" class="md:hidden border-t border-borderp bg-panel px-4 py-3 flex flex-col gap-2 text-sm">
      <NuxtLink to="/" @click="mobileNav = false">Home</NuxtLink>
      <NuxtLink to="/platform" @click="mobileNav = false">Platform</NuxtLink>
      <NuxtLink to="/wallet" @click="mobileNav = false">Wallet</NuxtLink>
      <NuxtLink to="/contact" @click="mobileNav = false">Contact</NuxtLink>
      <NuxtLink to="/exchange" class="text-gold" @click="mobileNav = false">Exchange</NuxtLink>
    </div>

    <WalletModal :open="open" @close="open = false" />
  </header>
</template>
