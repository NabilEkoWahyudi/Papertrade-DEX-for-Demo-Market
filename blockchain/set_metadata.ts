import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { updateV1, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import "dotenv/config";

// --- KONFIGURASI ---
const MINT_ADDRESS = "9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d"; 
// Pake link RAW yang gak pake kode hash panjang biar kedepannya gampang:
const METADATA_URI = "https://gist.githubusercontent.com/NabilEkoWahyudi/a50e6cd372bc66960067e7a6bea039a6/raw/metadata.json"; 

(async () => {
    try {
        console.log("🔄 Sedang mengganti baju (Update) metadata...");

        const umi = createUmi('https://api.devnet.solana.com');
        const secretKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY!);
        const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
        const signer = createSignerFromKeypair(umi, keypair);
        umi.use(signerIdentity(signer));

        const mint = publicKey(MINT_ADDRESS);

        // 1. Ambil data metadata yang sekarang ada di blockchain
        const initialMetadata = await fetchMetadataFromSeeds(umi, { mint });

        // 2. Kirim perintah UPDATE (Bukan Create)
        await updateV1(umi, {
            mint,
            authority: signer,
            data: {
                ...initialMetadata,
                name: "PaperTrade Token",
                symbol: "PAPER",
                uri: METADATA_URI, // Ini link baru lu yang udah ada gambarnya
                sellerFeeBasisPoints: 0,
            },
        }).sendAndConfirm(umi);

        console.log("✅ UPDATE SUKSES! Gambar baru lu udah didaftarin ke blockchain.");
        console.log("⏳ Kasih waktu 5 menit buat wallet (Phantom) nangkep perubahannya.");

    } catch (error) {
        console.error("❌ Gagal update:", error);
    }
})();