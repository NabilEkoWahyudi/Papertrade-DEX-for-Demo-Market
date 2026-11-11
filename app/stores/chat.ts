import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ChatMsg {
  role: 'user' | 'ai'
  text: string
  ts: number
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMsg[]>([])
  const sending = ref(false)

  function push(role: 'user' | 'ai', text: string) {
    messages.value.push({ role, text, ts: Date.now() })
  }

  return { messages, sending, push }
})
