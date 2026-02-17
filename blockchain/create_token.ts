import { 
    Connection, 
    Keypair, 
    clusterApiUrl 
} from "@solana/web3.js";
import { 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo 
} from "@solana/spl-token";
import bs58 from "bs58";
import "dotenv/config";

(async () => {
    // 1. Konek ke Solana DEVNET (Gratis)
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
    // 2. Ambil Wallet Dev dari .env
    const secretKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY!);
    const payer = Keypair.fromSecretKey(secretKey);

    console.log("🚀 Menghubungkan ke Solana sebagai:", payer.publicKey.toBase58());

    // 3. Bikin Token Baru ($PAPER)
    // Decimals 9 = Standar Solana (seperti SOL/USDC)
    const mint = await createMint(
        connection,
        payer,              // Yang bayar fee (murah banget)
        payer.publicKey,    // Mint Authority (Yang boleh cetak duit)
        payer.publicKey,    // Freeze Authority (Yang boleh bekuin)
        9                   // Desimal
    );

    console.log("✅ Token $PAPER Berhasil Dibuat!");
    console.log("📜 Token Address (Mint ID):", mint.toBase58());

    // 4. Bikin Akun Token buat Diri Sendiri (biar bisa nampung $PAPER)
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );

    console.log("wallet Token Account:", tokenAccount.address.toBase58());

    // 5. Cetak Supply Awal (Misal 1 Juta Token)
    // 1000000 * 10^9 (karena desimal 9)
    await mintTo(
        connection,
        payer,
        mint,
        tokenAccount.address,
        payer,
        1_000_000 * 1000000000 // 1 Juta Token
    );

    console.log("💰 Berhasil Minting 1.000.000 $PAPER ke wallet lu!");
})();