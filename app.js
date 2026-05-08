// --- DADOS FICTÍCIOS PARA TESTE ---
const DADOS_EXEMPLO = {
    cats: [
        {id:'c1', nome:'Mercado', emoji:'🛒'},
        {id:'c2', nome:'Salário', emoji:'💰'},
        {id:'c3', nome:'Lazer', emoji:'🎬'}
    ],
    txs: [
        {id:'t1', desc:'Supermercado Silva', valor: -250.50, data:'2024-05-01', catId:'c1'},
        {id:'t2', desc:'Salário Mensal', valor: 5000.00, data:'2024-05-05', catId:'c2'},
        {id:'t3', desc:'Cinema Shopping', valor: -60.00, data:'2024-05-06', catId:'c3'}
    ]
};

// --- LOGICA CORE ---
const K = k => 'fin6_local_' + k;
const gl = k => JSON.parse(localStorage.getItem(K(k)));
const gs = (k, v) => localStorage.setItem(K(k), JSON.stringify(v));

let cats = gl('cats') || DADOS_EXEMPLO.cats;
let txs = gl('txs') || DADOS_EXEMPLO.txs;
let pinInput = "";

// --- SISTEMA DE BLOQUEIO ---
function init() {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'pin-btn';
        b.innerText = k;
        b.onclick = () => {
            if (k === 'C') { pinInput = ""; document.getElementById('pin-dots').innerText = ""; }
            else if (k === 'OK') { checkPin(); }
            else { pressPin(k); }
        };
        kb.appendChild(b);
    });
}

function pressPin(n) {
    if (pinInput.length < 4) {
        pinInput += n;
        document.getElementById('pin-dots').innerText = "•".repeat(pinInput.length);
    }
    if (pinInput.length === 4) checkPin();
}

function checkPin() {
    if (pinInput === "8888") {
        document.getElementById('lock').style.display = 'none';
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('main').style.display = 'flex';
        nav('home');
    } else {
        alert("PIN incorreto (Use 8888)");
        pinInput = "";
        document.getElementById('pin-dots').innerText = "";
    }
}

// --- NAVEGAÇÃO ---
function nav(view, btn) {
    if (btn) {
        document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
        btn.classList.add('active');
    }
    
    const content = document.getElementById('app-content');
    
    if (view === 'home') {
        const saldo = txs.reduce((a, b) => a + b.valor, 0);
        content.innerHTML = `
            <h2>Resumo Geral</h2>
            <div class="card">
                <small style="color:var(--txt2)">SALDO EM CONTA</small>
                <h1 style="color:var(--accent); font-size:2.5rem">${saldo.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</h1>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
                <div class="card" style="margin-bottom:0"><h3>Entradas</h3><p style="color:#10b981">R$ 5.000,00</p></div>
                <div class="card" style="margin-bottom:0"><h3>Saídas</h3><p style="color:#f43f5e">R$ 310,50</p></div>
            </div>
        `;
    } 
    else if (view === 'transacoes') {
        content.innerHTML = `<h2>Extrato</h2><div style="margin-top:20px">${txs.map(t => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:15px">
                <div>
                    <strong>${t.desc}</strong><br>
                    <small style="color:var(--txt2)">${t.data}</small>
                </div>
                <span style="color:${t.valor > 0 ? '#10b981' : '#f43f5e'}">
                    ${t.valor.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}
                </span>
            </div>
        `).join('')}</div>`;
    }
    else if (view === 'perfil') {
        content.innerHTML = `<h2>Perfil</h2><div class="card">
            <p><strong>Versão:</strong> 7.84 Local</p>
            <p><strong>Dados:</strong> Armazenados no Telefone</p>
            <button onclick="localStorage.clear(); location.reload();" style="margin-top:20px; color:#f43f5e; background:none; border:1px solid #f43f5e; padding:10px; border-radius:5px; cursor:pointer">LIMPAR TODOS OS DADOS</button>
        </div>`;
    }
}

window.onload = init;
