import { isSolanaAddress } from '../utils/binance'
import { transferPaper } from '../utils/solana'
import { dbRead, dbMutate } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readJsonBody(event)
  const userWallet = String(body.userWallet ?? '')

  if (!isSolanaAddress(userWallet)) {
    throw createError({
      statusCode: 400,
      data: { message: 'Alamat wallet tidak valid!' }
    })
  }

  enforceRate(event, 'faucet', 30, 24 * 60 * 60 * 1000)

  const config = useRuntimeConfig(event)
  const cluster = String(config.solanaCluster || 'devnet')
  const mint = String(config.paperMint)
  const privateKey = String(config.solanaPrivateKey || '')
  const amount = Number(config.faucetAmount) || 1000
  const cooldownHours = Number(config.faucetCooldownHours) || 24

  // SEC: cooldown dicek SERVER-SIDE (bukan localStorage) — nggak bisa di-bypass.
  const now = Date.now()
  const claims = await dbRead<Record<string, number>>('claims', {})
  const last = claims[userWallet] ?? 0
  const nextClaimAt = last + cooldownHours * 60 * 60 * 1000
  if (now < nextClaimAt) {
    throw createError({
      statusCode: 429,
      data: { message: 'Faucet masih dipakai! Coba lagi besok.', nextClaimAt }
    })
  }

  try {
    const sig = await transferPaper(userWallet, amount, { privateKey, cluster, mint })
    await dbMutate<Record<string, number>>('claims', (cur) => ({
      ...((cur as Record<string, number>) ?? {}),
      [userWallet]: now
    }))
    return { success: true, tx: sig, nextClaimAt: now + cooldownHours * 60 * 60 * 1000 }
  } catch (e) {
    console.error('Faucet transfer gagal:', e)
    throw createError({
      statusCode: 500,
      data: { message: e instanceof Error ? `Faucet lagi kering: ${e.message}` : 'Faucet lagi kering Boss!' }
    })
  }
})
