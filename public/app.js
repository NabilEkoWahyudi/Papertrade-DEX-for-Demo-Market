let state = { symbol: 'BTCUSDT', price: 0, side: 'LONG', lev: 20, wallet: null, pos: null };
let ws = null;

// 1. CHART INITIALIZATION (ANTI-GEPENG)
new TradingView.widget({
    "autosize": true,
    "symbol": "BINANCE:BTCUSDT",
    "interval": "1",
    "timezone": "Asia/Jakarta",
    "theme": "dark",
    "style": "1",
    "container_id": "tv_chart_container",
    "height": "100%",
    "library_path": "https://s3.tradingview.com/tv.js"
});

// 2. DATA ENGINE (ORDER BOOK RAAPAT & NO GAP)
function connectWS(sym) {
    if(ws) ws.close();
    ws = new WebSocket(`wss://data-stream.binance.vision/ws/${sym.toLowerCase()}@depth20@100ms`);

    ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if(!data.bids || !data.asks) return;

        state.price = (parseFloat(data.bids[0][0]) + parseFloat(data.asks[0][0])) / 2;
        document.getElementById('currentPriceDisplay').innerText = state.price.toFixed(2);
        
        renderOB(data.asks, data.bids);
        calculatePosition();
        if(state.pos) updatePnL();
    };
}

function renderOB(asks, bids) {
    // ASKS: Sort Descending agar yang termurah di bawah
    const sortedAsks = asks.slice(0, 16).sort((a,b) => parseFloat(b[0]) - parseFloat(a[0]));
    document.getElementById('obAsks').innerHTML = sortedAsks.map(i => {
        const p = parseFloat(i[0]).toFixed(2);
        const q = parseFloat(i[1]).toFixed(3);
        const w = Math.min(parseFloat(i[1])*15, 100);
        return `<div class="ob-row"><div class="ob-bar" style="width:${w}%; background:rgba(246,70,93,0.18)"></div><span class="ask">${p}</span><span style="color:#666">${q}</span></div>`;
    }).join('');

    // BIDS: Sort Descending agar yang termahal di atas
    const sortedBids = bids.slice(0, 16).sort((a,b) => parseFloat(b[0]) - parseFloat(a[0]));
    document.getElementById('obBids').innerHTML = sortedBids.map(i => {
        const p = parseFloat(i[0]).toFixed(2);
        const q = parseFloat(i[1]).toFixed(3);
        const w = Math.min(parseFloat(i[1])*15, 100);
        return `<div class="ob-row"><div class="ob-bar" style="width:${w}%; background:rgba(14,203,129,0.18)"></div><span class="bid">${p}</span><span style="color:#666">${q}</span></div>`;
    }).join('');
}

// 3. REAL 4-WALLET AUTHENTICATION
const walletModal = document.getElementById('walletModal');
function openWalletModal() { walletModal.style.display = "block"; }
function closeWalletModal() { walletModal.style.display = "none"; }

async function connectProvider(providerName) {
    let provider = null;
    
    // DETEKSI MASING-MASING WALLET
    if (providerName === 'phantom') provider = window.solana;
    else if (providerName === 'solflare') provider = window.solflare;
    else if (providerName === 'backpack') provider = window.backpack;
    else if (providerName === 'trust') provider = window.trustwallet?.solana;

    if (!provider) {
        alert(`${providerName} Wallet not found! Install the extension.`);
        return;
    }

    try {
        // AUTHENTIKASI ASLI
        const resp = await provider.connect();
        state.wallet = resp.publicKey.toString();
        
        const btn = document.getElementById('connectWalletBtn');
        btn.innerText = state.wallet.slice(0,4) + '...' + state.wallet.slice(-4);
        btn.style.background = "#1e2329";
        btn.style.border = "1px solid var(--accent)";
        
        updateBtn();
        closeWalletModal();
        console.log("Authenticated with:", state.wallet);
    } catch (err) {
        console.log("Connection rejected by user");
    }
}

// 4. TRADING LOGIC & CALCULATION
function setSide(s) {
    state.side = s;
    document.getElementById('btnLong').className = s==='LONG'?'tab-btn active long':'tab-btn';
    document.getElementById('btnShort').className = s==='SHORT'?'tab-btn active short':'tab-btn';
    updateBtn();
}

function updateLev(v) { 
    state.lev = v; 
    document.getElementById('levDisplay').innerText = v + ' x'; // SPASEE REAL
    calculatePosition(); 
}

