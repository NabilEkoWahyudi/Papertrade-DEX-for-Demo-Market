import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { updateV1, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata'
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi'
import bs58 from 'bs58'
import 'dotenv/config'

const MINT_ADDRESS = '9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d'
const METADATA_URI = 'https://gist.githubusercontent.com/NabilEkoWahyudi/a50e6cd372bc66960067e7a6bea039a6/raw/metadata.json'

async function main() {
  console.log('Sedang update metadata...')

  const umi = createUmi('https://api.devnet.solana.com')
  const secretKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY!)
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey)
  const signer = createSignerFromKeypair(umi, keypair)
  umi.use(signerIdentity(signer))

  const mint = publicKey(MINT_ADDRESS)
  const initialMetadata = await fetchMetadataFromSeeds(umi, { mint })

  await updateV1(umi, {
    mint,
    authority: signer,
    data: {
      ...initialMetadata,
      name: 'PaperTrade Token',
      symbol: 'PAPER',
      uri: METADATA_URI,
      sellerFeeBasisPoints: 0
    }
  }).sendAndConfirm(umi)

  console.log('Update metadata sukses! Tunggu ~5 menit biar Phantom realtime.')
}

main().catch((e) => console.error('Gagal update:', e))
