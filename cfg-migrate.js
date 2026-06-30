// cfg-migrate.js  V2.5
// ─────────────────────────────────────────────────────────────────
// 1. Selects/chips: só itens que existem nas colunas da planilha
// 2. Menu Config: abas, formulários, busca
// 3. Botão ⚙ em cada item: transferir · mesclar · converter entre tipos
// 4. Filtro lateral (drawer) com período + chips
// ─────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════
//  FONTE DE VERDADE: o que realmente existe nas despesas
// ══════════════════════════════════════════════════════════════════

// Retorna somente os itens que têm pelo menos uma despesa vinculada,
// ou que o usuário criou explicitamente (não são defaults hardcoded).
// Quando os dados vieram da nuvem (flag no localStorage), confia em tudo.

const _HD = new Set(['ali','trp','laz','sau','com','out','nu','def']);

function _live(type) {
  const CAMPO = { acc:'accId', cart:'cartId', cat:'catId', sub:'subId', pag:'pagId' };
  const arr   = { acc:accs, cart:carts, cat:cats, sub:subs, pag:pags }[type] || [];
  const campo = CAMPO[type];
  const used  = new Set(desps.map(d => d[campo]).filter(Boolean));
  // pagamentos padrão (cr/db/px/dn) sempre aparecem
  const PAG_CORE = new Set(['cr','db','px','dn']);
  return arr.filter(item => {
    if (item.ativa === false) return false;
    if (type === 'pag' && PAG_CORE.has(item.id)) return used.has(item.id) || !_HD.has(item.id) || localStorage.getItem('fin6_cloud_loaded');
    return used.has(item.id) || !_HD.has(item.id) || !!localStorage.getItem('fin6_cloud_loaded');
  });
}

// Subs filtradas opcionalmente por cats pai
function _vivosSubs(catIds) {
  const all = _vivos('sub');
  return catIds && catIds.length ? all.filter(s => catIds.includes(s.pai)) : all;
}

// Ao carregar da nuvem com sucesso → marcar flag
;(function patchLoadAll() {
  const orig = typeof loadAllFromCloud === 'function' ? loadAllFromCloud : null;
  if (!orig) return;
  loadAllFromCloud = async function(urlParam, silent=false) {
    await orig.call(this, urlParam, silent);
    localStorage.setItem('fin6_cloud_loaded','1');
    setTimeout(_refreshSelects, 200);
  };
})();

// Refresh de todos os selects após carga
function _refreshSelects() {
  try { populateForm(); }          catch(e){}
  try { populateFlt(); }           catch(e){}
  try { populateRSels(); }         catch(e){}
  try { populateAssinSelects(); }  catch(e){}
  try { _populateCartAccSel(); }   catch(e){}
  try { renderCfgContas(); }       catch(e){}
  try { renderCfgCartoes(); }      catch(e){}
  try { renderCfgCats(); }         catch(e){}
  try { renderCfgPags(); }         catch(e){}
}

document.addEventListener('DOMContentLoaded', () => setTimeout(_refreshSelects, 600));

// ── Patch populateForm ────────────────────────────────────────────
const _origPF = populateForm;
populateForm = function() {
  const lA=_vivos('acc'), lC=_vivos('cart'), lCat=_vivos('cat'), lP=_vivos('pag');
  ['l-acc','l-cart','l-cat','l-pag'].forEach((id,i) => {
    const el = document.getElementById(id); if(!el) return;
    const src = [lA,lC,lCat,lP][i];
    const lblFn = [
      a=>`${a.emoji||'🏦'} ${a.nome}`,
      c=>c.nome,
      c=>`${c.emoji||''} ${c.nome}`,
      p=>p.nome
    ][i];
    el.innerHTML = '<option value="">Selecione...</option>' + src.map(x=>`<option value="${x.id}">${lblFn(x)}</option>`).join('');
  });
};

// ── Patch populateFlt ─────────────────────────────────────────────
const _origFlt = populateFlt;
populateFlt = function() {
  renderFltBlock('f-flt-accs',  _vivos('acc'),  'accs',  a=>`${a.emoji||'🏦'} ${a.nome}`, renderTrans);
  renderFltBlock('f-flt-carts', _vivos('cart'), 'carts', c=>c.nome, renderTrans);
  renderFltBlock('f-flt-pags',  _vivos('pag'),  'pags',  p=>p.nome, renderTrans);
  renderFltBlock('f-flt-cats',  _vivos('cat'),  'cats',  c=>`${c.emoji||''} ${c.nome}`, ()=>{ _subsFlt(); renderTrans(); });
  _subsFlt();
};
function _subsFlt() {
  const catIds = FLT.cats.length ? FLT.cats : _vivos('cat').map(c=>c.id);
  const ms = _vivosSubs(catIds);
  FLT.subs = FLT.subs.filter(id => ms.find(s=>s.id===id));
  renderFltBlock('f-flt-subs', ms, 'subs', s=>s.nome, renderTrans);
}

