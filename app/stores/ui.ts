import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'info' | 'ok' | 'err'

export interface ToastMsg {
  id: number
  text: string
  tone: ToastTone
}

export type TradeAlertType = 'tp' | 'sl' | 'liq'

export interface TradeAlert {
  type: TradeAlertType
  title: string
  detail: string
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastMsg[]>([])
  const upgradeMode = ref<'show' | 'basic'>('show')
  const mobileTab = ref<'CHART' | 'OB' | 'TRADE' | 'AI' | 'LB'>('CHART')

  // Alert besar TP/SL/LIQ — nongol di tengah-atas sampai user tutup manual.
  const tradeAlert = ref<TradeAlert | null>(null)

  let seq = 1
  function push(text: string, tone: ToastTone = 'info') {
    const id = seq++
    toasts.value.push({ id, text, tone })
    setTimeout(() => dismiss(id), 3500)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function info(text: string) { push(text, 'info') }
  function ok(text: string) { push(text, 'ok') }
  function err(text: string) { push(text, 'err') }

  function fireTradeAlert(a: TradeAlert) { tradeAlert.value = a }
  function dismissTradeAlert() { tradeAlert.value = null }

  return {
    toasts, upgradeMode, mobileTab, tradeAlert,
    push, dismiss, info, ok, err, fireTradeAlert, dismissTradeAlert
  }
})
