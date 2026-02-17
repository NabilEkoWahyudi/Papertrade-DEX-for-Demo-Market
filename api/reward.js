import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import bs58 from "bs58";

// Alamat Token $PAPER yang udah lu bikin tadi (Copy dari terminal setelah jalanin create_token)
const PAPER_TOKEN_MINT = new PublicKey("MASUKAN_ALAMAT_TOKEN_DISINI");

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userWalletAddress, amount } = req.body;

    try {
        // Setup Koneksi
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const sender = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY));

        const userPublicKey = new PublicKey(userWalletAddress);

        // 1. Cari/Bikin akun token buat si User (biar dia bisa terima)
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            sender,
            PAPER_TOKEN_MINT,
            userPublicKey
        );

        // 2. Cari akun token Dev (sumber dana)
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            sender,
            PAPER_TOKEN_MINT,
            sender.publicKey
        );

        // 3. Transfer Token
        // amount * 10^9 (desimal)
        const tx = await transfer(
            connection,
            sender,
            fromTokenAccount.address,
            toTokenAccount.address,
            sender.publicKey,
            amount * 1000000000
        );

        return res.status(200).json({ success: true, txSignature: tx });

    } catch (error) {
        console.error("Transfer Gagal:", error);
        return res.status(500).json({ error: "Gagal kirim reward." });
    }
}