// FINANÇAS PRO V7.84 - CORE INTEGRAL
const VERSAO = "7.84";
const K = k => 'fin6_' + k;
const gl = k => JSON.parse(localStorage.getItem(K(k)));
const gs = (k, v) => localStorage.setItem(K(k), JSON.stringify(v));

// Estado Inicial
let cats = gl('cats') || [];
let accs = gl('accs') || [];
let txs = gl('txs') || [];
let cfg = gl('cfg') || { shUrl: typeof APP_SCRIPT_URL !== 'undefined' ? APP_SCRIPT_URL : '', pin: '8888' };
let pinInput = "";

// --- SISTEMA DE BLOQUEIO ---
function pressPin(n) {
    if (pinInput.length < 4) {
        pinInput += n;
        document.getElementById('pin-dots').innerText = "•".repeat(pinInput.length);
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
    document.getElementById('lock').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    nav('resumo', document.querySelector('.bnav-btn')); // Força abertura da Home
    if (cfg.shUrl) pullData(); // Puxa dados em segundo plano
}

// --- NAVEGAÇÃO ENTRE TELAS ---
function nav(view, btn) {
    // Atualiza botões
    document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const container = document.getElementById('app-content');
    
    if (view === 'resumo') {
        container.innerHTML = `
            <h2>Resumo</h2>
            <div style="background:var(--bg2); padding:20px; border-radius:15px; margin-top:15px">
                <p style="color:var(--txt2)">Saldo Atual</p>
                <h1 id="total-saldo">R$ 0,00</h1>
            </div>
        `;
        updateTotal();
    } 
    else if (view === 'transacoes') {
        container.innerHTML = `<h2>Extrato</h2><p>Carregando transações...</p>`;
    }
    else if (view === 'config') {
        renderConfig(container);
    }
}

// --- CONFIGURAÇÕES E EDIÇÃO ---
function renderConfig(container) {
    container.innerHTML = `
        <h3>Ajustes</h3>
        <button onclick="pullData()" style="width:100%; padding:15px; background:var(--accent); color:#fff; border:none; border-radius:10px; margin:15px 0">Sincronizar Agora</button>
        <div class="section">
            <h4>Categorias (${cats.length})</h4>
            <div id="cat-list"></div>
        </div>
    `;
    const list = document.getElementById('cat-list');
    cats.forEach(c => {
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; background:var(--bg2); padding:10px; border-radius:8px; margin-top:5px">
                <span>${c.emoji} ${c.nome}</span>
                <button onclick="editCat('${c.id}')" style="color:var(--accent); background:none; border:none">Editar</button>
            </div>
        `;
    });
}

// --- DADOS ---
async function pullData() {
    if (!cfg.shUrl) return;
    try {
        const r = await fetch(`${cfg.shUrl}?action=getAppData`);
        const d = await r.json();
        if (d.ok && d.payload) {
            cats = d.payload.cats || cats;
            accs = d.payload.accs || accs;
            txs = d.payload.txs || txs;
            saveLocal();
            // Se estiver na tela de resumo, atualiza o saldo na hora
            if (document.getElementById('total-saldo')) updateTotal();
        }
    } catch (e) { console.warn("Offline ou erro na URL"); }
}

function saveLocal() {
    gs('cats', cats); gs('accs', accs); gs('txs', txs); gs('cfg', cfg);
}

function updateTotal() {
    const total = txs.reduce((acc, t) => acc + (parseFloat(t.valor) || 0), 0);
    const el = document.getElementById('total-saldo');
    if (el) el.innerText = total.toLocaleString('pt-br', {style: 'currency', currency: 'BRL'});
}

// --- TECLADO INICIAL ---
function initKeyboard() {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    kb.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'pin-btn';
        b.innerText = k;
        b.onclick = () => k === 'C' ? (pinInput = "", document.getElementById('pin-dots').innerText = "") : pressPin(k);
        kb.appendChild(b);
    });
}

window.addEventListener('DOMContentLoaded', initKeyboard);