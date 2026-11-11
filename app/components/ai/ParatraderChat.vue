<script setup lang="ts">
import { useAiChat } from '~/composables/useAiChat'

const { messages, sending, send, aiApiKey, aiModel, saveAiSettings } = useAiChat()
const input = ref('')
const boxEl = ref<HTMLElement | null>(null)

// --- Pengaturan OpenRouter (API key + Model ID, disimpan di localStorage) ---
const settingsOpen = ref(false)
const keyDraft = ref('')
const modelDraft = ref('')
const configured = computed(() => Boolean(aiApiKey.value.trim() && aiModel.value.trim()))

function toggleSettings() {
  if (!settingsOpen.value) {
    keyDraft.value = aiApiKey.value
    modelDraft.value = aiModel.value || 'google/gemma-3n-e4b-it:free'
  }
  settingsOpen.value = !settingsOpen.value
}

function save() {
  saveAiSettings(keyDraft.value, modelDraft.value)
  settingsOpen.value = false
}

async function submit() {
  const msg = input.value.trim()
  if (!msg || sending.value) return
  input.value = ''
  await send(msg)
}

// Travel: scroll ke bawah tiap ada pesan baru.
watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (boxEl.value) boxEl.value.scrollTop = boxEl.value.scrollHeight
  }
)

if (import.meta.client) {
  onMounted(() => {
    if (messages.value.length === 0) {
      messages.value.push({ role: 'ai', text: 'Sistem siap. Mau analisa market, Boss?', ts: Date.now() })
    }
    if (boxEl.value) boxEl.value.scrollTop = boxEl.value.scrollHeight
  })
}
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-xl border border-borderp" style="background: #0b141a;">
    <div class="px-3 py-2.5 flex items-center justify-between text-[11px] font-black tracking-widest text-gold bg-waai">
      <span>PARATRADER AI</span>
      <button
        class="flex items-center gap-1 text-[9px] font-bold text-sub hover:text-gold transition-colors cursor-pointer"
        title="Pengaturan OpenRouter (API key + Model ID)"
        @click="toggleSettings"
      >
        <UiIcon name="cpu" :size="12" />
        {{ configured ? 'OPENROUTER' : 'SETUP' }}
      </button>
    </div>

    <!-- Panel pengaturan OpenRouter -->
    <div v-if="settingsOpen" class="p-3 space-y-2 border-b border-borderp bg-panel">
      <div>
        <label class="text-[9px] font-bold text-sub tracking-wider">API KEY OPENROUTER</label>
        <input
          v-model="keyDraft"
          type="password"
          placeholder="sk-or-v1-..."
          autocomplete="off"
          class="field mt-1 !py-1.5 !text-[11px]"
        >
      </div>
      <div>
        <label class="text-[9px] font-bold text-sub tracking-wider">MODEL ID</label>
        <input
          v-model="modelDraft"
          type="text"
          placeholder="google/gemma-3n-e4b-it:free"
          autocomplete="off"
          class="field mt-1 !py-1.5 !text-[11px]"
        >
      </div>
      <p class="text-[9px] text-sub leading-relaxed">
        Contoh model: google/gemma-3n-e4b-it:free · meta-llama/llama-3.3-70b-instruct:free · anthropic/claude-3.5-sonnet.
        Key disimpan di browser lu (localStorage) dan dikirim per-request — nggak disimpan di server.
      </p>
      <div class="flex items-center gap-2">
        <Button variant="gold" size="sm" @click="save">Simpan</Button>
        <span v-if="configured" class="text-[9px] text-accent num">Aktif: {{ aiModel }}</span>
        <span v-else class="text-[9px] text-sub">Belum diisi — AI nggak bisa jawab.</span>
      </div>
    </div>

    <div ref="boxEl" class="flex-1 p-3 space-y-2 overflow-y-auto" style="min-height: 180px; max-height: 260px;">
      <ChatBubble v-for="(m, i) in messages" :key="m.ts + '-' + i" :text="m.text" :role="m.role" />
    </div>

    <div class="flex gap-2 p-2 bg-waai">
      <input
        v-model="input"
        type="text"
        placeholder="Tulis pesan..."
        class="flex-1 bg-[#2a3942] rounded-lg px-3 py-2 text-[12px] text-white"
        @keypress.enter="submit"
      >
      <button
        class="px-3 text-[11px] font-black text-gold disabled:opacity-40"
        :disabled="sending || !input.trim()"
        @click="submit"
      >
        {{ sending ? '...' : 'KIRIM' }}
      </button>
    </div>
  </div>
</template>