// ── Patch populateRSels ───────────────────────────────────────────
populateRSels = function() {
  const sets = { 'r-cat-sel':[_vivos('cat'), c=>`${c.emoji||''} ${c.nome}`, 'Todas categorias'],
                 'r-sub-sel':[_vivosSubs([]),   s=>s.nome,               'Todas subcategorias'],
                 'r-acc-sel':[_vivos('acc'),   a=>`${a.emoji||'🏦'} ${a.nome}`, 'Todas contas'],
                 'r-pag-sel':[_vivos('pag'),   p=>p.nome,               'Todos pagamentos'] };
  Object.entries(sets).forEach(([id,[arr,fn,ph]]) => {
    const el=document.getElementById(id); if(!el) return;
    el.innerHTML = `<option value="">${ph}</option>` + arr.map(x=>`<option value="${x.id}">${fn(x)}</option>`).join('');
  });
};

// ── Patch populateAssinSelects ────────────────────────────────────
populateAssinSelects = function() {
  const ac=document.getElementById('as-cat'), aa=document.getElementById('as-acc');
  if(ac) ac.innerHTML='<option value="">Nenhuma</option>'+_vivos('cat').map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');
  if(aa) aa.innerHTML='<option value="">Nenhuma</option>'+_vivos('acc').map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
};

// ── Patch _populateCartAccSel ─────────────────────────────────────
_populateCartAccSel = function() {
  const sel=document.getElementById('cc-acc'); if(!sel) return;
  sel.innerHTML='<option value="">Selecione a conta...</option>'+_vivos('acc').map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
};


// ══════════════════════════════════════════════════════════════════
//  FILTRO DRAWER (hamburguer)
// ══════════════════════════════════════════════════════════════════

window.GFLT = window.GFLT || { modo:'mes', mes:today().slice(0,7), d1:'', d2:'', q:'', accs:[], carts:[], pags:[], cats:[], subs:[] };

function _gfltRange() {
  const G=window.GFLT, t=today();
  if(G.modo==='tudo')   return ['2000-01-01','2099-12-31'];
  if(G.modo==='custom') return [G.d1||'2000-01-01', G.d2||'2099-12-31'];
  if(G.modo==='7')  { const a=new Date();a.setDate(a.getDate()-7);  return [a.toISOString().slice(0,10),t]; }
  if(G.modo==='30') { const a=new Date();a.setDate(a.getDate()-30); return [a.toISOString().slice(0,10),t]; }
  if(G.modo==='90') { const a=new Date();a.setDate(a.getDate()-90); return [a.toISOString().slice(0,10),t]; }
  if(G.modo==='ano')    return [t.slice(0,4)+'-01-01', t.slice(0,4)+'-12-31'];
  const m=G.mes||curMes, [y,mo]=m.split('-'), last=new Date(+y,+mo,0).getDate();
  return [`${m}-01`, `${m}-${String(last).padStart(2,'0')}`];
}

function openFilterDrawer() {
  let w=document.getElementById('fdr-wrap');
  if(!w){w=document.createElement('div');w.id='fdr-wrap';document.body.appendChild(w);}
  w.innerHTML=_fdrBuild();
  _fdrMesSel();
  requestAnimationFrame(()=>{
    document.getElementById('fdr-ov').style.display='block';
    document.getElementById('fdr-pn').style.transform='translateX(0)';
  });
}
function closeFilterDrawer() {
  const p=document.getElementById('fdr-pn'), o=document.getElementById('fdr-ov');
  if(!p) return;
  p.style.transform='translateX(100%)'; if(o) o.style.display='none';
  setTimeout(()=>{const w=document.getElementById('fdr-wrap');if(w)w.innerHTML='';},260);
}

function _fdrChip(lbl,val) {
  const on=window.GFLT.modo===val;
  return `<button class="fdr-c${on?' on':''}" onclick="gfltModo('${val}',this)">${lbl}</button>`;
}
function _fdrGroup(title, key, items, fn) {
  if(!items.length) return '';
  const G=window.GFLT;
  return `<div class="fdr-s"><div class="fdr-st">${title}</div><div class="fdr-cs">${
    items.map(it=>{const on=(G[key]||[]).includes(it.id);
      return `<button class="fdr-c${on?' on':''}" data-k="${key}" data-id="${it.id}" onclick="gfltChip(this)">${fn(it)}</button>`;
    }).join('')
  }</div></div>`;
}

