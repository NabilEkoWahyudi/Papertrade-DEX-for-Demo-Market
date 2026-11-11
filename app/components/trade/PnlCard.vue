<script setup lang="ts">
import { useMarketStore } from '~/stores/market'
import { usePositionStore } from '~/stores/position'
import { useUiStore } from '~/stores/ui'
import { fmtPrice } from '~/types/market'

interface PnlView {
  symbol: string
  side: string
  lev: number
  entry: number
  exit: number
  pnl: number
  roe: number
  whenLabel: string
  when: string
}

const market = useMarketStore()
const pos = usePositionStore()
const ui = useUiStore()
const exporting = ref(false)

// Target card: trade yang di-share (riwayat / trade baru ditutup) diprioritaskan,
// kalau tidak ada → posisi aktif dengan PnL live.
const target = computed(() => pos.shareTrade ?? pos.activePosition)

const t = computed<PnlView | null>(() => {
  const src = target.value
  if (!src) return null
  if ('exit' in src) {
    // Trade selesai → pakai angka rekaman (stabil, bebas NaN).
    return {
      symbol: src.symbol,
      side: src.side,
      lev: src.lev,
      entry: src.entry,
      exit: src.exit,
      pnl: src.pnl,
      roe: src.roe,
      whenLabel: 'Ditutup',
      when: new Date(src.closedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
  }
  // Posisi aktif → angka live mengikuti mark price.
  return {
    symbol: src.symbol,
    side: src.side,
    lev: src.lev,
    entry: src.entry,
    exit: market.markPrice || src.entry,
    pnl: pos.pnl,
    roe: pos.roe,
    whenLabel: 'Dibuka',
    when: new Date(src.openedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
})

const pnlClass = computed(() => ((t.value?.pnl ?? 0) >= 0 ? '#0ecb81' : '#f6465d'))

const pnlText = computed(() => {
  const v = t.value
  if (!v) return '$0.00'
  return `${v.pnl >= 0 ? '+' : '-'}$${Math.abs(Number.isFinite(v.pnl) ? v.pnl : 0).toFixed(2)}`
})

const roeText = computed(() => {
  const v = t.value
  if (!v) return '0.00'
  return `${v.roe >= 0 ? '+' : ''}${Number.isFinite(v.roe) ? v.roe.toFixed(2) : '0.00'}`
})

/** Fallback share: salin ringkasan PnL ke clipboard (selalu jalan, tanpa canvas). */
async function copyText() {
  const v = t.value
  if (!v) {
    ui.err('Belum ada PnL buat disalin.')
    return
  }
  const txt = [
    `PAPERTRADE PRO — ${v.symbol} ${v.side} ${v.lev}X`,
    `ROE: ${roeText.value}% | PnL: ${pnlText.value}`,
    `Entry ${fmtPrice(v.entry)} → ${v.whenLabel === 'Ditutup' ? 'Exit' : 'Mark'} ${fmtPrice(v.exit)}`,
    `${v.whenLabel}: ${v.when}`
  ].join('\n')
  try {
    await navigator.clipboard.writeText(txt)
    ui.ok('Teks PnL disalin — tinggal paste di WA/X!')
  } catch {
    ui.err('Clipboard ditolak browser.')
  }
}

/**
 * Render PNG card manual via Canvas 2D.
 * Kenapa bukan html-to-image: elemen offscreen (position:fixed; left:-9999px)
 * bikin klon foreignObject kegambar di luar viewport capture → PNG kosong hitam.
 * Canvas 2D deterministik: tidak tergantung font CORS, CSS, atau posisi elemen.
 */
async function renderPnlPng(v: PnlView): Promise<string> {
  const S = 2 // resolusi 2x
  const W = 380
  const H = 620
  const canvas = document.createElement('canvas')
  canvas.width = W * S
  canvas.height = H * S
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas tidak tersedia')
  ctx.scale(S, S)

  // Pakai font Inter kalau sudah dimuat halaman (fallback Arial otomatis).
  try {
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('400 12px Inter'),
        document.fonts.load('700 14px Inter'),
        document.fonts.load('800 14px Inter'),
        document.fonts.load('900 64px Inter')
      ])
    }
  } catch {}

  const F = (weight: number, size: number) => `${weight} ${size}px Inter, Arial, sans-serif`
  const WIN = '#0ecb81'
  const LOSS = '#f6465d'
  const GOLD = '#f0b90b'
  const GRAY = '#848e9c'
  const DIM = '#6b7280'
  const c = v.pnl >= 0 ? WIN : LOSS
  // letterSpacing tersedia di Chromium 99+; kalau nggak ada, abaikan aja.
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing?: string }

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#0b0e11'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#2b3139'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)

  // --- Header ---
  ls.letterSpacing = '3px'
  ctx.fillStyle = GOLD
  ctx.font = F(900, 20)
  ctx.fillText('PAPERTRADE', 40, 62)
  ls.letterSpacing = '0px'

  ctx.lineWidth = 1
  ctx.strokeStyle = '#2b3139'
  ctx.fillStyle = GRAY
  ctx.font = F(800, 10)
  ls.letterSpacing = '1px'
  const badge = v.whenLabel.toUpperCase()
  const bw = ctx.measureText(badge).width + 16
  ctx.strokeRect(W - 40 - bw, 44, bw, 20)
  ctx.fillText(badge, W - 40 - bw + 8, 58)
  ls.letterSpacing = '0px'

  // --- Symbol + chip side ---
  ctx.fillStyle = '#ffffff'
  ctx.font = F(900, 32)
  ctx.fillText(v.symbol, 40, 148)

  ctx.strokeStyle = c
  ctx.fillStyle = c
  ctx.font = F(800, 14)
  const chip = `${v.side} ${v.lev}X`
  const cw = ctx.measureText(chip).width + 20
  ctx.strokeRect(40, 164, cw, 26)
  ctx.fillText(chip, 50, 182)

  // --- ROE ---
  ctx.fillStyle = GRAY
  ctx.font = F(400, 12)
  ls.letterSpacing = '1px'
  ctx.fillText('ROE / PERSENTASE', 40, 246)
  ls.letterSpacing = '0px'

  ctx.fillStyle = c
  ctx.font = F(900, 64)
  ctx.fillText(`${v.roe >= 0 ? '+' : ''}${(Number.isFinite(v.roe) ? v.roe : 0).toFixed(2)}%`, 40, 314)

  // --- Detail ---
  ctx.fillStyle = DIM
  ctx.font = F(400, 11)
  ctx.fillText(`Entry: ${fmtPrice(v.entry)}  |  ${v.whenLabel === 'Ditutup' ? 'Exit' : 'Mark'}: ${fmtPrice(v.exit)}  |  PnL: ${pnlText.value}`, 40, 344)
  ctx.fillText(`${v.whenLabel}: ${v.when}`, 40, 362)

  // --- Footer ---
  ctx.strokeStyle = '#222222'
  ctx.beginPath()
  ctx.moveTo(40, 512)
  ctx.lineTo(W - 40, 512)
  ctx.stroke()
  ls.letterSpacing = '2px'
  ctx.fillStyle = GOLD
  ctx.font = F(800, 14)
  ctx.textAlign = 'center'
  ctx.fillText('TRADED ON PAPERTRADE PRO', W / 2, 552)
  ls.letterSpacing = '0px'
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}

