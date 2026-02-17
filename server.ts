import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import bs58 from "bs58";
import "dotenv/config";
import path from 'path';

// --- KONFIGURASI ---
const PORT = 3000;
const MINT_ADDRESS = "9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d"; // <-- Pastikan ini Alamat Token (Anak Pertama)
const REWARD_AMOUNT = 100; // Hadiah token setiap kali menang

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Menyajikan file HTML frontend

// --- SETUP SOLANA ---
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
// Load Private Key Dev
const secretKeyString = process.env.SOLANA_PRIVATE_KEY;
if (!secretKeyString) throw new Error("Private Key ga ada di .env!");
const payer = Keypair.fromSecretKey(bs58.decode(secretKeyString));
const mintPublicKey = new PublicKey(MINT_ADDRESS);

console.log(`🤖 Server berjalan dengan Wallet Dev: ${payer.publicKey.toBase58()}`);

// --- API ENDPOINTS ---

// 1. Endpoint buat Claim Reward (Dipanggil saat user Profit)
// GANTI endpoint claim-reward dengan Logic Validasi ini:

app.post('/api/claim-reward', async (req, res) => {
    const { userWallet, symbol, entryPrice, side } = req.body; // Frontend wajib kirim data posisi

    if (!userWallet || !symbol || !entryPrice || !side) {
        return res.status(400).json({ success: false, message: "Data trading tidak lengkap!" });
    }

    try {
        // 1. SECURITY CHECK: Server cek harga Real-Time ke Binance
        console.log(`🛡️ Memverifikasi kemenangan user di ${symbol}...`);
        const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        const priceData = await priceRes.json();
        const currentPrice = parseFloat(priceData.price);

        // 2. Hitung Ulang PnL di Server
        let isWin = false;
        if (side === 'LONG' && currentPrice > entryPrice) isWin = true;
        else if (side === 'SHORT' && currentPrice < entryPrice) isWin = true;

        if (!isWin) {
            console.warn(`🚨 CHEATER DETECTED! User claim menang padahal harga ${symbol} lagi ${currentPrice} (Entry: ${entryPrice})`);
            return res.status(403).json({ success: false, message: "Server says: Lu Loss boss, jangan nipu!" });
        }

        // 3. Kalau Lolos Validasi, Baru Kirim Token Reward
        console.log(`✅ Validasi Sukses! Mengirim ${REWARD_AMOUNT} $PAPER...`);
        
        // ... (Masukkan Kode Transfer Solana Token di sini seperti sebelumnya) ...
        // ... (getOrCreateAssociatedTokenAccount -> transfer) ...

        // (Simulasi respon sukses biar gak error kodingan di atas)
        res.json({ success: true, tx: "dummy_tx_hash_validated", message: "Reward Valid & Terkirim!" });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Gagal validasi." });
    }
});

// 2. Endpoint Chat AI 
// --- UPDATE ENDPOINT CHAT DI server.ts ---

// --- UPDATE ENDPOINT CHAT DI server.ts ---
// --- UPDATE ENDPOINT CHAT DI server.ts (SINKRON DENGAN chat.js) ---
app.post('/api/chat', async (req, res) => {
    const { message, marketData } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) return res.json({ reply: "⚠️ API Key belum dipasang di .env boss!" });

    // SINKRONISASI PROMPT DARI chat.js
    const combinedPrompt = `
    [SYSTEM INSTRUCTION]
    Role: Kamu adalah "Paratrader AI", asisten trading yang cerdas, sarkas, pake bahasa gaul Indonesia (Lo/Gue), dan mirip gaya Timothy Ronald.
    Context: Data Market saat ini: ${marketData}.

    ATURAN FORMATTING (PENTING):
    - JANGAN GUNAKAN MARKDOWN seperti tanda bintang (**bold**) atau underscore (__).
    - Gunakan Huruf KAPITAL untuk penekanan.
    - Gunakan Emoji untuk list agar rapi.
    - Gunakan Baris Baru (Enter) untuk memisahkan poin.

    TUGAS:
    Jika user minta saran/sinyal, berikan setup dalam format ini:

    📋 SETUP PARATRADER:
    
    1. POSISI: [LONG / SHORT]
    2. ENTRY: [Harga]
    3. STOP LOSS: [Harga]
    4. TAKE PROFIT: [Harga]
    5. LEVERAGE: [Saran]
    6. ALASAN: [Analisa singkat]
    
ATURAN STRATEGI (WAJIB):
- HITUNG Risk-to-Reward Ratio (RRR) minimal 1:1.5. 
- Jika SL berjarak 100 poin, maka TP WAJIB minimal 150 poin dari Entry.
- JANGAN kasih sinyal ampas dengan RRR di bawah 1.5.


    Jawablah dengan tegas.
    [/SYSTEM INSTRUCTION]

    User: ${message}
    `;

    try {
        console.log("🧠 Paratrader AI (Gemma 3) sedang menganalisis sesuai role...");
        
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "PaperTrade Perps"
            },
            body: JSON.stringify({
                model: "google/gemma-3n-e4b-it:free", 
                messages: [
                    { 
                        role: "user", 
                        content: combinedPrompt // Masukkan prompt instruksi lengkap di sini
                    }
                ],
                temperature: 0.7,
                max_tokens: 400
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Provider Error:", data.error);
            return res.json({ reply: `Duh, OpenRouter lagi error Boss: ${data.error.message}` });
        }

        const aiReply = data.choices?.[0]?.message?.content || "AI lagi bengong Boss.";
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ reply: "Server gagal connect ke AI. Cek koneksi lu!" });
    }
});

// --- TAMBAHAN API DI server.ts ---

// --- TRACKER PROFIT ASLI (Leaderboard Real-Time) ---
// Ini adalah "buku catatan" sementara di RAM server
let realLeaderboard: Record<string, number> = {}; 

// 1. Update Endpoint Claim Reward buat nyatet profit
app.post('/api/claim-reward', async (req, res) => {
    const { userWallet, symbol, entryPrice, side } = req.body;
    
    // ... (Logic validasi cuan lu tetep ada di sini) ...

    try {
        // JIKA LOLOS VALIDASI CUAN:
        const profitPoin = 100; // Misal setiap menang dapet 100 poin profit
        
        // Catat ke Leaderboard Asli
        if (!realLeaderboard[userWallet]) {
            realLeaderboard[userWallet] = 0;
        }
        realLeaderboard[userWallet] += profitPoin;

        console.log(`🏆 Leaderboard Updated: ${userWallet} sekarang punya ${realLeaderboard[userWallet]} profit!`);

        res.json({ 
            success: true, 
            tx: "tx_hash_blockchain_asli", 
            message: "Cuan tercatat di Leaderboard!",
            currentProfit: realLeaderboard[userWallet]
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Gagal nyatet profit." });
    }
});

// 2. Endpoint Leaderboard (Narik data dari catatan asli)
app.get('/api/leaderboard', (req, res) => {
    // Ubah data object jadi array, lalu urutkan dari yang paling kaya
    const sortedData = Object.entries(realLeaderboard)
        .map(([wallet, profit]) => ({
            wallet: wallet.slice(0,4) + "..." + wallet.slice(-4), // Singkat biar rapi
            profit: profit
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10); // Ambil Top 10 aja

    res.json(sortedData);
});
        
// Jalankan Server
app.listen(PORT, () => {
    console.log(`🚀 Server PaperTrade siap di http://localhost:${PORT}`);
});