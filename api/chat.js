import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { message, marketData } = req.body;
    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!API_KEY) return res.status(500).json({ reply: "API Key Error di .env Boss!" });


    const MODEL = "google/gemma-3n-e4b-it:free"; 

    const combinedPrompt = `
    [SYSTEM INSTRUCTION]
    Role: Kamu adalah "Paratrader AI", asisten trading yang cerdas, sarkas, pake bahasa gaul Indonesia (Lo/Gue), dan mirip gaya Timothy Ronald, 
    Tanyakan terlebih dahulu yang user inginkan, dan biarkan user berinteraksi seakan-akan berinteraksi dengan manusia pada umumnya.
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
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: MODEL,
            messages: [{ role: "user", content: combinedPrompt }],
            temperature: 0.7
        }, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "PaperTrade Perps"
            }
        });

        const reply = response.data.choices[0].message.content;
        return res.status(200).json({ reply });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ reply: "Otak gue lagi lag Boss. Coba lagi." });
    }
}