async function exportPng() {
  const v = t.value
  if (!v) {
    ui.err('Belum ada PnL buat diexport — buka posisi atau share dari Riwayat Posisi.')
    return
  }
  exporting.value = true
  try {
    const url = await renderPnlPng(v)
    const link = document.createElement('a')
    link.download = `PAPERTRADE_${v.symbol}_${v.side}.png`
    link.href = url
    link.click()
    ui.ok('PnL Card diexport, siang-siangin ke media sosial!')
  } catch {
    ui.err('Gagal render gambar — pakai tombol Salin aja dulu, Boss.')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div>
    <div class="panel-header"><span>PNL CARD</span><span class="text-gold">SHARE</span></div>
    <div class="p-3">
      <ClientOnly>
        <!-- Preview card: kelihatan langsung di panel -->
        <div
          v-if="t"
          class="rounded-lg border bg-bg p-3"
          :style="{ borderColor: pnlClass + '55' }"
        >
          <div class="flex justify-between items-center">
            <span class="text-[10px] font-black tracking-widest text-gold">PAPERTRADE</span>
            <span
              class="text-[9px] font-bold px-1.5 py-0.5 rounded border num"
              :style="{ color: pnlClass, borderColor: pnlClass }"
            >{{ t.whenLabel }}</span>
          </div>
          <div class="flex justify-between items-end mt-2">
            <span class="font-black text-base">{{ t.symbol }}</span>
            <span
              class="text-[10px] font-bold px-1.5 py-0.5 border num"
              :style="{ color: pnlClass, borderColor: pnlClass }"
            >{{ t.side }} {{ t.lev }}X</span>
          </div>
          <div class="num font-black text-3xl mt-2" :style="{ color: pnlClass }">{{ roeText }}%</div>
          <div class="text-[10px] text-sub mt-0.5">ROE — PnL <span class="num" :style="{ color: pnlClass }">{{ pnlText }}</span></div>
          <div class="text-[10px] text-sub num mt-1">
            {{ fmtPrice(t.entry) }} <UiIcon name="arrow-right" :size="10" class="shrink-0" /> {{ fmtPrice(t.exit) }} · {{ t.whenLabel }} {{ t.when }}
          </div>
          <div class="text-center text-[9px] font-bold tracking-widest text-gold mt-2 pt-2 border-t border-borderp/60">
            TRADED ON PAPERTRADE PRO
          </div>
        </div>
        <p v-else class="text-[10px] text-sub text-center py-3 leading-relaxed">
          Belum ada PnL buat di-share.<br>
          Buka posisi, atau klik ikon kamera di Riwayat Posisi buat pilih trade selesai.
        </p>
        <template #fallback>
          <p class="text-[10px] text-sub text-center py-3">Memuat PnL Card...</p>
        </template>
      </ClientOnly>

      <div class="flex gap-2 mt-3">
        <Button variant="gold" size="sm" class="flex-1" :disabled="!t || exporting" @click="exportPng">
          <template v-if="exporting">Merender...</template>
          <template v-else><span class="inline-flex items-center gap-1.5"><UiIcon name="camera" :size="12" />Export PNG</span></template>
        </Button>
        <Button variant="ghost" size="sm" :disabled="!t" @click="copyText">
          <span class="inline-flex items-center gap-1.5"><UiIcon name="link" :size="12" />Salin</span>
        </Button>
      </div>
    </div>
  </div>
</template>
