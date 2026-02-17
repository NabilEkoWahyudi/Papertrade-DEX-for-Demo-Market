import { 
    Connection, 
    Keypair, 
    PublicKey, 
    clusterApiUrl 
} from "@solana/web3.js";
import { 
    getOrCreateAssociatedTokenAccount, 
    transfer 
} from "@solana/spl-token";
import bs58 from "bs58";
import "dotenv/config";

// --- KONFIGURASI ---
// 1. Masukin Address Token $PAPER (Anak Pertama/Official) Lu Disini:
const MINT_ADDRESS = "9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d"; 

// 2. Mau kirim ke siapa? (Masukin Alamat Wallet Teman atau Wallet Kedua Lu)
const DESTINATION_WALLET = "8NB1UinedATS55odCytXV8WeheK5RSEkS2PebJfhpjtQ"; 

// 3. Jumlah yang mau dikirim
const TRANSFER_AMOUNT = 50000; 

(async () => {
    try {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY!));
        const mintPublicKey = new PublicKey(MINT_ADDRESS);
        const destPublicKey = new PublicKey(DESTINATION_WALLET);

        console.log(`💸 OTW Kirim ${TRANSFER_AMOUNT} $PAPER...`);

        // 1. Cek Rekening Pengirim (Kita)
        const sourceAccount = await getOrCreateAssociatedTokenAccount(
            connection, payer, mintPublicKey, payer.publicKey
        );

        // 2. Cek Rekening Penerima (Otomatis dibikinin kalau belum ada)
        const destAccount = await getOrCreateAssociatedTokenAccount(
            connection, payer, mintPublicKey, destPublicKey
        );

        // 3. Transfer
        const signature = await transfer(
            connection,
            payer,
            sourceAccount.address,
            destAccount.address,
            payer.publicKey,
            TRANSFER_AMOUNT * 1_000_000_000 // Jumlah * Desimal 9
        );

        console.log(`✅ SUKSES! Duit udah meluncur.`);
        console.log(`🔗 Cek Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

    } catch (error) {
        console.error("❌ Gagal Transfer:", error);
    }
})();