<script setup lang="ts">
const name = ref('')
const email = ref('')
const msg = ref('')
const sent = ref(false)

function submit() {
  // Form demo: attach mailto link (tanpa backend email).
  const subject = `[PaperTrade] ${name.value || 'Tanpa nama'}`
  location.href = `mailto:admin%40papertrade.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg.value + '\n\n Reply to: ' + email.value)}`
  sent.value = true
}

useSeoMeta({ title: 'Contact', description: 'Hubungi tim PaperTrade.' })
</script>

<template>
  <div class="max-w-xl mx-auto px-6 py-16">
    <h1 class="text-3xl font-black text-white">Contact</h1>
    <p class="text-sub text-sm mt-2">Ada feedback, bug, atau mau kolab? Ngomonglah, Boss.</p>

    <form class="panel rounded-xl p-5 mt-6 flex flex-col gap-3" @submit.prevent="submit">
      <input v-model="name" placeholder="Nama" class="field">
      <input v-model="email" type="email" placeholder="Email" class="field">
      <textarea v-model="msg" rows="5" placeholder="Pesan..." class="field resize-none" />
      <div class="bg-accent text-white text-center text-xs font-black uppercase tracking-wide px-4 py-3 rounded-lg hover:brightness-110 transition cursor-pointer" @click="submit">
        <span class="inline-flex items-center gap-1.5 justify-center">
          <template v-if="sent"><UiIcon name="check" :size="13" /> Dibuka di mail app</template>
          <template v-else>Kirim Pesan</template>
        </span>
      </div>
    </form>

    <div class="mt-8 text-[12px] text-sub space-y-1.5">
      <p class="flex items-center gap-1.5"><UiIcon name="link" :size="13" class="text-gold shrink-0" /> Jaringan: Solana Devnet</p>
      <p class="flex items-center gap-1.5"><UiIcon name="message" :size="13" class="text-gold shrink-0" /> Discord (mock): papertrade#0001</p>
      <p class="flex items-center gap-1.5"><UiIcon name="at-sign" :size="13" class="text-gold shrink-0" /> X/Twitter: @PaperTradeDEX</p>
    </div>
  </div>
</template>
