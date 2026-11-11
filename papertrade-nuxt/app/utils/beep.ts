/**
 * Bunyi alert pendek via WebAudio (client-only).
 * tp = ping tinggi (cuan), sl = nada rendah pendek, liq = nada paling rendah panjang.
 * Kalau browser memblokir audio, diem aja — alert visual tetap muncul.
 */
export function beep(kind: 'tp' | 'sl' | 'liq'): void {
  if (import.meta.server) return
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext
      webkitAudioContext?: typeof AudioContext
    }
    const Ctx = w.AudioContext ?? w.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = kind === 'tp' ? 880 : kind === 'liq' ? 160 : 240
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    const dur = kind === 'tp' ? 0.22 : 0.45
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    osc.stop(ctx.currentTime + dur)
    setTimeout(() => { void ctx.close() }, (dur + 0.25) * 1000)
  } catch {
    // AudioContext diblokir / tidak tersedia → abaikan.
  }
}