function _fdrBuild() {
  const G=window.GFLT;
  return `
  <div id="fdr-ov" onclick="closeFilterDrawer()" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1099;display:none"></div>
  <div id="fdr-pn" style="position:fixed;top:0;right:0;bottom:0;width:min(340px,100vw);background:var(--bg2);z-index:1100;box-shadow:-8px 0 40px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .25s cubic-bezier(.4,0,.2,1)">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 16px 12px;border-bottom:0.5px solid var(--bdr);flex-shrink:0">
      <div style="font-size:15px;font-weight:800;color:var(--txt)">Filtros</div>
      <div style="display:flex;gap:8px">
        <button class="btn xs" onclick="gfltLimpar()">Limpar</button>
        <button onclick="closeFilterDrawer()" style="background:none;border:none;color:var(--txt2);cursor:pointer;font-size:20px;padding:2px 6px">✕</button>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px 16px">
      <div class="fdr-s">
        <div class="fdr-st">Período</div>
        <div class="fdr-cs" id="fdr-per">
          ${_fdrChip('Todos','tudo')}${_fdrChip('Este mês','mes')}${_fdrChip('7 dias','7')}
          ${_fdrChip('30 dias','30')}${_fdrChip('90 dias','90')}${_fdrChip('Este ano','ano')}${_fdrChip('Livre','custom')}
        </div>
        <div id="fdr-mes-r" style="display:${G.modo==='mes'?'block':'none'};margin-top:8px">
          <select id="fdr-mes" onchange="window.GFLT.mes=this.value" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--bg3);border:0.5px solid var(--bdr2);color:var(--txt);font-size:13px;font-family:inherit"></select>
        </div>
        <div id="fdr-rng-r" style="display:${G.modo==='custom'?'flex':'none'};gap:8px;margin-top:8px;align-items:center">
          <input type="date" id="fdr-d1" value="${G.d1||''}" style="flex:1;padding:8px;border-radius:8px;background:var(--bg3);border:0.5px solid var(--bdr2);color:var(--txt);font-size:12px"/>
          <span style="color:var(--txt3);font-size:11px">até</span>
          <input type="date" id="fdr-d2" value="${G.d2||''}" style="flex:1;padding:8px;border-radius:8px;background:var(--bg3);border:0.5px solid var(--bdr2);color:var(--txt);font-size:12px"/>
        </div>
      </div>
      <div class="fdr-s">
        <div class="fdr-st">Buscar</div>
        <input id="fdr-q" value="${G.q||''}" placeholder="Descrição, observação..." style="width:100%;padding:9px 11px;border-radius:8px;background:var(--bg3);border:0.5px solid var(--bdr2);color:var(--txt);font-size:13px;box-sizing:border-box;font-family:inherit"/>
      </div>
      ${_fdrGroup('Contas',        'accs',  _vivos('acc'),      a=>`${a.emoji||'🏦'} ${a.nome}`)}
      ${_fdrGroup('Cartões',       'carts', _vivos('cart'),     c=>c.nome)}
      ${_fdrGroup('Pagamentos',    'pags',  _vivos('pag'),      p=>p.nome)}
      ${_fdrGroup('Categorias',    'cats',  _vivos('cat'),      c=>`${c.emoji||''} ${c.nome}`)}
      ${_fdrGroup('Subcategorias', 'subs',  _vivosSubs([]),     s=>s.nome)}
      <div style="height:20px"></div>
    </div>
    <div style="padding:12px 16px;border-top:0.5px solid var(--bdr);flex-shrink:0">
      <button class="btn pr" style="width:100%;padding:13px" onclick="gfltAplicar()">✓ Aplicar</button>
    </div>
  </div>`;
}

function _fdrMesSel() {
  const sel=document.getElementById('fdr-mes'); if(!sel) return;
  const ms=[...new Set([today().slice(0,7),...desps.map(d=>d.data.slice(0,7))])].sort().reverse();
  const cur=window.GFLT.mes||today().slice(0,7);
  sel.innerHTML=ms.map(m=>{const[y,mo]=m.split('-');const n=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return`<option value="${m}"${m===cur?' selected':''}>${n}</option>`;}).join('');
}

