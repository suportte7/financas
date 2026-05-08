// 1. DADOS FICTÍCIOS
const DADOS_INICIAIS = {
    cats: [
        {id:'c1', nome:'Alimentação', emoji:'🍎'},
        {id:'c2', nome:'Lazer', emoji:'🎮'},
        {id:'c3', nome:'Salário', emoji:'💰'}
    ],
    txs: [
        {id:'1', desc:'Supermercado Central', valor: -320.50, data:'2024-05-01', cat:'Alimentação'},
        {id:'2', desc:'Recebimento Salário', valor: 4500.00, data:'2024-05-05', cat:'Salário'},
        {id:'3', desc:'Assinatura Netflix', valor: -55.90, data:'2024-05-06', cat:'Lazer'},
        {id:'4', desc:'Restaurante Japa', valor: -120.00, data:'2024-05-07', cat:'Alimentação'}
    ]
};

// 2. GESTÃO DE MEMÓRIA
const K = k => 'fin_v784_' + k;
const gl = k => JSON.parse(localStorage.getItem(K(k)));
const gs = (k, v) => localStorage.setItem(K(k), JSON.stringify(v));

// Tenta carregar do celular, se não houver nada, usa os dados fictícios
let cats = gl('cats');
let txs = gl('txs');

if (!cats || cats.length === 0) {
    cats = DADOS_INICIAIS.cats;
    gs('cats', cats);
}
if (!txs || txs.length === 0) {
    txs = DADOS_INICIAIS.txs;
    gs('txs', txs);
}

let pinInput = "";

// 3. INTERFACE INICIAL
function init() {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'pin-btn';
        b.innerText = k;
        b.onclick = () => k === 'C' ? (pinInput="", document.getElementById('pin-dots').innerText="") : pressPin(k);
        kb.appendChild(b);
    });
}

function pressPin(n) {
    if (pinInput.length < 4) {
        pinInput += n;
        document.getElementById('pin-dots').innerText = "•".repeat(pinInput.length);
    }
    if (pinInput.length === 4) {
        if (pinInput === "8888") {
            document.getElementById('lock').style.display = 'none';
            document.getElementById('sidebar').style.display = 'flex';
            document.getElementById('main').style.display = 'flex';
            nav('home');
        } else {
            alert("PIN: 8888");
            pinInput = "";
            document.getElementById('pin-dots').innerText = "";
        }
    }
}

// 4. NAVEGAÇÃO E RENDERIZAÇÃO
function nav(view, btn) {
    if (btn) {
        document.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
        btn.classList.add('active');
    }
    
    const content = document.getElementById('app-content');
    
    if (view === 'home') {
        const saldo = txs.reduce((acc, t) => acc + t.valor, 0);
        content.innerHTML = `
            <h2>Dashboard</h2>
            <div class="card">
                <small style="color:var(--txt2)">SALDO DISPONÍVEL</small>
                <h1 style="color:var(--accent); margin-top:10px">${saldo.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</h1>
            </div>
            <div class="card">
                <h3>Últimas Movimentações</h3>
                <div style="margin-top:15px">${txs.slice(-3).reverse().map(t => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px">
                        <span>${t.desc}</span>
                        <b style="color:${t.valor > 0 ? '#10b981' : '#f43f5e'}">${t.valor.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</b>
                    </div>
                `).join('')}</div>
            </div>
        `;
    } 
    else if (view === 'transacoes') {
        content.innerHTML = `<h2>Extrato Completo</h2><div style="margin-top:15px">${txs.map(t => `
            <div class="card" style="display:flex; justify-content:space-between">
                <div><b>${t.desc}</b><br><small>${t.data} | ${t.cat}</small></div>
                <strong style="color:${t.valor > 0 ? '#10b981' : '#f43f5e'}">${t.valor.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</strong>
            </div>
        `).join('')}</div>`;
    }
    else if (view === 'perfil') {
        content.innerHTML = `<h2>Configurações</h2>
        <div class="card">
            <button onclick="localStorage.clear(); location.reload();" style="width:100%; padding:15px; background:#f43f5e; color:#fff; border:none; border-radius:8px; cursor:pointer">REINICIAR TUDO (APAGAR DADOS)</button>
        </div>`;
    }
}

window.onload = init;
