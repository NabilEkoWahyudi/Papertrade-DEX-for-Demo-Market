import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl
} from '@solana/web3.js'
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token'
import bs58 from 'bs58'
import 'dotenv/config'

// --- Isi object di sini ---
const MINT_ADDRESS = '9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d'
const DESTINATION_WALLET = '8NB1UinedATS55odCytXV8WeheK5RSEkS2PebJfhpjtQ'
const TRANSFER_AMOUNT = 50_000

async function main() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY!))
  const mintPublicKey = new PublicKey(MINT_ADDRESS)
  const destPublicKey = new PublicKey(DESTINATION_WALLET)

  console.log(`Mengirim ${TRANSFER_AMOUNT} $PAPER...`)

  const source = await getOrCreateAssociatedTokenAccount(connection, payer, mintPublicKey, payer.publicKey)
  const dest = await getOrCreateAssociatedTokenAccount(connection, payer, mintPublicKey, destPublicKey)

  const signature = await transfer(
    connection,
    payer,
    source.address,
    dest.address,
    payer.publicKey,
    TRANSFER_AMOUNT * 1_000_000_000
  )

  console.log('Terkirim!')
  console.log(`Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
}

main().catch((e) => console.error('Gagal transfer:', e))