function gfltModo(val,btn) {
  window.GFLT.modo=val;
  document.querySelectorAll('#fdr-per .fdr-c').forEach(c=>c.classList.remove('on'));
  if(btn) btn.classList.add('on');
  const mr=document.getElementById('fdr-mes-r'), rr=document.getElementById('fdr-rng-r');
  if(mr) mr.style.display=val==='mes'?'block':'none';
  if(rr) rr.style.display=val==='custom'?'flex':'none';
}
function gfltChip(el) {
  const k=el.dataset.k, id=el.dataset.id;
  const arr=window.GFLT[k]||(window.GFLT[k]=[]);
  const i=arr.indexOf(id);
  if(i>=0){arr.splice(i,1);el.classList.remove('on');}else{arr.push(id);el.classList.add('on');}
}
function gfltLimpar() {
  window.GFLT={modo:'mes',mes:today().slice(0,7),d1:'',d2:'',q:'',accs:[],carts:[],pags:[],cats:[],subs:[]};
  closeFilterDrawer(); setTimeout(openFilterDrawer,50);
}
function gfltAplicar() {
  const G=window.GFLT;
  const v=id=>(document.getElementById(id)||{}).value;
  if(G.modo==='mes'&&v('fdr-mes')) G.mes=v('fdr-mes');
  if(G.modo==='custom'){G.d1=v('fdr-d1')||'';G.d2=v('fdr-d2')||'';}
  G.q=(document.getElementById('fdr-q')||{}).value||'';
  const [d1,d2]=_gfltRange();
  perStart=d1; perEnd=d2;
  FLT.accs=[...G.accs];FLT.carts=[...G.carts];FLT.pags=[...G.pags];FLT.cats=[...G.cats];FLT.subs=[...G.subs];
  const e1=document.getElementById('f-d1');if(e1)e1.value=d1||'';
  const e2=document.getElementById('f-d2');if(e2)e2.value=d2||'';
  const eq=document.getElementById('f-q');if(eq)eq.value=G.q||'';
  if(G.modo==='mes'){curMes=G.mes;const ms=document.getElementById('mesSel');if(ms)ms.value=curMes;}
  _fdrBadge();
  if(typeof _updateRHeroLabel==='function')_updateRHeroLabel();
  const pg=_getActivePage();
  try {
    if(pg==='resumo')     renderResumo();
    if(pg==='transacoes') renderTrans();
    if(pg==='calendario') {if(typeof renderCal==='function')renderCal();}
    if(pg==='parcelas')   {if(typeof renderParcs==='function')renderParcs();}
    if(pg==='orcamento')  {if(typeof renderOrc==='function')renderOrc();}
    if(pg==='relatorio')  {if(typeof buildRelatorio==='function')buildRelatorio();}
    if(pg==='datagrid')   {if(typeof renderDG==='function')renderDG();}
    if(pg==='analise')    {if(typeof renderAnalise==='function')renderAnalise();}
  } catch(e){}
  closeFilterDrawer();
  const hasF=G.accs.length||G.carts.length||G.pags.length||G.cats.length||G.subs.length||G.q;
  toast(hasF?'Filtros aplicados ✓':'Período aplicado ✓');
}
function _fdrBadge() {
  const G=window.GFLT, btn=document.getElementById('btn-filter'); if(!btn) return;
  const hasF=G.accs.length||G.carts.length||G.pags.length||G.cats.length||G.subs.length||G.q||G.modo!=='mes';
  btn.style.color=hasF?'var(--accent2)':'var(--txt2)';
  let dot=btn.querySelector('.fdr-dot');
  if(hasF&&!dot){dot=document.createElement('div');dot.className='fdr-dot';dot.style.cssText='width:7px;height:7px;border-radius:50%;background:var(--rose);position:absolute;top:3px;right:3px';btn.style.position='relative';btn.appendChild(dot);}
  else if(!hasF&&dot) dot.remove();
}

// Override funções antigas
window.openGlobalFilter=window.topbarFilterClick=openFilterDrawer;
window.closeGlobalFilter=closeFilterDrawer;
window.applyGlobalFilter=gfltAplicar;

