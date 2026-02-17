# 🐂 PAPERTRADE DEX - DEMO MARKET

Terminal trading simulasi (DEX Demo) yang dibangun di atas ekosistem **Solana Devnet**. Project ini dirancang khusus untuk para trader yang ingin melatih trading derivatif (Perps) menggunakan data pasar asli namun dengan risiko nol, dilengkapi dengan pengalaman antarmuka (UI) yang nyaman dan asisten sinyal berbasis AI.

## ✨ Fitur Utama

Terminal ini bukan sekadar simulasi biasa; gue udah nanam beberapa fitur profesional tapi tetep simpel:

- **AI Paratrader (All-Seeing AI)**: AI tidak lagi buta harga karena sudah terintegrasi langsung dengan chart untuk membaca *current price* secara real-time. Lu bisa nanya sinyal, dan AI bakal kasih saran Entry, TP, dan SL yang akurat sesuai harga detik itu juga.
- **Gacor Chat UI**: Antarmuka obrolan dengan AI dibuat sangat familiar, mirip aplikasi pesan instan lengkap dengan gelembung pesan yang interaktif.
- **Token SPL $PAPER**: Menggunakan mata uang utama platform berupa token SPL $PAPER yang sudah live di Solana Devnet.
    * **Mint Address**: `9xnPMY8wRSGBQf212SSasSJwkTqb9Fi3GrWb32Lf9W4d`.
- **Layout Rapat (Zero-Gap)**: Menggunakan pengaturan CSS Flexbox yang presisi untuk membuang semua celah kosong (gap) hitam di bawah chart, memberikan tampilan terminal yang padat dan fokus pada data.
- **Smart Decimal Input**: Lu bisa input angka modal dengan koma (contoh: `0,05`) tanpa perlu takut angka "0" di depan terhapus otomatis. Sistem otomatis mengubah koma menjadi titik untuk perhitungan matematika di belakang layar.
- **Ironclad Faucet**: Sistem faucet 1.000 $PAPER harian yang terkunci secara permanen di memori browser (Persistence Lock). Cooldown 24 jam tidak akan reset meskipun halaman di-refresh.
- **Pro Analysis Sidebar**: Sidebar alat gambar TradingView (garis tren, Fibonacci, indikator) sudah aktif untuk memudahkan analisa teknikal mendalam.
- **Clean PnL Card**: Export hasil profit lu menjadi gambar kartu PnL yang bersih untuk dipamerkan ke media sosial. Angka persentase (ROE) dipastikan gerak real-time dan bebas dari bug "NaN%".

## 🚀 Teknologi yang Dipakai

Project ini menggabungkan kecepatan blockchain Solana dengan kemudahan web modern:

- **Blockchain**: Solana Web3.js & SPL-Token Library.
- **Market Data**: Binance WebSocket API untuk tarikan harga live yang sangat cepat.
- **Charts**: TradingView Technical Analysis Widget.
- **UI Engine**: Modern HTML5 & CSS3 dengan font Inter & JetBrains Mono.
- **Backend**: Vercel Serverless Functions untuk menangani API Faucet dan Balance.

## 🛠️ Cara Setup & Instalasi

Ikuti langkah simpel ini buat jalanin terminal di laptop:

1. **Clone Repository**:
   ```bash
   git clone https://github.com/NabilEkoWahyudi/Papertrade-DEX-for-Demo-Market.git
   cd Papertrade-DEX-for-Demo-Market

2. **Siapkan File Lingkungan (.env)**:
Buat file baru bernama `.env` di folder utama dan isi dengan kunci rahasia lu agar fitur AI dan Faucet bisa berjalan (Data ini aman dan tidak akan ter-push ke GitHub karena sudah dilindungi oleh `.gitignore`):

```bash
OPENROUTER_API_KEY=isi_api_key_ai
SOLANA_PRIVATE_KEY=isi_private_key_wallet_dev

```

3. **Jalankan Secara Lokal**:
Gunakan Vercel CLI untuk menjalankan project di browser laptop lu:

```bash
vercel dev

```
