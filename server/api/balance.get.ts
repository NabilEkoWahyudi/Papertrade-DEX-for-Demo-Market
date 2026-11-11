import { isSolanaAddress } from '../utils/binance'
import { readPaperBalance } from '../utils/solana'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const wallet = String(query.wallet ?? '')

  if (!isSolanaAddress(wallet)) {
    return { balance: 0 }
  }

  const config = useRuntimeConfig(event)
  try {
    const balance = await readPaperBalance(wallet, {
      privateKey: String(config.solanaPrivateKey || ''),
      cluster: String(config.solanaCluster || 'devnet'),
      mint: String(config.paperMint)
    })
    return { balance }
  } catch {
    return { balance: 0 }
  }
})