// renderResumo com GFLT
const _origRR=renderResumo;
renderResumo=function(){
  const G=window.GFLT;
  if(!G||G.modo==='mes'){_origRR();return;}
  const [d1,d2]=_gfltRange();
  let d=desps.filter(x=>x.data>=d1&&x.data<=d2);
  if(G.accs.length)  d=d.filter(x=>G.accs.includes(x.accId));
  if(G.carts.length) d=d.filter(x=>G.carts.includes(x.cartId));
  if(G.pags.length)  d=d.filter(x=>G.pags.includes(x.pagId));
  if(G.cats.length)  d=d.filter(x=>G.cats.includes(x.catId));
  if(G.subs.length)  d=d.filter(x=>G.subs.includes(x.subId));
  if(G.q){const q=G.q.toLowerCase();d=d.filter(x=>(x.desc+' '+(x.obs||'')).toLowerCase().includes(q));}
  const tot=d.reduce((s,x)=>s+x.valor,0);
  const cart=d.filter(x=>{const p=pags.find(q=>q.id===x.pagId);return p&&(p.tipo==='credit'||p.tipo==='debit');}).reduce((s,x)=>s+x.valor,0);
  const pixdn=d.filter(x=>{const p=pags.find(q=>q.id===x.pagId);return p&&(p.tipo==='pix'||p.tipo==='dinheiro');}).reduce((s,x)=>s+x.valor,0);
  const pf=desps.filter(x=>x.totalParcelas&&x.data>d2).reduce((s,x)=>s+x.valor,0);
  const r=id=>document.getElementById(id);
  if(r('r-tot'))  r('r-tot').textContent=fmt(tot);
  if(r('r-sub'))  r('r-sub').textContent=`${d.length} lançamento${d.length!==1?'s':''}`;
  if(r('r-cart')) r('r-cart').textContent=fmt(cart);
  if(r('r-pix'))  r('r-pix').textContent=fmt(pixdn);
  if(r('r-pf'))   r('r-pf').textContent=fmt(pf);
  const bc={};d.forEach(x=>{if(x.catId)bc[x.catId]=(bc[x.catId]||0)+x.valor;});
  const mx=Math.max(...Object.values(bc),1);
  const rC=r('r-cats');
  if(rC) rC.innerHTML=Object.keys(bc).length?Object.entries(bc).sort((a,b)=>b[1]-a[1]).map(([id,v])=>{
    const c=cats.find(x=>x.id===id)||{nome:id,cor:'#888',emoji:'📦'};
    const orc=orcs[id];const pct=Math.min(100,Math.max(0,Math.round(v/mx*100)));
    const orcPct=orc?Math.min(100,Math.max(0,Math.round(v/orc*100))):null;
    const col=orcPct&&orcPct>=100?'var(--rose)':orcPct&&orcPct>=80?'var(--amb)':c.cor;
    return`<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px"><span style="font-size:13px;width:17px;flex-shrink:0">${c.emoji||'📦'}</span><span style="font-size:12px;width:78px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--txt2)">${c.nome}</span><div class="prog"><div class="pf" style="width:${pct}%;background:${col}"></div></div><span style="font-size:11px;color:var(--txt2);width:66px;text-align:right;flex-shrink:0">${fmt(v)}${orc?`<br><span style="font-size:9px;color:var(--txt3)">/ ${fmt(orc)}</span>`:''}</span></div>`;
  }).join(''):'<div class="empty">Sem lançamentos no período</div>';
  const ba={};d.filter(x=>x.accId).forEach(x=>{ba[x.accId]=(ba[x.accId]||0)+x.valor;});
  const rA=r('r-accs');
  if(rA) rA.innerHTML=Object.keys(ba).length?Object.entries(ba).sort((a,b)=>b[1]-a[1]).map(([id,v])=>{
    const a=accs.find(x=>x.id===id)||{nome:id,emoji:'🏦'};
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid var(--bdr)"><span style="font-size:13px">${a.emoji||'🏦'} ${a.nome}</span><span style="font-size:13px;font-weight:700;color:var(--rose)">${fmt(v)}</span></div>`;
  }).join(''):'<div class="empty">Sem gastos no período</div>';
};

// getFiltered com GFLT
const _origGF=typeof getFiltered==='function'?getFiltered:null;
if(_origGF){
  getFiltered=function(){
    const G=window.GFLT;
    if(!G||G.modo==='mes') return _origGF();
    const [d1,d2]=_gfltRange();
    let list=desps.filter(x=>x.data>=d1&&x.data<=d2);
    const aF=G.accs.length?G.accs:FLT.accs, cF=G.carts.length?G.carts:FLT.carts;
    const pF=G.pags.length?G.pags:FLT.pags, catF=G.cats.length?G.cats:FLT.cats, sF=G.subs.length?G.subs:FLT.subs;
    if(aF.length)   list=list.filter(x=>aF.includes(x.accId));
    if(cF.length)   list=list.filter(x=>cF.includes(x.cartId));
    if(pF.length)   list=list.filter(x=>pF.includes(x.pagId));
    if(catF.length) list=list.filter(x=>catF.includes(x.catId));
    if(sF.length)   list=list.filter(x=>sF.includes(x.subId));
    const q=G.q||((document.getElementById('f-q')||{}).value||'').toLowerCase();
    if(q) list=list.filter(x=>(x.desc+' '+(x.obs||'')).toLowerCase().includes(q));
    return list.sort((a,b)=>b.data.localeCompare(a.data));
  };
}

// CSS drawer
(function(){const s=document.createElement('style');s.textContent=`
.fdr-s{margin-bottom:16px}
.fdr-st{font-size:10px;font-weight:800;color:var(--txt3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px}
.fdr-cs{display:flex;flex-wrap:wrap;gap:6px}
.fdr-c{padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid var(--bdr2);background:var(--bg3);color:var(--txt2);cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.fdr-c:hover{background:var(--bg4);color:var(--txt)}
.fdr-c.on{background:rgba(99,102,241,.18);color:var(--accent2);border-color:rgba(99,102,241,.45)}
`;document.head.appendChild(s);})();


// ══════════════════════════════════════════════════════════════════
//  MENU CONFIG: abas + formulários + busca
// ══════════════════════════════════════════════════════════════════

function cfgTypeTab(type, btn) {
  ['contas','cartoes','cats','subs','pags'].forEach(p=>{
    const el=document.getElementById('cfg-pane-'+p); if(el) el.style.display=p===type?'block':'none';
  });
  document.querySelectorAll('.cfg-type-tab').forEach(b=>b.classList.remove('act'));
  if(btn) btn.classList.add('act');
  document.querySelectorAll('.cfg-add-form').forEach(f=>f.style.display='none');
  if(type==='contas')  renderCfgContas();
  if(type==='cartoes') {_populateCartAccSel();renderCfgCartoes();}
  if(type==='cats')    renderCfgCats();
  if(type==='subs')    renderCfgCats();
  if(type==='pags')    renderCfgPags();
}
document.addEventListener('DOMContentLoaded',()=>{const ft=document.querySelector('.cfg-type-tab');if(ft)cfgTypeTab('contas',ft);});

