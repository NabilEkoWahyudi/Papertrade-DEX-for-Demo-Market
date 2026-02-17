import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export default async function handler(req, res) {
    const { wallet } = req.query;
    const MINT = "9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d";
    const connection = new Connection(clusterApiUrl("devnet"));
    try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), { mint: new PublicKey(MINT) });
        const balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
        res.status(200).json({ balance });
    } catch (e) { res.status(200).json({ balance: 0 }); }
}