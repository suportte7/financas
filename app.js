// FINANÇAS PRO v7.84 - LÓGICA SIDEBAR E CORE
const VERSAO_ATUAL = '7.84';
const K = k => 'fin6_' + k;
const gl = k => { try { const v = localStorage.getItem(K(k)); return v ? JSON.parse(v) : null; } catch(e) { return null; } };
const gs = (k, v) => localStorage.setItem(K(k), JSON.stringify(v));

// Estado Global
let cfg = gl('cfg') || { shUrl: typeof APP_SCRIPT_URL !== 'undefined' ? APP_SCRIPT_URL : '', pin: '8888' };
let cats = gl('cats') || [];
let txs = gl('txs') || [];
let pinInput = "";

// --- CONTROLE DO MENU LATERAL (SIDEBAR) ---
let sidebarOpen = true;

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const labels = document.querySelectorAll('.nav-label');
    const btn = document.getElementById('toggle-side');
    
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sb.classList.remove('collapsed');
        btn.style.transform = 'rotate(0deg)';
        labels.forEach(l => l.style.display = 'inline');
    } else {
        sb.classList.add('collapsed');
        btn.style.transform = 'rotate(180deg)';
        labels.forEach(l => l.style.display = 'none');
    }
}

// --- SISTEMA DE BLOQUEIO ---
function pressPin(n) {
    if (pinInput.length < 4) {
        pinInput += n;
        const dots = document.getElementById('pin-dots');
        if (dots) dots.innerText = "•".repeat(pinInput.length);
    }
    
    if (pinInput.length === 4) {
        if (pinInput === cfg.pin) {
            unlock();
        } else {
            alert("PIN Incorreto");
            pinInput = "";
            document.getElementById('pin-dots').innerText = "";
        }
    }
}

function unlock() {
    // 1. Libera a visualização
    document.getElementById('lock').style.display = 'none';
    document.getElementById('sidebar').style.display = 'flex';
    document.getElementById('main-view').style.display = 'flex';
    
    // 2. Carrega a Home
    nav('resumo', document.querySelector('.nav-item'));
    
    // 3. Sincroniza
    if (cfg.shUrl) pullData();
}

// --- NAVEGAÇÃO ---
function nav(view, el) {
    // Marcar botão ativo
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');

    const content = document.getElementById('app-content');
    
    if (view === 'resumo') {
        content.innerHTML = `
            <h1>Dashboard</h1>
            <div style="background:var(--bg2); padding:25px; border-radius:15px; margin-top:20px; border:1px solid rgba(255,255,255,0.05)">
                <span style="color:var(--txt2); font-size:12px; font-weight:bold; letter-spacing:1px">SALDO TOTAL DISPONÍVEL</span>
                <h1 style="font-size:32px; color:var(--accent); margin-top:10px" id="render-saldo">R$ 0,00</h1>
            </div>
        `;
        renderBalance();
    } 
    else if (view === 'config') {
        content.innerHTML = `
            <h1>Configurações</h1>
            <div style="margin-top:20px">
                <button onclick="pullData()" style="padding:12px 20px; background:var(--accent); color:#fff; border:none; border-radius:8px; cursor:pointer">Sincronizar Planilha</button>
                <div style="margin-top:30px">
                    <h3>Categorias (${cats.length})</h3>
                    <div id="list-cats" style="margin-top:10px"></div>
                </div>
            </div>
        `;
        const list = document.getElementById('list-cats');
        cats.forEach(c => {
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; background:var(--bg2); padding:15px; border-radius:10px; margin-bottom:8px">
                    <span>${c.emoji} ${c.nome}</span>
                    <button style="color:var(--accent); background:none; border:none; font-weight:bold">EDITAR</button>
                </div>
            `;
        });
    }
}

// --- DADOS ---
function renderBalance() {
    const total = txs.reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);
    const el = document.getElementById('render-saldo');
    if (el) el.innerText = total.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});
}

async function pullData() {
    try {
        const r = await fetch(`${cfg.shUrl}?action=getAppData`);
        const d = await r.json();
        if (d.ok && d.payload) {
            cats = d.payload.cats || cats;
            txs = d.payload.txs || txs;
            gs('cats', cats); gs('txs', txs);
            if (document.getElementById('render-saldo')) renderBalance();
        }
    } catch(e) { console.log("Offline"); }
}

// --- TECLADO ---
function init() {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    kb.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'pin-btn';
        b.innerText = k;
        b.onclick = () => k === 'C' ? (pinInput="", document.getElementById('pin-dots').innerText="") : pressPin(k);
        kb.appendChild(b);
    });
}

window.onload = init;
