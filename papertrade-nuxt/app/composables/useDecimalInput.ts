import { reactive, computed, ref } from 'vue'

/**
 * Smart decimal input: koma → titik, "0,05" aman, leading zero nggak hilang.
 * Pemakaian: const c = useDecimalInput('100')
 *             c.value  → string tampilan  |  c.num  → number (NaN kalau kosong)
 */
export function useDecimalInput(initial = '') {
  const raw = ref<string>(initial)

  function sanitize(v: string): string {
    let s = v.replace(/,/g, '.').replace(/[^0-9.]/g, '')
    const parts = s.split('.')
    if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('')
    return s
  }

  const value = computed<string>({
    get: () => raw.value,
    set: (v) => { raw.value = sanitize(String(v)) }
  })

  const num = computed<number>(() => {
    const s = raw.value
    if (!s || s === '.') return NaN
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : NaN
  })

  return reactive({ value, num })
}
