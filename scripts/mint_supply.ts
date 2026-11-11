import {
  Connection,
  Keypair,
  clusterApiUrl
} from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} from '@solana/spl-token'
import bs58 from 'bs58'
import 'dotenv/config'

const MINT_ADDRESS = '9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d'
const AMOUNT_TO_MINT = 1_000_000

async function main() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const privateKey = process.env.SOLANA_PRIVATE_KEY
  if (!privateKey) throw new Error('Private key tidak ada di .env')
  const payer = Keypair.fromSecretKey(bs58.decode(privateKey))
  const mintPublicKey = new PublicKey(MINT_ADDRESS)

  console.log('Authority Wallet:', payer.publicKey.toBase58())
  console.log('Menambah supply...')

  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mintPublicKey, payer.publicKey)
  const signature = await mintTo(
    connection,
    payer,
    mintPublicKey,
    tokenAccount.address,
    payer,
    AMOUNT_TO_MINT * 1_000_000_000
  )

  console.log(`Mencetak ${AMOUNT_TO_MINT} $PAPER`)
  console.log(`Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
}

main().catch((e) => console.error('Gagal mint:', e))