function cfgAddToggle(type) {
  const MAP={acc:'cfg-add-acc',cart:'cfg-add-cart',cat:'cfg-add-cat',sub:'cfg-add-sub',pag:'cfg-add-pag'};
  const id=MAP[type]; if(!id) return;
  const el=document.getElementById(id); if(!el) return;
  const open=el.style.display==='block';
  Object.values(MAP).forEach(fid=>{const f=document.getElementById(fid);if(f)f.style.display='none';});
  if(!open){
    el.style.display='block';
    el.scrollIntoView({behavior:'smooth',block:'nearest'});
    if(type==='cart') _populateCartAccSel();
    if(type==='sub'){const sel=document.getElementById('ns-p');if(sel)sel.innerHTML='<option value="">Selecione...</option>'+cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');}
    const inp=el.querySelector('input:not([type=color]):not([type=hidden])');
    if(inp) setTimeout(()=>inp.focus(),80);
  }
}
function cfgSearchToggle(){
  const box=document.getElementById('cfg-search-box');if(!box)return;
  const open=box.style.display==='block';
  box.style.display=open?'none':'block';
  if(!open){const inp=document.getElementById('cfg-search');if(inp){inp.value='';inp.focus();}}
  else cfgSearch('');
}
function cfgSearch(q){
  q=(q||'').toLowerCase().trim();
  document.querySelectorAll('#p-config .cfg-item').forEach(item=>{
    item.style.display=(!q||item.textContent.toLowerCase().includes(q))?'':'none';
  });
  if(q)['contas','cartoes','cats','subs','pags'].forEach(p=>{const el=document.getElementById('cfg-pane-'+p);if(el)el.style.display='block';});
}


// ══════════════════════════════════════════════════════════════════
//  OPERAÇÕES: botão ⚙ + painel + conversões livres entre tipos
// ══════════════════════════════════════════════════════════════════

// Mapeamento tipo → campo na despesa → array global
const _TM = {
  acc:  { campo:'accId',  label:'Conta',         icon:'🏦', arr:()=>accs,  set:v=>{accs=v;}  },
  cart: { campo:'cartId', label:'Cartão',        icon:'💳', arr:()=>carts, set:v=>{carts=v;} },
  cat:  { campo:'catId',  label:'Categoria',     icon:'🏷', arr:()=>cats,  set:v=>{cats=v;}  },
  sub:  { campo:'subId',  label:'Subcategoria',  icon:'↳',  arr:()=>subs,  set:v=>{subs=v;}  },
  pag:  { campo:'pagId',  label:'Pagamento',     icon:'💸', arr:()=>pags,  set:v=>{pags=v;}  },
};

function _nD(type, id) { return desps.filter(d=>d[_TM[type].campo]===id).length; }

// Abre painel de operações
function openOpsPanel(type, id) {
  const tm=_TM[type]; if(!tm) return;
  const item=tm.arr().find(x=>x.id===id); if(!item) return;
  const n=_nD(type,id);
  openModal(`${tm.icon} ${item.nome}`,'',null);
  document.getElementById('m-btns').style.display='none';
  document.getElementById('m-extra').innerHTML=`
    <div style="font-size:11px;color:var(--txt3);margin-bottom:10px">${n} despesa(s) · ${tm.label}</div>
    <div id="ops-btns" style="display:flex;flex-direction:column;gap:7px">${_opsHtml(type,id,n)}</div>
    <div id="ops-form" style="margin-top:12px"></div>
    <button class="btn sm" style="width:100%;margin-top:10px" onclick="closeModal()">Fechar</button>`;
}

function _opBtn(ic,lb,ds,fn) {
  return `<button onclick="${fn}" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:10px;background:var(--bg3);border:0.5px solid var(--bdr2);color:var(--txt);cursor:pointer;text-align:left;font-family:inherit" onmouseover="this.style.background='var(--bg4)'" onmouseout="this.style.background='var(--bg3)'">
  <span style="font-size:18px;width:24px;text-align:center;flex-shrink:0">${ic}</span>
  <div style="flex:1"><div style="font-size:13px;font-weight:600">${lb}</div><div style="font-size:11px;color:var(--txt3);margin-top:1px">${ds}</div></div>
  <svg style="width:16px;height:16px;flex-shrink:0;stroke:var(--txt3);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
</button>`;
}

function _opsHtml(type, id, n) {
  const tm=_TM[type];
  let h='';
  h+=_opBtn('✏️','Editar','Renomear, cor, emoji...',`_opsEdit('${type}','${id}')`);
  // Transferir / Mesclar dentro do mesmo tipo
  if(tm.arr().filter(x=>x.id!==id).length){
    h+=_opBtn('🔀','Transferir despesas',`${n} despesas mudam de ${tm.label.toLowerCase()}`,`opsForm('t','${type}','${id}')`);
    h+=_opBtn('🔗','Mesclar em outro',`Este item some, dados migram`,`opsForm('m','${type}','${id}')`);
  }
  // Converter para qualquer outro tipo
  const outros=Object.keys(_TM).filter(t=>t!==type);
  if(outros.length){
    h+=`<div style="font-size:10px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;padding:6px 2px 2px">Converter em outro tipo</div>`;
    outros.forEach(dest=>{
      const dtm=_TM[dest];
      h+=_opBtn(dtm.icon,`Mover para ${dtm.label}`,`Despesas: campo ${tm.label}→${dtm.label}, "${item?.nome}" some`,`opsConvert('${type}','${id}','${dest}')`);
    });
  }
  // Remover
  const isCore=type==='pag'&&['cr','db','px','dn'].includes(id);
  if(!isCore) h+=_opBtn('🗑','Remover',n>0?`⚠ ${n} despesas perdem o ${tm.label.toLowerCase()}`:'Sem despesas',`_opsRemove('${type}','${id}')`);
  return h;

  // Helper local para item
  function item(){return tm.arr().find(x=>x.id===id);}
}

// Formulário de transferir/mesclar
function opsForm(op, type, id) {
  const area=document.getElementById('ops-form'); if(!area) return;
  const tm=_TM[type];
  const src=tm.arr().find(x=>x.id===id); if(!src) return;
  const outros=tm.arr().filter(x=>x.id!==id);
  if(!outros.length){area.innerHTML='<div style="color:var(--txt3);font-size:13px;padding:10px 0">Não há outros itens deste tipo.</div>';return;}
  const ss='width:100%;padding:8px 10px;border-radius:8px;background:var(--bg3);border:0.5px solid var(--bdr2);color:var(--txt);font-size:13px;margin:6px 0 10px;font-family:inherit';
  const lbl=op==='t'?'Transferir despesas':'Mesclar';
  const warn=op==='m'?`⚠ "${src.nome}" será removido. Todas as despesas migram para o destino.`:`Despesas mudam de ${tm.label.toLowerCase()}, "${src.nome}" permanece.`;
  const opts=outros.map(x=>`<option value="${x.id}">${x.nome}</option>`).join('');
  area.innerHTML=`<div style="background:var(--bg2);border:0.5px solid var(--bdr2);border-radius:12px;padding:14px">
    <div style="font-size:13px;font-weight:700;margin-bottom:8px">${lbl} — ${src.nome}</div>
    <select id="ops-sel" style="${ss}"><option value="">Selecione...</option>${opts}</select>
    <div style="font-size:11px;color:var(--amb);padding:8px 10px;background:rgba(245,158,11,.08);border-radius:7px;margin-bottom:8px">${warn}</div>
    <button class="btn pr sm" style="width:100%" onclick="opsExec('${op}','${type}','${id}')">✅ ${lbl}</button>
  </div>`;
  area.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// Converter tipo: move campo da despesa de srcType para destType
function opsConvert(srcType, srcId, destType) {
  const stm=_TM[srcType], dtm=_TM[destType];
  const src=stm.arr().find(x=>x.id===srcId); if(!src) return;
  const n=_nD(srcType,srcId);
  openModal(`Converter "${src.nome}" em ${dtm.label}?`,
    `${n} despesa(s) terão "${src.nome}" como ${dtm.label.toLowerCase()}.\nO ${stm.label.toLowerCase()} original será removido.`,
    ()=>{
      const newId=uid();
      // Criar item no destType
      const extras={};
      if(destType==='acc')  Object.assign(extras,{emoji:src.emoji||stm.icon,tipo:'carteira',cor:src.cor||'#6366f1',saldo:0});
      if(destType==='cart') Object.assign(extras,{cor:src.cor||'#6366f1',band:'Outro',accId:'',limite:0,fech:10,venc:17,ativa:true});
      if(destType==='cat')  Object.assign(extras,{emoji:src.emoji||stm.icon,cor:src.cor||'#6366f1'});
      if(destType==='sub')  Object.assign(extras,{pai:cats[0]?.id||''});
      if(destType==='pag')  Object.assign(extras,{tipo:'outro'});
      const newArr=[...dtm.arr(),{id:newId,nome:src.nome,...extras}];
      dtm.set(newArr);
      // Migrar campo nas despesas
      let count=0;
      desps.forEach(d=>{
        if(d[stm.campo]===srcId){
          d[dtm.campo]=newId;  // seta campo destino
          d[stm.campo]='';     // limpa campo origem
          count++;
        }
      });
      // Remover src do seu tipo
      stm.set(stm.arr().filter(x=>x.id!==srcId));
      // Se era cat → limpar subs órfãs
      if(srcType==='cat') subs=subs.filter(s=>s.pai!==srcId);
      _doneOp(`✅ "${src.nome}" movido para ${dtm.label}! ${count} despesas migradas.`);
    });
}

// Executar transferir ou mesclar
function opsExec(op, type, id) {
  const tm=_TM[type];
  const destId=(document.getElementById('ops-sel')||{}).value;
  if(!destId){toast('Selecione o destino.');return;}
  const src=tm.arr().find(x=>x.id===id), dest=tm.arr().find(x=>x.id===destId);
  if(!src||!dest) return;
  let count=0;
  if(op==='t'){
    desps.forEach(d=>{if(d[tm.campo]===id){d[tm.campo]=destId;count++;}});
    _doneOp(`✅ ${count} despesa(s) movida(s) para "${dest.nome}"`);
    return;
  }
  openModal(`Mesclar "${src.nome}" em "${dest.nome}"?`,`Todas as despesas migram. "${src.nome}" será removido.`,()=>{
    desps.forEach(d=>{if(d[tm.campo]===id){d[tm.campo]=destId;count++;}});
    if(type==='cat') subs.forEach(s=>{if(s.pai===id) s.pai=destId;});
    tm.set(tm.arr().filter(x=>x.id!==id));
    _doneOp(`✅ Mesclado! ${count} despesas migradas.`);
  });
}

function _opsEdit(type,id){
  closeModal();
  const fns={acc:editAcc,cart:editCart,cat:editCat,sub:editSub,pag:editPag};
  if(typeof fns[type]==='function') fns[type](id);
}
function _opsRemove(type,id){
  const tm=_TM[type], n=_nD(type,id), item=tm.arr().find(x=>x.id===id);
  openModal(`Remover "${item?.nome}"?`,
    n>0?`⚠ ${n} despesa(s) perderão o ${tm.label.toLowerCase()}.`:'Sem despesas vinculadas.',
    ()=>{
      tm.set(tm.arr().filter(x=>x.id!==id));
      if(type==='cat') subs=subs.filter(s=>s.pai!==id);
      _doneOp(`✅ "${item?.nome}" removido.`);
    });
}

function _doneOp(msg){
  saveAll();renderAll();populateForm();populateFlt();
  try{renderCfgContas();}catch(e){}try{renderCfgCartoes();}catch(e){}
  try{renderCfgCats();}catch(e){}try{renderCfgPags();}catch(e){}
  if(cfg.shUrl&&navigator.onLine) saveAppData();
  closeModal();toast(msg);
}

// ── Injetar botão ⚙ nos itens do config ──────────────────────────
function _gear(listId, type) {
  const el=document.getElementById(listId); if(!el) return;
  el.querySelectorAll('.cfg-item').forEach(item=>{
    if(item.querySelector('.ops-g')) return;
    const eb=item.querySelector('button[onclick*="edit"]'); if(!eb) return;
    const m=eb.getAttribute('onclick').match(/'([^']+)'/); if(!m) return;
    const id=m[1];
    const btn=document.createElement('button');
    btn.className='btn xs ops-g';btn.title='Operações';btn.textContent='⚙';
    btn.onclick=e=>{e.stopPropagation();openOpsPanel(type,id);};
    const wrap=item.querySelector('.cfg-item-actions')||eb.parentElement;
    wrap.insertBefore(btn,eb);
  });
}

// Patch render funções para injetar ⚙
const _r0=renderCfgContas,_r1=renderCfgCartoes,_r2=renderCfgCats,_r3=renderCfgPags;
renderCfgContas  = ()=>{_r0();_gear('acc-list','acc');};
renderCfgCartoes = ()=>{_r1();_gear('cart-list','cart');};
renderCfgCats    = ()=>{_r2();_gear('cat-list','cat');_gear('sub-list','sub');};
renderCfgPags    = ()=>{_r3();_gear('pag-list','pag');};

(function(){const s=document.createElement('style');s.textContent=`.ops-g{background:var(--bg3)!important;border:0.5px solid var(--bdr2)!important;color:var(--txt3)!important;font-size:13px!important;padding:4px 8px!important;}.ops-g:hover{color:var(--txt)!important;background:var(--bg4)!important;}`;document.head.appendChild(s);})();

// Label dinâmico do hero Resumo conforme período ativo no GFLT
function _updateRHeroLabel() {
  const el=document.getElementById('r-hl'); if(!el) return;
  const G=window.GFLT||{modo:'mes'};
  const LABELS={
    tudo:'Total gasto (todos os dados)',
    mes:'Total gasto no mês',
    '7':'Total gasto (últimos 7 dias)',
    '30':'Total gasto (últimos 30 dias)',
    '90':'Total gasto (últimos 90 dias)',
    ano:'Total gasto no ano',
    custom:'Total gasto (período selecionado)',
  };
  el.textContent=LABELS[G.modo]||'Total gasto no mês';
}
