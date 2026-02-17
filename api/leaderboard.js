// Simpan di: api/leaderboard.js
export default function handler(req, res) {
    // Logan Paul resmi di-kick!
    // Data ini nanti ditarik dari database asli.
    const topDegens = [
        { wallet: "E4QS...BH7F", profit: 25500 },
        { wallet: "HUTA...TRAD", profit: 12800 },
        { wallet: "D3GE...N69X", profit: 7400 }
    ];
    
    return res.status(200).json(topDegens);
}