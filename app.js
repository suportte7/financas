// --- CONFIGURAÇÕES E DADOS INICIAIS ---
const VERSAO = "7.84";
const K = k => 'fin_v784_' + k;
const gl = k => JSON.parse(localStorage.getItem(K(k)));
const gs = (k, v) => localStorage.setItem(K(k), JSON.stringify(v));

const DADOS_MOCK = {
    cats: [
        {id: 'c1', nome: 'Alimentação', emoji: '🍎'},
        {id: 'c2', nome: 'Transporte', emoji: '🚗'},
        {id: 'c3', nome: 'Lazer', emoji: '🎮'},
        {id: 'c4', nome: 'Salário', emoji: '💰'},
        {id: 'c5', nome: 'Saúde', emoji: '💊'}
    ],
    accs: [
        {id: 'a1', nome: 'Conta Corrente', banco: 'Nubank'},
        {id: 'a2', nome: 'Carteira', banco: 'Dinheiro'}
    ],
    txs: [
        {id: '1', desc: 'Mercado Mensal', valor: -450.00, data: '2024-05-01', catId: 'c1', accId: 'a1'},
        {id: '2', desc: 'Combustível', valor: -150.00, data: '2024-05-03', catId: 'c2', accId: 'a1'},
        {id: '3', desc: 'Recebimento Freelance', valor: 2500.00, data: '2024-05-05', catId: 'c4', accId: 'a1'}
    ]
};

// --- ESTADO GLOBAL ---
let cats = gl('cats') || DADOS_MOCK.cats;
let accs = gl('accs') || DADOS_MOCK.accs;
let txs = gl('txs') || DADOS_MOCK.txs;
let pinInput = "";

// --- INICIALIZAÇÃO E PIN ---
function init() {
    const kb = document.getElementById('keyboard');
    if (!kb) return;
    kb.innerHTML = "";
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].forEach(k => {
        const b = document.createElement('button');
        b.className = 'pin-btn';
        b.innerText = k;
        b.onclick = () => {
            if (k === 'C') {
                pinInput = "";
                document.getElementById('pin-dots').innerText = "";
            } else if (k === 'OK' || pinInput.length === 4) {
                checkPin();
            } else {
                pinInput += k;
                document.getElementById('pin-dots').innerText = "•".repeat(pinInput.length);
                if (pinInput.length === 4) setTimeout(checkPin, 200);
            }
        };
        kb.appendChild(b);
    });
}