function calculatePosition() {
    const col = parseFloat(document.getElementById('collateralInput').value) || 0;
    const size = col * state.lev;
    document.getElementById('calcSize').innerText = '$' + size.toFixed(2);
    if(state.price > 0) {
        let liq = state.side === 'LONG' ? state.price - (state.price/state.lev) : state.price + (state.price/state.lev);
        document.getElementById('calcLiq').innerText = '$' + liq.toFixed(2);
    }
}

function updateBtn() {
    const btn = document.getElementById('submitBtn');
    if(!state.wallet) {
        btn.innerText = "Connect Wallet First";
        btn.disabled = true;
    } else {
        btn.innerText = `OPEN ${state.side} POSITION`;
        btn.disabled = false;
        btn.className = `trade-btn ready ${state.side.toLowerCase()}`;
        btn.onclick = openPosition;
    }
}

function openPosition() {
    const col = parseFloat(document.getElementById('collateralInput').value);
    if(!col) return alert("Enter Collateral!");
    state.pos = { 
        entry: state.price, 
        size: col*state.lev, 
        side: state.side,
        tp: document.getElementById('tpInput').value || '-',
        sl: document.getElementById('slInput').value || '-'
    };
    renderPos();
}

function renderPos() {
    const container = document.getElementById('posContainer');
    if(!state.pos) { container.innerHTML = 'No position found'; return; }
    const p = state.pos;
    container.innerHTML = `
        <div class="pos-card ${p.side}" style="background:#0b0e11; padding:18px; border-left:4px solid ${p.side==='LONG'?'#0ecb81':'#f6465d'}; border-radius:12px; border: 1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <strong style="font-size:14px;">${state.symbol} ${p.side} ${state.lev}x</strong>
                <span id="pnlDisplay" style="font-weight:900; font-family:'Roboto Mono';">$0.00</span>
            </div>
            <div style="font-size:11px; color:var(--sub); line-height:1.6;">
                Entry: ${p.entry.toFixed(2)}<br>
                Take Profit: ${p.tp} | Stop Loss: ${p.sl}
            </div>
            <button onclick="state.pos=null; renderPos()" style="width:100%; margin-top:14px; background:#1e2329; border:1px solid #333; color:#fff; padding:10px; border-radius:8px; cursor:pointer; font-weight:700; font-size:11px;">CLOSE POSITION</button>
        </div>`;
}

function updatePnL() {
    const p = state.pos;
    const pnl = p.side==='LONG' ? (state.price - p.entry)*p.size/p.entry : (p.entry - state.price)*p.size/p.entry;
    const el = document.getElementById('pnlDisplay');
    if(el) {
        el.innerText = (pnl>=0?'+':'') + '$' + pnl.toFixed(2);
        el.style.color = pnl>=0 ? 'var(--green)' : 'var(--red)';
    }
}

// 5. AI CHAT (GOOGLE GEMMA INTEGRATION)
// --- BAGIAN 5: AI CHAT (SINKRONISASI TOTAL) ---
async function sendChat() {
    // 1. Pastikan ID ini sesuai dengan yang ada di index.html lu!
    const input = document.getElementById('chatInput') || document.getElementById('inputChat');
    const box = document.getElementById('chatBox') || document.getElementById('aiMessages');
    
    const msg = input.value.trim();
    if(!msg) return;

    // Tampilkan pesan user di UI
    box.innerHTML += `<div class="msg user" style="margin-bottom:10px; text-align:right; color:#aaa;">${msg}</div>`;
    input.value = '';
    
    // Siapkan wadah buat jawaban AI
    const id = "ai_" + Date.now();
    box.innerHTML += `<div class="msg ai" id="${id}" style="margin-bottom:15px; color:var(--accent);">Analisa bentar...</div>`;
    box.scrollTop = box.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                message: msg, 
                marketData: `${state.symbol} Price $${state.price.toFixed(2)}`
            })
        });
        
        const d = await res.json();
        // Update teks "Analisa bentar..." dengan jawaban asli dari AI
        document.getElementById(id).innerText = d.reply;
    } catch(e) { 
        document.getElementById(id).innerText = "Koneksi ke OpenRouter putus Boss."; 
    }
    box.scrollTop = box.scrollHeight;
}

// 6. UTILS
function handleChatEnter(e) { if(e.key==='Enter') sendChat(); }
function changeAsset() { state.symbol = document.getElementById('assetSelect').value; connectWS(state.symbol); }
function captureCard() {
    if(!state.pos) return alert("Open a position to share your PnL!");
    alert("PnL Card Generated! (Mocked for Demo)");
}
window.onclick = (e) => { if(e.target == modal) closeWalletModal(); }

// INIT
connectWS('BTCUSDT');