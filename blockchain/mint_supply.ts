import { 
    Connection, 
    Keypair, 
    PublicKey, 
    clusterApiUrl 
} from "@solana/web3.js";
import { 
    mintTo, 
    getOrCreateAssociatedTokenAccount 
} from "@solana/spl-token";
import bs58 from "bs58";
import "dotenv/config";

// --- KONFIGURASI ---
// PENTING: Masukkan Address Token $PAPER yang udah lu buat kemarin di sini!
const MINT_ADDRESS = "9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d"; 

// Jumlah yang mau dicetak (Misal: 1 Juta Token)
const AMOUNT_TO_MINT = 1_000_000; 

(async () => {
    try {
        // 1. Konek ke Solana DEVNET
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // 2. Ambil Wallet Dev (Authority) dari .env
        const privateKey = process.env.SOLANA_PRIVATE_KEY;
        if (!privateKey) throw new Error("Private Key ga ada di .env Boss!");
        
        const payer = Keypair.fromSecretKey(bs58.decode(privateKey));
        const mintPublicKey = new PublicKey(MINT_ADDRESS);

        console.log("🔑 Authority Wallet:", payer.publicKey.toBase58());
        console.log("sedang mencetak supply tambahan...");

        // 3. Cari Akun Token tujuan (Wallet Payer/Dev sendiri)
        // Kita cetak ke dompet sendiri dulu, baru nanti didistribusiin
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            payer,
            mintPublicKey,
            payer.publicKey
        );

        // 4. Eksekusi Cetak Duit (Minting)
        // Ingat: Solana pake 9 desimal. Jadi 1 token = 1.000.000.000 satuan kecil (Lamport)
        const signature = await mintTo(
            connection,
            payer,              // Yang bayar gas fee
            mintPublicKey,      // Token apa yang mau dicetak
            tokenAccount.address, // Masuk ke akun mana
            payer,              // Authority (Yang punya hak cetak)
            AMOUNT_TO_MINT * 1_000_000_000 // Jumlah * Desimal
        );

        console.log(`✅ SUKSES! Mencetak ${AMOUNT_TO_MINT} $PAPER`);
        console.log(`📜 Tx Signature: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    } catch (error) {
        console.error("❌ Gagal Minting:", error);
    }
})();