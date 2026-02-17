import { Connection, PublicKey, clusterApiUrl, Keypair } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import bs58 from "bs58";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send("Method not allowed");
    
    const { userWallet } = req.body;
    const MINT = "9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d"; //
    
    try {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_PRIVATE_KEY));

        console.log(`💸 Faucet: Mengirim 1000 $PAPER ke ${userWallet}`);

        const userAta = await getOrCreateAssociatedTokenAccount(connection, payer, new PublicKey(MINT), new PublicKey(userWallet));
        const sourceAta = await getOrCreateAssociatedTokenAccount(connection, payer, new PublicKey(MINT), payer.publicKey);

        const tx = await transfer(connection, payer, sourceAta.address, userAta.address, payer.publicKey, 1000 * 10**9); // Sesuaikan desimal token lu

        return res.status(200).json({ success: true, tx });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: "Faucet lagi kering Boss!" });
    }
}