function checkPin() {
    if (pinInput === "8888") {
        document.getElementById('lock').style.display = 'none';
        document.getElementById('sidebar').style.display = 'flex';
        document.getElementById('main').style.display = 'flex';
        nav('dashboard');
    } else {
        alert("PIN Incorreto (Dica: 8888)");
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
    
    switch(view) {
        case 'dashboard': renderDashboard(content); break;
        case 'lancar': renderLancar(content); break;
        case 'extrato': renderExtrato(content); break;
        case 'categorias': renderCategorias(content); break;
        case 'config': renderConfig(content); break;
    }
}

// --- TELAS ---
function renderDashboard(container) {
    const saldo = txs.reduce((a, b) => a + b.valor, 0);
    const entradas = txs.filter(t => t.valor > 0).reduce((a, b) => a + b.valor, 0);
    const saidas = txs.filter(t => t.valor < 0).reduce((a, b) => a + b.valor, 0);

    container.innerHTML = `
        <h2>Dashboard <span style="font-size:12px; opacity:0.5">v${VERSAO}</span></h2>
        <div class="card">
            <small style="color:var(--txt2)">SALDO CONSOLIDADO</small>
            <h1 style="color:var(--accent); font-size:2.4rem; margin:10px 0">${saldo.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</h1>
            <div style="display:flex; justify-content:space-between; margin-top:20px; border-top:1px solid rgba(255,255,255,0.05); padding-top:15px">
                <div><small style="color:var(--green)">ENTRADAS</small><br><strong>${entradas.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</strong></div>
                <div><small style="color:var(--red)">SAÍDAS</small><br><strong>${saidas.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</strong></div>
            </div>
        </div>
        <h3>Atividades Recentes</h3>
        ${txs.slice(-4).reverse().map(t => `
            <div class="card" style="padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center">
                <span>${t.desc}</span>
                <strong style="color:${t.valor > 0 ? 'var(--green)' : 'var(--red)'}">${t.valor.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</strong>
            </div>
        `).join('')}
    `;
}

function renderLancar(container) {
    container.innerHTML = `
        <h2>Novo Lançamento</h2>
        <div class="card">
            <div class="form-group">
                <label>Descrição</label>
                <input type="text" id="tx-desc" placeholder="Ex: Aluguel">
            </div>
            <div class="form-group">
                <label>Valor (use - para despesa)</label>
                <input type="number" id="tx-valor" placeholder="0,00" step="0.01">
            </div>
            <div class="grid">
                <div class="form-group">
                    <label>Data</label>
                    <input type="date" id="tx-data" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="tx-cat">
                        ${cats.map(c => `<option value="${c.id}">${c.emoji} ${c.nome}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button class="btn-primary" onclick="salvarLancamento()">SALVAR REGISTRO</button>
        </div>
    `;
}

function renderExtrato(container) {
    container.innerHTML = `
        <h2>Extrato Detalhado</h2>
        <div style="margin-top:20px">
            ${txs.slice().reverse().map(t => {
                const cat = cats.find(c => c.id === t.catId);
                return `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <strong>${t.desc}</strong><br>
                        <small style="color:var(--txt2)">${t.data} | ${cat ? cat.nome : 'Sem Cat'}</small>
                    </div>
                    <div style="text-align:right">
                        <strong style="color:${t.valor > 0 ? 'var(--green)' : 'var(--red)'}">${t.valor.toLocaleString('pt-br',{style:'currency',currency:'BRL'})}</strong><br>
                        <button onclick="deletarTx('${t.id}')" style="background:none; border:none; color:var(--red); font-size:10px; cursor:pointer">EXCLUIR</button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    `;
}

function renderConfig(container) {
    const backup = JSON.stringify({cats, accs, txs}, null, 2);
    container.innerHTML = `
        <h2>Configurações e Backup</h2>
        <div class="card">
            <label>Backup dos Dados (JSON)</label>
            <textarea id="backup-area" style="height:150px; font-family:monospace; font-size:11px">${backup}</textarea>
            <button class="btn-primary" style="background:var(--bg3)" onclick="importarDados()">IMPORTAR DADOS DO TEXTO</button>
        </div>
        <div class="card" style="border-color:var(--red)">
            <h4 style="color:var(--red)">Zona de Perigo</h4>
            <p style="font-size:12px; margin:10px 0">Isso apagará tudo e carregará os dados fictícios iniciais.</p>
            <button onclick="resetTotal()" style="background:none; border:1px solid var(--red); color:var(--red); padding:10px; border-radius:8px; cursor:pointer; width:100%">REINICIAR APLICATIVO</button>
        </div>
    `;
}

// --- AÇÕES ---
function salvarLancamento() {
    const desc = document.getElementById('tx-desc').value;
    const valor = parseFloat(document.getElementById('tx-valor').value);
    const data = document.getElementById('tx-data').value;
    const catId = document.getElementById('tx-cat').value;

    if (!desc || isNaN(valor)) return alert("Preencha descrição e valor!");

    const novaTx = { id: Date.now().toString(), desc, valor, data, catId };
    txs.push(novaTx);
    gs('txs', txs);
    alert("Lançado com sucesso!");
    nav('dashboard');
}

function deletarTx(id) {
    if (!confirm("Excluir esta transação?")) return;
    txs = txs.filter(t => t.id !== id);
    gs('txs', txs);
    nav('extrato');
}

function importarDados() {
    try {
        const txt = document.getElementById('backup-area').value;
        const obj = JSON.parse(txt);
        if (obj.txs) {
            cats = obj.cats; accs = obj.accs; txs = obj.txs;
            gs('cats', cats); gs('accs', accs); gs('txs', txs);
            alert("Dados importados!");
            location.reload();
        }
    } catch(e) { alert("Erro no formato do JSON!"); }
}

function resetTotal() {
    if (confirm("Apagar todos os seus lançamentos?")) {
        localStorage.clear();
        location.reload();
    }
}

window.onload = init;
