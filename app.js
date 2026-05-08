// --- CORE FINANÇAS v7.84 ---
const K = k => 'fin6_' + k, gl = k => { try { const v = localStorage.getItem(K(k)); return v ? JSON.parse(v) : null } catch { return null } }, gs = (k, v) => localStorage.setItem(K(k), JSON.stringify(v));

let cfg = gl('cfg') || { shUrl: typeof APP_SCRIPT_URL !== 'undefined' ? APP_SCRIPT_URL : '', pin: '8888' };
let cats = gl('cats') || [];
let txs = gl('txs') || [];
let pinInput = "";

// --- CONTROLE SIDEBAR ---
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('collapsed');
    const labels = document.querySelectorAll('.label');
    labels.forEach(l => l.style.display = sb.classList.contains('collapsed') ? 'none' : 'inline');
}

// --- PIN LOGIC ---
function init() {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'pin-btn';
        b.innerText = k;
        b.onclick = () => k === 'C' ? (pinInput = "", document.getElementById('pin-dots').innerText = "") : pressPin(k);
        kb.appendChild(b);
    });
}

function pressPin(n) {
    if (pinInput.length < 4) {
        pinInput += n;
        document.getElementById('pin-dots').innerText = "•".repeat(pinInput.length);
    }
    if (pinInput.length === 4) {
        if (pinInput === cfg.pin) {
            document.getElementById('lock').style.display = 'none';
            document.getElementById('sidebar').style.display = 'flex';
            document.getElementById('main').style.display = 'flex';
            nav('home');
        } else {
            alert("PIN Incorreto!");
            pinInput = "";
            document.getElementById('pin-dots').innerText = "";
        }
    }
}

// --- NAVEGAÇÃO ---
function nav(view, el) {
    if (el) {
        document.querySelectorAll('.side-item').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    const content = document.getElementById('app-content');
    
    if (view === 'home') {
        content.innerHTML = `
            <h2>Dashboard</h2>
            <div style="background:var(--bg2); padding:25px; border-radius:15px; margin-top:20px">
                <p style="color:var(--txt2)">Saldo Atual</p>
                <h1 style="color:var(--accent)" id="saldo-total">R$ 0,00</h1>
            </div>
        `;
        renderSaldo();
    } else if (view === 'config') {
        content.innerHTML = `
            <h2>Sincronização</h2>
            <div style="background:var(--bg2); padding:20px; border-radius:12px; margin-top:20px">
                <p style="margin-bottom:10px">Status da Planilha: <b>${cfg.shUrl ? 'Conectado' : 'Sem URL'}</b></p>
                <button onclick="pullData()" id="btn-sync" style="width:100%; padding:15px; background:var(--accent); color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer">
                    PUXAR DADOS DA PLANILHA
                </button>
            </div>
        `;
    }
}

// --- SINCRONIZAÇÃO (PUXAR DADOS) ---
async function pullData() {
    const btn = document.getElementById('btn-sync');
    if (!cfg.shUrl) return alert("Configure a URL no config.js primeiro!");
    
    btn.innerText = "SINCRONIZANDO...";
    btn.style.opacity = "0.5";
    
    try {
        const response = await fetch(`${cfg.shUrl}?action=getAppData`);
        const res = await response.json();
        
        if (res.ok && res.payload) {
            cats = res.payload.cats || cats;
            txs = res.payload.txs || txs;
            gs('cats', cats); gs('txs', txs);
            alert("Sincronizado com sucesso!");
            nav('config'); // Refresh na tela
        }
    } catch (e) {
        alert("Erro ao conectar na Planilha Google. Verifique a URL.");
    } finally {
        btn.innerText = "PUXAR DADOS DA PLANILHA";
        btn.style.opacity = "1";
    }
}

function renderSaldo() {
    const total = txs.reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);
    const el = document.getElementById('saldo-total');
    if (el) el.innerText = total.toLocaleString('pt-br', {style:'currency', currency:'BRL'});
}

window.onload = init;
