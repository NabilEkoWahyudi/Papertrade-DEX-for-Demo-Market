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

async function main() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
  const secretKey = process.env.SOLANA_PRIVATE_KEY
  if (!secretKey) throw new Error('Private key tidak ada di .env')
  const payer = Keypair.fromSecretKey(bs58.decode(secretKey))

  console.log('Connecting ke Solana Devnet sebagai', payer.publicKey.toBase58())

  const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 9)

  console.log('Token $PAPER dibuat!')
  console.log('Mint Address:', mint.toBase58())

  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey)
  console.log('wallet Token Account:', tokenAccount.address.toBase58())

  await mintTo(connection, payer, mint, tokenAccount.address, payer, 1_000_000 * 1_000_000_000)
  console.log('Mint 1.000.000 $PAPER ke wallet sukses!')
}

main().catch((e) => console.error('Create token:', e))
