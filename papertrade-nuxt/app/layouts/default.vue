<template>
  <div class="flex flex-col min-h-screen">
    <AppNavbar />
    <main class="flex-1 w-full">
      <slot />
    </main>
    <footer class="border-t border-borderp bg-panel px-6 py-6 text-center text-xs text-sub">
      <p>PAPERTRADE DEX — simulator edukasi di Solana Devnet. $PAPER tidak punya nilai uang, sinyal AI bukan saran finansial.</p>
    </footer>
  </div>
</template>
