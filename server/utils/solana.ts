import bs58 from 'bs58'

type Cluster = 'devnet' | 'testnet' | 'mainnet-beta'

export interface SolanaOptions {
  privateKey: string
  cluster: string
  mint: string
}

/** PAPER pakai 9 desimal (standar). */
const DECIMALS = 9

const clusterUrl = (c: string): string => {
  const cl = (['devnet', 'testnet', 'mainnet-beta'] as string[]).includes(c) ? (c as Cluster) : 'devnet'
  return `https://api.${cl === 'mainnet-beta' ? 'mainnet-beta' : cl}.solana.com`
}

export function readPaperBalance(address: string, opts: SolanaOptions): Promise<number> {
  return (async () => {
    const { Connection, PublicKey, clusterApiUrl } = await import('@solana/web3.js')
    const conn = new Connection(clusterApiUrl((opts.cluster as Cluster) || 'devnet'), 'confirmed')
    const accounts = await conn.getParsedTokenAccountsByOwner(
      new PublicKey(address),
      { mint: new PublicKey(opts.mint) }
    )
    let total = 0
    for (const { account } of accounts.value) {
      const parsed = (account.data as unknown as { parsed: { info: { tokenAmount: { uiAmount: number } } } }).parsed
      total += parsed?.info?.tokenAmount?.uiAmount ?? 0
    }
    return total
  })()
}

/** Kirim $PAPER dari wallet dev ke user. Return signature tx. */
export async function transferPaper(
  destination: string,
  amountTokens: number,
  opts: SolanaOptions
): Promise<string> {
  if (!opts.privateKey) throw new Error('SOLANA_PRIVATE_KEY belum diset di env server')
  const [{ Connection, Keypair, PublicKey, clusterApiUrl }, spl, bs58mod] = await Promise.all([
    import('@solana/web3.js'),
    import('@solana/spl-token'),
    import('bs58')
  ])
  const b58 = (bs58mod.default ?? bs58) as typeof bs58

  const connection = new Connection(clusterUrl(opts.cluster), 'confirmed')
  const payer = Keypair.fromSecretKey(b58.decode(opts.privateKey))
  const mint = new PublicKey(opts.mint)

  const source = await spl.getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey)
  const dest = await spl.getOrCreateAssociatedTokenAccount(connection, payer, mint, new PublicKey(destination))

  const sig = await spl.transfer(
    connection,
    payer,
    source.address,
    dest.address,
    payer.publicKey,
    Math.floor(amountTokens * 10 ** DECIMALS)
  )
  return sig
}
