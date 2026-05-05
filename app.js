// FINANÇAS PESSOAIS v7.5
// Gerado limpo a partir do v6.5

const APP_VER = 'v7.8.4';
const VERSAO_ATUAL = '7.84';
const APP_VERSION = '7.84';
// FINANÇAS v6 — app.js
const K=k=>'fin6_'+k,gl=k=>{try{const v=localStorage.getItem(K(k));return v?JSON.parse(v):null}catch{return null}},gs=(k,v)=>localStorage.setItem(K(k),JSON.stringify(v));
let cats=gl('cats')||[{id:'ali',nome:'Alimentação',emoji:'🍽',cor:'#6366f1'},{id:'trp',nome:'Transporte',emoji:'🚗',cor:'#14b8a6'},{id:'laz',nome:'Lazer',emoji:'🎮',cor:'#8b5cf6'},{id:'sau',nome:'Saúde',emoji:'💊',cor:'#f43f5e'},{id:'com',nome:'Compras',emoji:'🛍',cor:'#f59e0b'},{id:'out',nome:'Outros',emoji:'📦',cor:'#64748b'}];
let subs=gl('subs')||[],carts=gl('carts')||[{id:'nu',nome:'Nubank',cor:'#8b5cf6',band:'Mastercard',accId:'',limite:5000,fech:10,venc:17}];
let pags=gl('pags')||[{id:'cr',nome:'Crédito',tipo:'credit'},{id:'db',nome:'Débito',tipo:'debit'},{id:'px',nome:'Pix',tipo:'pix'},{id:'dn',nome:'Dinheiro',tipo:'dinheiro'}];
let accs=gl('accs')||[{id:'def',nome:'Carteira',emoji:'👛',tipo:'carteira',cor:'#10b981',saldo:0}];
let desps=gl('desps')||[],orcs=gl('orcs')||{},pend=gl('pend')||[];
let cfg=gl('cfg')||{pin:'8888',col:false,bdg:true,asy:true,son:true,lock:false,shUrl:'',sheetUrl:'',nome:'',email:'',meta:0,avatar:'',theme:'dark'};
// Se config.js tem URL e cfg local não tem — usar a do config
if(typeof APP_SCRIPT_URL==='string' && APP_SCRIPT_URL.includes('script.google.com') && !cfg.shUrl){
  cfg.shUrl = APP_SCRIPT_URL;
}
let shEdits={},delItems=[],receiptData=null,deletedIds=gl('deletedIds')||[];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fmt=v=>'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

// parseMoeda: aceita vírgula OU ponto como decimal (Android/iOS safe)
const parseMoeda = v => {
  if (typeof v !== 'string') v = String(v ?? '');
  // Remover pontos de milhar e trocar vírgula por ponto
  v = v.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
const today=()=>new Date().toISOString().slice(0,10);
const mesKey=d=>(d||today()).slice(0,7);
const fmtD=d=>{if(!d)return '';const[y,m,dd]=d.split('-');return`${dd}/${m}/${y}`};
const clamp=n=>Math.min(100,Math.max(0,Math.round(n)));
function saveAll(){gs('cats',cats);gs('subs',subs);gs('carts',carts);gs('pags',pags);gs('accs',accs);gs('desps',desps);gs('orcs',orcs);gs('pend',pend);gs('cfg',cfg);gs('deletedIds',deletedIds)}
let curMes=today().slice(0,7),sbOpen=window.innerWidth>640,perStart=null,perEnd=null,calDate=new Date(),calSel=null;

// ── THEME ─────────────────────────────────────────────────────
function setTheme(t,el){cfg.theme=t;saveAll();document.documentElement.setAttribute('data-theme',t);document.querySelectorAll('.theme-swatch').forEach(s=>s.classList.remove('sel'));if(el)el.classList.add('sel');else document.querySelector(`.theme-swatch[data-t="${t}"]`)?.classList.add('sel')}
function applyTheme(){document.documentElement.setAttribute('data-theme',cfg.theme||'dark');document.querySelector(`.theme-swatch[data-t="${cfg.theme||'dark'}"]`)?.classList.add('sel')}

// ── PIN ────────────────────────────────────────────────────────
let pinBuf='';
function pk(k){if(pinBuf.length>=4)return;pinBuf+=k;updDots();if(pinBuf.length===4)setTimeout(chkPin,130)}
function pkDel(){if(pinBuf.length>0){pinBuf=pinBuf.slice(0,-1);updDots()}}
function updDots(err=false){for(let i=0;i<4;i++){const d=document.getElementById('pd'+i);d.className='pd';if(err)d.classList.add('err');else if(i<pinBuf.length)d.classList.add('on')}}
function chkPin(){if(pinBuf===cfg.pin){document.getElementById('lock').style.display='none';document.getElementById('shell').style.display='';pinBuf='';updDots();document.getElementById('pin-err').textContent='';_bootApp()}else{updDots(true);document.getElementById('pin-err').textContent='PIN incorreto';setTimeout(()=>{pinBuf='';updDots();document.getElementById('pin-err').textContent=''},1000)}}
function lockApp(){document.getElementById('shell').style.display='none';document.getElementById('lock').style.display='';pinBuf='';updDots();renderLockProfile()}
function renderLockProfile(){const box=document.getElementById('lk-av');if(!box)return;const nm=cfg.nome||'Finanças';document.getElementById('lk-title').textContent=nm;box.innerHTML=cfg.avatar&&cfg.avatar.length>10?`<img src="${cfg.avatar}" class="lk-avatar"/>`:`<div class="lk-avatar-init">${nm[0].toUpperCase()}</div>`}
function openChangePIN(){let step=0,np='',ep='';const steps=['PIN atual','Novo PIN','Confirme'];openModal('Alterar PIN','',null);document.getElementById('m-btns').style.display='none';document.getElementById('m-extra').innerHTML=`<div style="text-align:center"><div style="font-size:13px;color:var(--txt2);margin-bottom:11px" id="cp-l">${steps[0]}</div><div style="display:flex;gap:13px;justify-content:center;margin-bottom:14px">${[0,1,2,3].map(i=>`<div id="cpd${i}" style="width:13px;height:13px;border-radius:50%;border:2px solid var(--txt3);transition:all .15s"></div>`).join('')}</div><div style="display:grid;grid-template-columns:repeat(3,66px);gap:8px;margin:0 auto;width:fit-content">${[1,2,3,4,5,6,7,8,9,'—','0','⌫'].map(k=>`<button onclick="cpK('${k}')" style="height:58px;border-radius:10px;background:${k==='—'?'transparent':'var(--bg3)'};border:${k==='—'?'none':'0.5px solid var(--bdr2)'};color:var(--txt);font-size:20px;font-weight:500;cursor:pointer;font-family:inherit;pointer-events:${k==='—'?'none':'auto'}">${k}</button>`).join('')}</div><div style="color:var(--rose);font-size:12px;height:16px;margin-top:9px" id="cp-e"></div><button onclick="closeModal()" style="margin-top:11px;background:none;border:none;color:var(--txt3);font-size:12px;cursor:pointer;font-family:inherit">Cancelar</button></div>`;
window.cpK=function(k){if(k==='⌫')ep=ep.slice(0,-1);else if(ep.length<4&&k!=='—')ep+=k;for(let i=0;i<4;i++){document.getElementById('cpd'+i).style.background=i<ep.length?'var(--ind)':'transparent';document.getElementById('cpd'+i).style.borderColor=i<ep.length?'var(--ind)':'var(--txt3)';}if(ep.length===4){setTimeout(()=>{if(step===0){if(ep===cfg.pin){step=1;np='';ep='';document.getElementById('cp-l').textContent=steps[1]}else{document.getElementById('cp-e').textContent='PIN incorreto';setTimeout(()=>{ep='';document.getElementById('cp-e').textContent='';for(let i=0;i<4;i++){document.getElementById('cpd'+i).style.background='transparent';document.getElementById('cpd'+i).style.borderColor='var(--txt3)'}},800);return}}else if(step===1){np=ep;step=2;ep='';document.getElementById('cp-l').textContent=steps[2]}else{if(ep===np){cfg.pin=np;saveAll();closeModal();toast('✓ PIN alterado!')}else{document.getElementById('cp-e').textContent='PINs diferentes';setTimeout(()=>{step=1;np='';ep='';document.getElementById('cp-l').textContent=steps[1];document.getElementById('cp-e').textContent='';for(let i=0;i<4;i++){document.getElementById('cpd'+i).style.background='transparent';document.getElementById('cpd'+i).style.borderColor='var(--txt3)'}},900);return}}for(let i=0;i<4;i++){document.getElementById('cpd'+i).style.background='transparent';document.getElementById('cpd'+i).style.borderColor='var(--txt3)'}},100)}}}

// ── SIDEBAR ────────────────────────────────────────────────────

function openSB(){sbOpen=true;applySB();if(window.innerWidth<=640)document.getElementById('ov').classList.add('on')}
function closeSB(){const ov=document.getElementById('ov');if(ov)ov.classList.remove('on');sbOpen=false;applySB();}
function applySB(){const sb=document.getElementById('sb');if(window.innerWidth<=640){sb.classList.toggle('open',sbOpen);sb.classList.remove('col')}else{sb.classList.toggle('col',!sbOpen);sb.classList.remove('open')}}

// ── NAV ─────────────────────────────────────────────────────────

// ── MÊS ─────────────────────────────────────────────────────────
function initMesSel(){const ms=[...new Set([today().slice(0,7),...desps.map(d=>mesKey(d.data))])].sort().reverse();['mesSel','ex-mes','sh-mes'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.innerHTML=ms.map(m=>{const[y,mo]=m.split('-');const n=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return`<option value="${m}"${m===curMes?' selected':''}>${n}</option>`}).join('')});const[y,mo]=curMes.split('-');document.getElementById('sb-mes').textContent=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'})}
function initShMes(){const ms=[...new Set([today().slice(0,7),...desps.map(d=>mesKey(d.data))])].sort().reverse();const el=document.getElementById('sh-mes');if(!el)return;el.innerHTML=ms.map(m=>{const[y,mo]=m.split('-');const n=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'});return`<option value="${m}"${m===curMes?' selected':''}>${n}</option>`}).join('')}
function onMes(){curMes=document.getElementById('mesSel').value;renderAll()}
function setPer(t,btn){document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('act'));btn.classList.add('act');const now=new Date();document.getElementById('custom-range').style.display='none';if(t==='mes'){const y=now.getFullYear(),mo=now.getMonth();perStart=new Date(y,mo,1).toISOString().slice(0,10);perEnd=new Date(y,mo+1,0).toISOString().slice(0,10)}else if(t==='7'){perEnd=today();perStart=new Date(Date.now()-6*864e5).toISOString().slice(0,10)}else if(t==='30'){perEnd=today();perStart=new Date(Date.now()-29*864e5).toISOString().slice(0,10)}else if(t==='90'){perEnd=today();perStart=new Date(Date.now()-89*864e5).toISOString().slice(0,10)}else if(t==='ano'){perStart=now.getFullYear()+'-01-01';perEnd=now.getFullYear()+'-12-31'}else{document.getElementById('custom-range').style.display='block';return}renderTrans()}
function setPerDates(t){const now=new Date();if(t==='mes'){const y=now.getFullYear(),mo=now.getMonth();perStart=new Date(y,mo,1).toISOString().slice(0,10);perEnd=new Date(y,mo+1,0).toISOString().slice(0,10)}}

// ── SELECTS ──────────────────────────────────────────────────────
function populateForm(){const mp={pag:'<option value="">Selecione...</option>'+pags.map(p=>`<option value="${p.id}">${p.nome}</option>`).join(''),cat:'<option value="">Selecione...</option>'+cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join(''),cart:'<option value="">Selecione...</option>'+carts.map(c=>`<option value="${c.id}">${c.nome}</option>`).join(''),acc:'<option value="">Selecione...</option>'+accs.map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('')};Object.entries(mp).forEach(([k,v])=>{const el=document.getElementById('l-'+k);if(el)el.innerHTML=v})}
function populateCatSels(){const np=document.getElementById('ns-p');if(np)np.innerHTML='<option value="">Selecione...</option>'+cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}
function populateParcCatSel(){const el=document.getElementById('parc-cat');if(el)el.innerHTML='<option value="">Todas categorias</option>'+cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('')}
function populateRSels(){
  const rc=document.getElementById('r-cat-sel');if(rc)rc.innerHTML='<option value="">Todas categorias</option>'+cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');
  const rs=document.getElementById('r-sub-sel');if(rs)rs.innerHTML='<option value="">Todas subcategorias</option>'+subs.map(s=>`<option value="${s.id}">${s.nome}</option>`).join('');
  const ra=document.getElementById('r-acc-sel');if(ra)ra.innerHTML='<option value="">Todas contas</option>'+accs.map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
  const rp=document.getElementById('r-pag-sel');if(rp)rp.innerHTML='<option value="">Todos pagamentos</option>'+pags.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('');
}
function populateCartCCSel(){const el=document.getElementById('cc-acc');if(el)el.innerHTML='<option value="">Nenhuma</option>'+accs.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('')}
function populateDelSels(){const mp={'del-cat':'<option value="">Todas categorias</option>'+cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join(''),'del-sub':'<option value="">Todas subcategorias</option>'+subs.map(s=>`<option value="${s.id}">${s.nome}</option>`).join(''),'del-card':'<option value="">Todos cartões</option>'+carts.map(c=>`<option value="${c.id}">${c.nome}</option>`).join(''),'del-acc':'<option value="">Todas contas</option>'+accs.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('')};Object.entries(mp).forEach(([id,html])=>{const el=document.getElementById(id);if(el)el.innerHTML=html})}
function onPag(){const p=pags.find(x=>x.id===document.getElementById('l-pag').value);const show=p&&(p.tipo==='credit'||p.tipo==='debit');document.getElementById('l-card-row').style.display=show?'flex':'none';if(!show){document.getElementById('l-parc').checked=false;document.getElementById('l-pb').style.display='none'}}
function onCat(){const id=document.getElementById('l-cat').value;document.getElementById('l-sub').innerHTML='<option value="">Nenhuma</option>'+subs.filter(s=>s.pai===id).map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}
function onParc(){document.getElementById('l-pb').style.display=document.getElementById('l-parc').checked?'block':'none';calcPV()}
function calcPV(){const v=parseMoeda(document.getElementById('l-val').value)||0,n=parseInt(document.getElementById('l-np').value)||2;document.getElementById('l-pv').textContent=n>0?fmt(v/n):'R$ 0,00'}

// ── COMPROVANTE (auto-resize, sem erro para foto grande) ──────────
function handleReceipt(input){const f=input.files[0];if(!f)return;const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),img=new Image();img.onload=()=>{const mw=1000,ratio=Math.min(1,mw/Math.max(img.width,img.height));canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);ctx.drawImage(img,0,0,canvas.width,canvas.height);receiptData=canvas.toDataURL('image/jpeg',.82);const prev=document.getElementById('receipt-prev');if(prev){prev.innerHTML=`<div style="position:relative;display:inline-block"><img src="${receiptData}" style="max-width:100%;max-height:140px;border-radius:8px;border:0.5px solid var(--bdr2);display:block"/><button onclick="clearReceipt()" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;width:21px;height:21px;cursor:pointer;font-size:12px;line-height:1">✕</button></div>`;prev.style.display='block'}toast('Comprovante adicionado ✓')};img.onerror=()=>toast('Não foi possível carregar a imagem');img.src=URL.createObjectURL(f)}
function clearReceipt(){receiptData=null;const p=document.getElementById('receipt-prev');if(p){p.innerHTML='';p.style.display='none'}toast('Comprovante removido')}
function showReceipt(id){const d=desps.find(x=>x.id===id);if(!d?.receipt)return;openModal('Comprovante','',null);document.getElementById('m-btns').style.display='none';document.getElementById('m-extra').innerHTML=`<img src="${d.receipt}" style="width:100%;border-radius:8px;margin-top:8px"/><button class="btn sm" style="width:100%;margin-top:11px" onclick="closeModal()">Fechar</button>`}

// ── ADD DESPESA ──────────────────────────────────────────────────
function addDesp(){const desc=document.getElementById('l-desc').value.trim(),valor=parseMoeda(document.getElementById('l-val').value),data=document.getElementById('l-date').value||today(),cartId=document.getElementById('l-cart').value,catId=document.getElementById('l-cat').value,subId=document.getElementById('l-sub').value,accId=document.getElementById('l-acc').value,obs=document.getElementById('l-obs').value.trim(),parcel=document.getElementById('l-parc').checked,nparc=parseInt(document.getElementById('l-np').value)||1;let pagId=document.getElementById('l-pag').value;const _cart=carts.find(x=>x.id===cartId);if(_cart){if(_cart.tipoUso==='credit'){const px=pags.find(p=>p.tipo==='credit');if(px)pagId=px.id;}else if(_cart.tipoUso==='debit'){const px=pags.find(p=>p.tipo==='debit');if(px)pagId=px.id;}else{const px=pags.find(p=>p.id===pagId);if(!px||(px.tipo!=='credit'&&px.tipo!=='debit')){toast('Cartão dual: selecione Crédito ou Débito.');return;}}}if(!desc||!valor||valor<=0){toast('Preencha descrição e valor.');return}if(!accId){toast('Selecione a Conta.');return}if(!cartId){toast('Selecione o Cartão.');return}if(!catId){toast('Selecione a Categoria.');return}if(!pagId){toast('Selecione a forma de pagamento.');return}const newIds=[];if(parcel&&nparc>=2){const pv=valor/nparc,gid=uid();for(let i=1;i<=nparc;i++){const d=new Date(data);d.setMonth(d.getMonth()+(i-1));const id=uid();desps.unshift({id,desc,valor:pv,data:d.toISOString().slice(0,10),pagId,cartId,catId,subId,accId,obs,parcela:i,totalParcelas:nparc,grupoId:gid,ss:'p',receipt:i===1?receiptData:null});newIds.push(id)}}else{const id=uid();desps.unshift({id,desc,valor,data,pagId,cartId,catId,subId,accId,obs,ss:'p',receipt:receiptData});newIds.push(id)}pend.push(...newIds);receiptData=null;const prev=document.getElementById('receipt-prev');if(prev){prev.innerHTML='';prev.style.display='none'}saveAll();initMesSel();renderAll();updSyncBnr();['l-desc','l-val','l-obs'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});document.getElementById('l-parc').checked=false;document.getElementById('l-pb').style.display='none';toast('Despesa adicionada!');if(cfg.son&&navigator.onLine)setTimeout(doSync,600)}

// ── EDIT / DEL ───────────────────────────────────────────────────
function editDesp(id){const d=desps.find(x=>x.id===id);if(!d)return;openModal('Editar despesa','',null);document.getElementById('m-btns').style.display='none';const so=subs.filter(s=>s.pai===d.catId).map(s=>`<option value="${s.id}"${s.id===d.subId?' selected':''}>${s.nome}</option>`).join('');document.getElementById('m-extra').innerHTML=`<div style="display:flex;flex-direction:column;gap:8px"><div class="edit-row"><label>Descrição</label><input id="ed-desc" value="${d.desc}" style="flex:1"/></div><div class="edit-row"><label>Valor R$</label><input id="ed-val" type="number" value="${d.valor.toFixed(2)}" style="width:110px"/></div><div class="edit-row"><label>Data</label><input id="ed-date" type="date" value="${d.data}" style="flex:1"/></div><div class="edit-row"><label>Categoria</label><select id="ed-cat" style="flex:1" onchange="edCatCh()"><option value="">—</option>${cats.map(c=>`<option value="${c.id}"${c.id===d.catId?' selected':''}>${c.nome}</option>`).join('')}</select></div><div class="edit-row"><label>Subcategoria</label><select id="ed-sub" style="flex:1"><option value="">—</option>${so}</select></div><div class="edit-row"><label>Pagamento</label><select id="ed-pag" style="flex:1"><option value="">—</option>${pags.map(p=>`<option value="${p.id}"${p.id===d.pagId?' selected':''}>${p.nome}</option>`).join('')}</select></div><div class="edit-row"><label>Conta</label><select id="ed-acc" style="flex:1"><option value="">—</option>${accs.map(a=>`<option value="${a.id}"${a.id===d.accId?' selected':''}>${a.nome}</option>`).join('')}</select></div><div class="edit-row"><label>Obs.</label><input id="ed-obs" value="${d.obs||''}" style="flex:1"/></div>${d.receipt?`<div><img src="${d.receipt}" style="max-width:100%;max-height:110px;border-radius:7px;border:0.5px solid var(--bdr2)"/></div>`:''}${d.totalParcelas?`<div style="font-size:11px;color:var(--txt3)">Parcela ${d.parcela}/${d.totalParcelas} — edita só esta</div>`:''}<div style="display:flex;gap:7px;margin-top:4px"><button class="btn pr sm" style="flex:1" onclick="saveEdit('${id}')">Salvar</button><button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button><button class="btn dn sm" onclick="delDesp('${id}');closeModal()">Apagar</button></div></div>`}
function edCatCh(){const id=document.getElementById('ed-cat').value;document.getElementById('ed-sub').innerHTML='<option value="">—</option>'+subs.filter(s=>s.pai===id).map(s=>`<option value="${s.id}">${s.nome}</option>`).join('')}
function saveEdit(id){const idx=desps.findIndex(x=>x.id===id);if(idx<0)return;desps[idx].desc=document.getElementById('ed-desc').value.trim()||desps[idx].desc;desps[idx].valor=parseMoeda(document.getElementById('ed-val').value)||desps[idx].valor;desps[idx].data=document.getElementById('ed-date').value||desps[idx].data;desps[idx].catId=document.getElementById('ed-cat').value;desps[idx].subId=document.getElementById('ed-sub').value;desps[idx].pagId=document.getElementById('ed-pag').value;desps[idx].accId=document.getElementById('ed-acc').value;desps[idx].obs=document.getElementById('ed-obs').value.trim();desps[idx].ss='p';if(!pend.includes(id))pend.push(id);saveAll();closeModal();renderAll();updSyncBnr();toast('Atualizado!')}
function delDesp(id){openModal('Remover despesa?','Esta ação não pode ser desfeita.',async ()=>{
  desps=desps.filter(d=>d.id!==id);
  pend=pend.filter(p=>p!==id);
  if(!deletedIds.includes(id))deletedIds.push(id);
  saveAll();renderAll();renderBadge();renderTrans();renderResumo();updSyncBnr();
  // Push deletion to sheet immediately if online
  if(cfg.shUrl&&navigator.onLine){
    try{
      await fetch(cfg.shUrl,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'deleteRow',id})});
    }catch{}
    // Also save updated AppData so other devices see it gone
    await saveAppData();
  }
})}

// ── DESP HTML ─────────────────────────────────────────────────────
function despHTML(x){
  const cat=cats.find(c=>c.id===x.catId),sub=subs.find(s=>s.id===x.subId),
        pag=pags.find(p=>p.id===x.pagId),cart=carts.find(c=>c.id===x.cartId),
        acc=accs.find(a=>a.id===x.accId);
  const cor=cat?cat.cor:'#6366f1', emoji=cat?cat.emoji||'📦':'📦';
  const isFut=x.data>today(), isSynced=x.ss==='s';
  const pBdg=x.totalParcelas?`<span class="bdg pa" style="font-size:9px">${x.parcela}/${x.totalParcelas}</span>`:'';
  const subParts=[sub?sub.nome:'',cat?cat.nome:'',cart?cart.nome:'',acc?(acc.emoji||'🏦')+' '+acc.nome:''].filter(Boolean);
  const subLine=subParts.slice(0,2).join(' · ');
  const rcpt=x.receipt?`<img src="${x.receipt}" onclick="event.stopPropagation();showReceipt('${x.id}')" style="width:32px;height:32px;border-radius:6px;object-fit:cover;border:0.5px solid var(--bdr2);cursor:pointer;margin-top:4px;flex-shrink:0"/>`:'';
  return `<div class="tx-item${isFut?' cal-fut':''}" onclick="editDesp('${x.id}')">
    <div class="tx-icon" style="background:${cor}25;border:0.5px solid ${cor}44">
      <span style="font-size:20px">${emoji}</span>
      ${isSynced?`<div class="tx-check"><svg viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`:''}
    </div>
    <div class="tx-body">
      <div class="tx-name">${x.desc}${x.obs?` <span style="font-size:11px;color:var(--txt3);font-weight:400">· ${x.obs}</span>`:''}</div>
      <div class="tx-sub">${subLine||pag?pag.nome:''}${pBdg?' '+pBdg:''}</div>
      ${rcpt}
    </div>
    <div class="tx-right">
      <div class="tx-amount">${fmt(x.valor)}</div>
      <div class="tx-date">${fmtD(x.data)}</div>
      <div style="display:flex;gap:3px;margin-top:5px;justify-content:flex-end" onclick="event.stopPropagation()">
        <button class="btn xs dn" onclick="delDesp('${x.id}')" style="padding:3px 7px">✕</button>
      </div>
    </div>
  </div>`;
}

function renderResumo(){const mes=curMes,rcat=(document.getElementById('r-cat-sel')||{}).value||'',rsub=(document.getElementById('r-sub-sel')||{}).value||'';let d=desps.filter(x=>mesKey(x.data)===mes);if(rcat)d=d.filter(x=>x.catId===rcat);if(rsub)d=d.filter(x=>x.subId===rsub);const tot=d.reduce((s,x)=>s+x.valor,0),cart=d.filter(x=>{const p=pags.find(q=>q.id===x.pagId);return p&&(p.tipo==='credit'||p.tipo==='debit')}).reduce((s,x)=>s+x.valor,0),pixdn=d.filter(x=>{const p=pags.find(q=>q.id===x.pagId);return p&&(p.tipo==='pix'||p.tipo==='dinheiro')}).reduce((s,x)=>s+x.valor,0),pf=desps.filter(x=>x.totalParcelas&&mesKey(x.data)>mes).reduce((s,x)=>s+x.valor,0);document.getElementById('r-tot').textContent=fmt(tot);document.getElementById('r-sub').textContent=`${d.length} lançamento${d.length!==1?'s':''}`;document.getElementById('r-cart').textContent=fmt(cart);document.getElementById('r-pix').textContent=fmt(pixdn);document.getElementById('r-pf').textContent=fmt(pf);const bc={};d.forEach(x=>{if(x.catId)bc[x.catId]=(bc[x.catId]||0)+x.valor});const mx=Math.max(...Object.values(bc),1);document.getElementById('r-cats').innerHTML=Object.keys(bc).length?Object.entries(bc).sort((a,b)=>b[1]-a[1]).map(([id,v])=>{const c=cats.find(x=>x.id===id)||{nome:id,cor:'#888',emoji:'📦'},orc=orcs[id],pct=clamp(v/mx*100),orcPct=orc?clamp(v/orc*100):null,col=orcPct&&orcPct>=100?'var(--rose)':orcPct&&orcPct>=80?'var(--amb)':c.cor;return`<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px"><span style="font-size:13px;width:17px;flex-shrink:0">${c.emoji||'📦'}</span><span style="font-size:12px;width:78px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--txt2)">${c.nome}</span><div class="prog"><div class="pf" style="width:${pct}%;background:${col}"></div></div><span style="font-size:11px;color:var(--txt2);width:66px;text-align:right;flex-shrink:0">${fmt(v)}${orc?`<br><span style="font-size:9px;color:var(--txt3)">/ ${fmt(orc)}</span>`:''}</span></div>`}).join(''):'<div class="empty">Sem lançamentos este mês</div>';const bacc={};d.filter(x=>x.accId).forEach(x=>{bacc[x.accId]=(bacc[x.accId]||0)+x.valor});document.getElementById('r-accs').innerHTML=Object.keys(bacc).length?Object.entries(bacc).sort((a,b)=>b[1]-a[1]).map(([id,v])=>{const a=accs.find(x=>x.id===id)||{nome:id,emoji:'🏦'};return`<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:0.5px solid var(--bdr)"><span style="font-size:13px">${a.emoji||'🏦'} ${a.nome}</span><span style="font-size:13px;font-weight:700;color:var(--rose)">${fmt(v)}</span></div>`}).join(''):'<div class="empty">Sem gastos por conta</div>'}

// ── TRANSAÇÕES ────────────────────────────────────────────────────
const FLT = { accs:[], carts:[], cats:[], subs:[], pags:[] };

function getFiltered(){
  const d1 = perStart || today().slice(0,8)+'01';
  const d2 = perEnd   || today();
  const cd1 = (document.getElementById('f-d1')||{}).value || d1;
  const cd2 = (document.getElementById('f-d2')||{}).value || d2;
  const fq  = ((document.getElementById('f-q')||{}).value||'').toLowerCase();

  let list = desps.filter(x => x.data >= cd1 && x.data <= cd2);

  // Multi-select via FLT[]
  if (FLT.accs.length)  list = list.filter(x => FLT.accs.includes(x.accId));
  if (FLT.carts.length) list = list.filter(x => FLT.carts.includes(x.cartId));
  if (FLT.pags.length)  list = list.filter(x => FLT.pags.includes(x.pagId));
  if (FLT.cats.length)  list = list.filter(x => FLT.cats.includes(x.catId));
  if (FLT.subs.length)  list = list.filter(x => FLT.subs.includes(x.subId));

  // Fallback: selects antigos (se existirem e FLT estiver vazio)
  if (!FLT.pags.length)  { const v=(document.getElementById('f-pag')||{}).value; if(v) list=list.filter(x=>x.pagId===v); }
  if (!FLT.carts.length) { const v=(document.getElementById('f-card')||{}).value; if(v) list=list.filter(x=>x.cartId===v); }
  if (!FLT.cats.length)  { const v=(document.getElementById('f-cat')||{}).value; if(v) list=list.filter(x=>x.catId===v); }
  if (!FLT.subs.length)  { const v=(document.getElementById('f-sub')||{}).value; if(v) list=list.filter(x=>x.subId===v); }
  if (!FLT.accs.length)  { const v=(document.getElementById('f-acc')||{}).value; if(v) list=list.filter(x=>x.accId===v); }

  if (fq) list = list.filter(x => (x.desc+' '+(x.obs||'')).toLowerCase().includes(fq));
  list.sort((a,b) => b.data.localeCompare(a.data));
  return list;
}
function renderTrans(){const list=getFiltered(),tot=list.reduce((s,x)=>s+x.valor,0);document.getElementById('t-lbl').textContent=list.length+' transaç'+(list.length===1?'ão':'ões');document.getElementById('t-tot').textContent=fmt(tot);document.getElementById('list-trans').innerHTML=list.length?list.map(x=>despHTML(x)).join(''):'<div class="empty">Nenhuma transação encontrada</div>'}

// ── CALENDÁRIO ────────────────────────────────────────────────────
function renderCal(){const y=calDate.getFullYear(),m=calDate.getMonth();document.getElementById('cal-title').textContent=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();const grid=document.getElementById('cal-grid');grid.innerHTML='Dom Seg Ter Qua Qui Sex Sáb'.split(' ').map(d=>`<div class="cal-dow">${d}</div>`).join('');const ts=today();for(let i=0;i<fd;i++)grid.innerHTML+=`<div class="cal-day other"></div>`;for(let day=1;day<=dim;day++){const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;const dd=desps.filter(d=>d.data===ds),iT=ds===ts,iS=ds===calSel,iF=ds>ts;const dots=dd.slice(0,5).map(d=>{const c=cats.find(x=>x.id===d.catId);return`<div class="cal-dot" style="background:${c?c.cor:'#888'};${iF?'opacity:.4':''}"></div>`}).join('');grid.innerHTML+=`<div class="cal-day${iT?' today':''}${iS?' sel':''}${iF?' fut':''}" onclick="calClick('${ds}')"><span class="cal-num">${day}</span><div class="cal-dots">${dots}</div></div>`}renderCalDetail()}
function calClick(ds){calSel=calSel===ds?null:ds;renderCal()}
function calPrev(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()-1,1);renderCal()}
function calNext(){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+1,1);renderCal()}
function renderCalDetail(){const el=document.getElementById('cal-detail');if(!calSel){el.innerHTML='';return}const dd=desps.filter(d=>d.data===calSel),tot=dd.reduce((s,d)=>s+d.valor,0),iF=calSel>today();el.innerHTML=`<div class="cal-detail"><div class="cdh"><span class="cdt">${fmtD(calSel)}${iF?' <span class="bdg cr" style="font-size:9px">futura</span>':''}</span><span class="cda">${fmt(tot)}</span></div>${dd.length?dd.map(x=>despHTML(x)).join(''):'<div class="empty">Sem lançamentos</div>'}</div>`}

// ── PARCELAS — com filtro + colapsável ───────────────────────────

function delParcGroup(grupoId){
  openModal('Remover parcelamento?','Todas as parcelas deste parcelamento serão removidas.',async ()=>{
    const toDelete=desps.filter(d=>d.grupoId===grupoId||d.id===grupoId).map(d=>d.id);
    toDelete.forEach(id=>{if(!deletedIds.includes(id))deletedIds.push(id)});
    desps=desps.filter(d=>!toDelete.includes(d.id));
    pend=pend.filter(p=>!toDelete.includes(p));
    saveAll();renderParcs();renderResumo();updSyncBnr();
    if(cfg.shUrl&&navigator.onLine){
      for(const id of toDelete){
        try{await fetch(cfg.shUrl,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'deleteRow',id})})}catch{}
      }
      await saveAppData();
    }
    toast('Parcelamento removido!');
  });
}
function toggleParc(i){const body=document.getElementById('pbody'+i),chev=document.getElementById('pchev'+i);if(!body)return;const open=body.classList.toggle('open');if(chev)chev.classList.toggle('open',open)}

// ── CONTAS ────────────────────────────────────────────────────────
function renderAccSummary(){const el=document.getElementById('acc-summary'),total=accs.reduce((s,a)=>s+a.saldo,0);el.innerHTML=`<div class="hero" style="margin-bottom:10px"><div class="hl">Saldo total</div><div class="hv" style="color:${total>=0?'#fff':'var(--rose)'}">${fmt(total)}</div><div class="hs">${accs.length} conta${accs.length!==1?'s':''}</div></div>`}
function renderAccList(){document.getElementById('acc-list').innerHTML=accs.length?accs.map(a=>{const g=desps.filter(d=>d.accId===a.id&&mesKey(d.data)===curMes).reduce((s,d)=>s+d.valor,0);return`<div class="acc-card"><div class="acc-icon" style="background:${a.cor}22">${a.emoji||'🏦'}</div><div style="flex:1;min-width:0"><div class="acc-name">${a.nome}</div><div class="acc-sub">${a.tipo} · gasto ${fmt(g)} este mês</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px"><div class="acc-bal ${a.saldo>=0?'pos':'neg'}">${fmt(a.saldo)}</div><div style="display:flex;gap:3px"><button class="btn xs" onclick="editAcc('${a.id}')">✏️</button><button class="btn xs dn" onclick="delAcc('${a.id}')">✕</button></div></div></div>`}).join(''):'<div class="empty">Nenhuma conta</div>'}
function addAcc(){const nome=document.getElementById('ac-nome').value.trim();if(!nome){toast('Informe o nome.');return}accs.push({id:uid(),nome,emoji:document.getElementById('ac-emoji').value.trim()||'🏦',tipo:document.getElementById('ac-tipo').value,cor:document.getElementById('ac-cor').value,saldo:parseMoeda(document.getElementById('ac-saldo').value)||0});saveAll();renderAccSummary();renderCfgContas();closeAddAcc();populateFlt();populateForm();toast('Conta salva!');populateCartCCSel();['ac-nome','ac-emoji','ac-saldo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});toast('Conta adicionada!')}
function editAcc(id){const a=accs.find(x=>x.id===id);if(!a)return;openModal('Editar conta','',null);document.getElementById('m-btns').style.display='none';document.getElementById('m-extra').innerHTML=`<div style="display:flex;flex-direction:column;gap:8px"><div class="edit-row"><label>Nome</label><input id="ea-n" value="${a.nome}" style="flex:1"/></div><div class="edit-row"><label>Emoji</label><input id="ea-e" value="${a.emoji||''}" maxlength="2" style="width:50px;text-align:center"/></div><div class="edit-row"><label>Saldo R$</label><input id="ea-s" type="number" value="${a.saldo}" step="0.01" style="width:120px"/></div><div class="edit-row"><label>Cor</label><input id="ea-c" type="color" value="${a.cor}" style="width:50px;height:36px"/></div><div style="display:flex;gap:7px;margin-top:4px"><button class="btn pr sm" style="flex:1" onclick="saveAccEdit('${id}')">Salvar</button><button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button></div></div>`}
function saveAccEdit(id){const idx=accs.findIndex(x=>x.id===id);if(idx<0)return;accs[idx].nome=document.getElementById('ea-n').value.trim()||accs[idx].nome;accs[idx].emoji=document.getElementById('ea-e').value.trim();accs[idx].saldo=parseMoeda(document.getElementById('ea-s').value)||0;accs[idx].cor=document.getElementById('ea-c').value;saveAll();closeModal();renderCfgContas();populateFlt();populateForm();renderAccSummary();renderAccList();toast('Conta atualizada!')}
function delAcc(id){openModal('Remover conta?','',()=>{accs=accs.filter(a=>a.id!==id);saveAll();renderAccSummary();renderAccList()})}

// ── CARTÕES + FILTRO ──────────────────────────────────────────────
function renderCartFlt(){const cs=document.getElementById('cf-card');if(cs)cs.innerHTML='<option value="">Todos os cartões</option>'+carts.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');const cm=document.getElementById('cf-mes');if(cm){const ms=[...new Set([today().slice(0,7),...desps.map(d=>mesKey(d.data))])].sort().reverse();cm.innerHTML='<option value="">Este mês</option>'+ms.map(m=>{const[y,mo]=m.split('-');const n=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'});return`<option value="${m}"${m===curMes?' selected':''}>${n}</option>`}).join('')}renderCartList()}
function renderCartList(){const cf=(document.getElementById('cf-card')||{}).value||'',cm=(document.getElementById('cf-mes')||{}).value||curMes,cd1=(document.getElementById('cf-d1')||{}).value||'',cd2=(document.getElementById('cf-d2')||{}).value||'';const el=document.getElementById('cart-list'),tc=carts.filter(c=>!cf||c.id===cf);if(!tc.length){el.innerHTML='<div class="empty">Nenhum cartão</div>';return}el.innerHTML=tc.map(c=>{let dd=desps.filter(d=>d.cartId===c.id);if(cd1&&cd2)dd=dd.filter(d=>d.data>=cd1&&d.data<=cd2);else dd=dd.filter(d=>mesKey(d.data)===(cm||curMes));const gasto=dd.reduce((s,d)=>s+d.valor,0),pct=c.limite?clamp(gasto/c.limite*100):0,col=pct>=90?'var(--rose)':pct>=75?'var(--amb)':c.cor,acc=accs.find(a=>a.id===c.accId),recent=dd.slice(0,5);return`<div class="card" style="margin-bottom:10px"><div class="ch"><div style="display:flex;align-items:center;gap:8px"><div class="cchip" style="background:${c.cor}22;color:${c.cor}">${c.nome.slice(0,2).toUpperCase()}</div><div><div style="font-size:14px;font-weight:700">${c.nome} <span style="font-size:10px;color:var(--txt3)">${c.band}</span></div><div style="font-size:11px;color:var(--txt2)">Fecha ${c.fech} · Vence ${c.venc}${acc?' · '+acc.nome:''}${c.limite?' · Limite '+fmt(c.limite):''}</div></div></div><div style="display:flex;gap:3px"><button class="btn xs" onclick="editCart('${c.id}')">✏️</button><button class="btn xs dn" onclick="delCart('${c.id}')">✕</button></div></div><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px"><span style="font-size:11px;color:var(--txt2)">Gasto no período</span><span style="font-size:17px;font-weight:800;color:var(--rose)">${fmt(gasto)}</span></div>${c.limite?`<div class="prog" style="margin-bottom:3px"><div class="pf" style="width:${pct}%;background:${col}"></div></div><div style="font-size:10px;color:${col};margin-bottom:8px">${pct}% do limite (${fmt(c.limite)})</div>`:''}${recent.length?`<div style="border-top:0.5px solid var(--bdr);padding-top:7px"><div style="font-size:10px;color:var(--txt3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Últimas transações</div>${recent.map(x=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:0.5px solid var(--bdr)"><div><div style="font-size:12px;font-weight:500">${x.desc}${x.totalParcelas?` <span class="bdg pa" style="font-size:9px">${x.parcela}/${x.totalParcelas}</span>`:''}</div><div style="font-size:10px;color:var(--txt3)">${fmtD(x.data)}</div></div><span style="font-size:12px;font-weight:700;color:var(--rose)">${fmt(x.valor)}</span></div>`).join('')}${dd.length>5?`<div style="font-size:11px;color:var(--txt3);text-align:center;padding:5px 0">+ ${dd.length-5} mais</div>`:''}</div>`:''}</div>`}).join('')}
function addCart(){const nome=document.getElementById('cc-nome').value.trim();if(!nome){toast('Informe o nome.');return}const tipoEl=document.getElementById('cc-tipo'),tipoUso=tipoEl?tipoEl.value:'ambos';const corEl=document.getElementById('cc-cor');const fechEl=document.getElementById('cc-fec')||document.getElementById('cc-fech');const vencEl=document.getElementById('cc-vec')||document.getElementById('cc-venc');const editId=tipoEl&&tipoEl.dataset.editId;if(editId){const idx=carts.findIndex(c=>c.id===editId);if(idx>=0){carts[idx]={...carts[idx],nome,cor:corEl?corEl.value:carts[idx].cor,band:document.getElementById('cc-band').value,accId:document.getElementById('cc-acc').value,limite:parseMoeda(document.getElementById('cc-lim').value)||0,fech:parseInt(fechEl?fechEl.value:'')||10,venc:parseInt(vencEl?vencEl.value:'')||17,tipoUso};}}else{carts.push({id:uid(),nome,cor:corEl?corEl.value:'#6366f1',band:document.getElementById('cc-band').value,accId:document.getElementById('cc-acc').value,limite:parseMoeda(document.getElementById('cc-lim').value)||0,fech:parseInt(fechEl?fechEl.value:'')||10,venc:parseInt(vencEl?vencEl.value:'')||17,tipoUso,ativa:true});}saveAll();if(typeof renderCfgCartoes==='function')renderCfgCartoes();if(typeof renderCartList==='function')renderCartList();closeAddCart();if(typeof renderCartFlt==='function')renderCartFlt();if(typeof populateFlt==='function')populateFlt();populateForm();document.getElementById('cc-nome').value='';if(tipoEl)tipoEl.dataset.editId='';const btn=document.getElementById('cc-save-btn');if(btn)btn.textContent='Salvar';toast(editId?'Cartão atualizado!':'Cartão salvo!');}
function editCart(id){const c=carts.find(x=>x.id===id);if(!c)return;openModal('Editar cartão','',null);document.getElementById('m-btns').style.display='none';document.getElementById('m-extra').innerHTML=`<div style="display:flex;flex-direction:column;gap:8px"><div class="edit-row"><label>Nome</label><input id="ec-n" value="${c.nome}" style="flex:1"/></div><div class="edit-row"><label>Limite R$</label><input id="ec-l" type="number" value="${c.limite}" style="width:110px"/></div><div class="edit-row"><label>Fechamento</label><input id="ec-f" type="number" value="${c.fech}" min="1" max="28" style="width:60px"/></div><div class="edit-row"><label>Vencimento</label><input id="ec-v" type="number" value="${c.venc}" min="1" max="28" style="width:60px"/></div><div class="edit-row"><label>Conta</label><select id="ec-acc" style="flex:1"><option value="">Nenhuma</option>${accs.map(a=>`<option value="${a.id}"${a.id===c.accId?' selected':''}>${a.nome}</option>`).join('')}</select></div><div class="edit-row"><label>Cor</label><input id="ec-cor" type="color" value="${c.cor}" style="width:50px;height:36px"/></div><div style="display:flex;gap:7px;margin-top:4px"><button class="btn pr sm" style="flex:1" onclick="saveCartEdit('${id}')">Salvar</button><button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button></div></div>`}
function saveCartEdit(id){const idx=carts.findIndex(x=>x.id===id);if(idx<0)return;carts[idx].nome=document.getElementById('ec-n').value.trim()||carts[idx].nome;carts[idx].limite=parseMoeda(document.getElementById('ec-l').value)||0;carts[idx].fech=parseInt(document.getElementById('ec-f').value)||carts[idx].fech;carts[idx].venc=parseInt(document.getElementById('ec-v').value)||carts[idx].venc;carts[idx].accId=document.getElementById('ec-acc').value;carts[idx].cor=document.getElementById('ec-cor').value;saveAll();closeModal();renderCfgCartoes();populateFlt();populateForm();renderCartFlt();toast('Cartão atualizado!')}
function delCart(id){openModal('Remover cartão?','',()=>{carts=carts.filter(c=>c.id!==id);saveAll();renderCartFlt()})}

// ── CATEGORIAS ────────────────────────────────────────────────────

function renderCats(){document.getElementById('cat-list').innerHTML=cats.length?cats.map(c=>`<div class="item"><div class="swatch" style="background:${c.cor}"></div><div class="im"><div class="in">${c.emoji||''} ${c.nome}</div><div class="is">${subs.filter(s=>s.pai===c.id).map(s=>s.nome).join(', ')||'sem subcategorias'}</div></div><div style="display:flex;gap:3px"><button class="btn xs" onclick="editCat('${c.id}')">✏️</button><button class="btn xs dn" onclick="delCat('${c.id}')">✕</button></div></div>`).join(''):'<div class="empty">Nenhuma categoria</div>';document.getElementById('sub-list').innerHTML=subs.length?subs.map(s=>{const p=cats.find(c=>c.id===s.pai);return`<div class="item"><div class="im"><div class="in">${s.nome}</div><div class="is">${p?p.nome:'—'}</div></div><div style="display:flex;gap:3px"><button class="btn xs" onclick="editSub('${s.id}')">✏️</button><button class="btn xs dn" onclick="delSub('${s.id}')">✕</button></div></div>`}).join(''):'<div class="empty">Nenhuma subcategoria</div>'}
function addCat(){const nome=document.getElementById('nc-n').value.trim();if(!nome){toast('Informe o nome.');return}cats.push({id:uid(),nome,cor:document.getElementById('nc-c').value,emoji:document.getElementById('nc-e').value.trim()});saveAll();renderCfgCats();closeAddCat();populateFlt();populateForm();populateCatSels();renderCats();document.getElementById('nc-n').value='';document.getElementById('nc-e').value='';toast('Categoria salva!')}
function editCat(id){const c=cats.find(x=>x.id===id);if(!c)return;openModal('Editar categoria','',null);document.getElementById('m-btns').style.display='none';document.getElementById('m-extra').innerHTML=`<div style="display:flex;flex-direction:column;gap:8px"><div class="edit-row"><label>Nome</label><input id="ec2-n" value="${c.nome}" style="flex:1"/></div><div class="edit-row"><label>Emoji</label><input id="ec2-e" value="${c.emoji||''}" maxlength="2" style="width:50px;text-align:center"/></div><div class="edit-row"><label>Cor</label><input id="ec2-c" type="color" value="${c.cor}" style="width:50px;height:36px"/></div><div style="display:flex;gap:7px;margin-top:4px"><button class="btn pr sm" style="flex:1" onclick="saveCatEdit('${id}')">Salvar</button><button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button></div></div>`}
function saveCatEdit(id){const idx=cats.findIndex(x=>x.id===id);if(idx<0)return;cats[idx].nome=document.getElementById('ec2-n').value.trim()||cats[idx].nome;cats[idx].emoji=document.getElementById('ec2-e').value.trim();cats[idx].cor=document.getElementById('ec2-c').value;saveAll();closeModal();renderCfgCats();populateFlt();populateForm();renderCats();toast('Categoria atualizada!')}
function delCat(id){openModal('Remover?','Subcategorias também removidas.',()=>{cats=cats.filter(c=>c.id!==id);subs=subs.filter(s=>s.pai!==id);saveAll();populateCatSels();renderCats()})}
function addSub(){const pai=document.getElementById('ns-p').value,nome=document.getElementById('ns-n').value.trim();if(!pai||!nome){toast('Selecione categoria e informe o nome.');return}subs.push({id:uid(),pai,nome});saveAll();renderCfgCats();closeAddSub();populateFlt();populateForm();populateCatSels();renderCats();document.getElementById('ns-n').value='';toast('Subcategoria adicionada!')}
function editSub(id){const s=subs.find(x=>x.id===id);if(!s)return;openModal('Editar subcategoria','',null);document.getElementById('m-btns').style.display='none';document.getElementById('m-extra').innerHTML=`<div style="display:flex;flex-direction:column;gap:8px"><div class="edit-row"><label>Nome</label><input id="es-n" value="${s.nome}" style="flex:1"/></div><div class="edit-row"><label>Categoria</label><select id="es-p" style="flex:1"><option value="">—</option>${cats.map(c=>`<option value="${c.id}"${c.id===s.pai?' selected':''}>${c.nome}</option>`).join('')}</select></div><div style="display:flex;gap:7px;margin-top:4px"><button class="btn pr sm" style="flex:1" onclick="saveSubEdit('${id}')">Salvar</button><button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button></div></div>`}
function saveSubEdit(id){const idx=subs.findIndex(x=>x.id===id);if(idx<0)return;subs[idx].nome=document.getElementById('es-n').value.trim()||subs[idx].nome;subs[idx].pai=document.getElementById('es-p').value||subs[idx].pai;saveAll();closeModal();renderCfgCats();populateFlt();populateForm();renderCats();toast('Subcategoria atualizada!')}
function delSub(id){subs=subs.filter(s=>s.id!==id);saveAll();renderCats()}

// ── PAGAMENTOS ────────────────────────────────────────────────────
function renderPags(){document.getElementById('pag-list').innerHTML=pags.map(p=>`<div class="item"><span class="bdg ${p.tipo==='credit'||p.tipo==='debit'?'cr':p.tipo==='pix'?'px':p.tipo==='dinheiro'?'dn':'ct'}">${p.tipo}</span><div class="im"><div class="in">${p.nome}</div></div><div style="display:flex;gap:3px"><button class="btn xs" onclick="editPag('${p.id}')">✏️</button><button class="btn xs dn" onclick="delPag('${p.id}')">${['cr','db','px','dn'].includes(p.id)?'—':'✕'}</button></div></div>`).join('')}
function addPag(){const nome=document.getElementById('np-n').value.trim();if(!nome){toast('Informe o nome.');return}pags.push({id:uid(),nome,tipo:document.getElementById('np-t').value});saveAll();renderCfgPags();closeAddPag();populateFlt();populateForm();toast('Pagamento salvo!');renderPags();document.getElementById('np-n').value='';toast('Tipo adicionado!')}
function delPag(id){if(['cr','db','px','dn'].includes(id)){toast('Não é possível remover os tipos padrão.');return}pags=pags.filter(p=>p.id!==id);saveAll();renderPags()}

// ── ORÇAMENTO — melhorado com anéis visuais ───────────────────────
function renderOrc(){
  const view=(document.getElementById('orc-v')||{}).value||'all';
  const f=document.getElementById('orc-form');
  let items=[];
  if(view==='cats'||view==='all')cats.forEach(c=>items.push({id:c.id,label:`${c.emoji||'📦'} ${c.nome}`,cor:c.cor,emoji:c.emoji||'📦'}));
  if(view==='subs'||view==='all')subs.forEach(s=>{const p=cats.find(c=>c.id===s.pai);items.push({id:s.id,label:`↳ ${s.nome}`,cor:p?p.cor:'#888',emoji:'↳'})});
  f.innerHTML=items.map(it=>`<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px"><div class="swatch" style="background:${it.cor};width:10px;height:10px"></div><span style="font-size:12px;flex:1;color:var(--txt2)">${it.label}</span><div style="display:flex;align-items:center;gap:3px;flex-shrink:0"><span style="font-size:11px;color:var(--txt3)">R$</span><input type="number" min="0" step="10" placeholder="0" value="${orcs[it.id]||''}" data-id="${it.id}" onchange="setOrc(this)" style="width:80px;background:var(--bg3);border:0.5px solid var(--bdr2);border-radius:var(--rx);padding:5px 7px;font-size:13px;color:var(--txt);text-align:right;font-family:inherit"/></div></div>`).join('');
  const[y,mo]=curMes.split('-');document.getElementById('orc-mes').textContent=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long'});
  const d=desps.filter(x=>mesKey(x.data)===curMes),bcCat={},bcSub={};
  d.forEach(x=>{if(x.catId)bcCat[x.catId]=(bcCat[x.catId]||0)+x.valor;if(x.subId)bcSub[x.subId]=(bcSub[x.subId]||0)+x.valor});
  const pItems=[];
  if(view==='cats'||view==='all')cats.filter(c=>orcs[c.id]).forEach(c=>pItems.push({label:c.nome,emoji:c.emoji||'📦',gasto:bcCat[c.id]||0,orc:orcs[c.id],cor:c.cor}));
  if(view==='subs'||view==='all')subs.filter(s=>orcs[s.id]).forEach(s=>{const p=cats.find(c=>c.id===s.pai);pItems.push({label:s.nome,emoji:'↳',gasto:bcSub[s.id]||0,orc:orcs[s.id],cor:p?p.cor:'#888'})});
  const pc=document.getElementById('orc-progress-card'),rl=document.getElementById('orc-rings'),ll=document.getElementById('orc-list');
  if(!pItems.length){pc.style.display='none';return}
  pc.style.display='block';
  // Ring chart (SVG circles)
  const r=34,cx=40,cy=40,circ=2*Math.PI*r;
  rl.innerHTML=`<div class="orc-ring-wrap">${pItems.slice(0,6).map(it=>{const pct=clamp(it.gasto/it.orc*100),col=pct>=100?'var(--rose)':pct>=80?'var(--amb)':it.cor,dash=clamp(it.gasto/it.orc*100)/100*circ;return`<div class="orc-ring"><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg4)" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-dasharray="${dash} ${circ}" stroke-linecap="round" style="transition:stroke-dasharray .6s"/></svg><div class="orc-ring-label"><div class="orc-ring-pct" style="color:${col}">${pct}%</div><div class="orc-ring-name">${it.emoji} ${it.label}</div></div></div>`}).join('')}</div>`;
  ll.innerHTML=pItems.map(it=>{const pct=clamp(it.gasto/it.orc*100),col=pct>=100?'var(--rose)':pct>=80?'var(--amb)':it.cor;return`<div class="orc-list-item"><div class="orc-icon">${it.emoji}</div><div class="orc-name">${it.label}</div><div class="orc-vals"><div class="orc-spent" style="color:${col}">${fmt(it.gasto)}</div><div class="orc-limit">/ ${fmt(it.orc)}</div></div></div><div class="orc-bar-wrap"><div class="prog"><div class="pf" style="width:${pct}%;background:${col}"></div></div>${pct>=80?`<div style="font-size:10px;color:${col};margin-top:2px">${pct>=100?'⚠ Ultrapassou!':'⚡ Próximo do limite'}</div>`:''}</div>`}).join('');
}
function setOrc(el){orcs[el.getAttribute('data-id')]=parseFloat(el.value)||0;saveAll();renderOrc()}

// ── PLANILHA INLINE ───────────────────────────────────────────────
function shTab(t,btn){['sh-sync','sh-cfg','sh-csv','sh-del'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});document.getElementById('sh-'+t).style.display='block';document.querySelectorAll('#p-planilha .tab').forEach(b=>b.classList.remove('act'));btn.classList.add('act');if(t==='csv')renderCSV();if(t==='sync'){renderSyncSt();renderPend()}if(t==='inline')renderSheet();if(t==='del')populateDelSels()}
function renderSheet(){const mes=(document.getElementById('sh-mes')||{}).value||curMes,d=desps.filter(x=>mesKey(x.data)===mes),th=document.getElementById('sh-head'),tb=document.getElementById('sh-body');if(th)th.innerHTML=['Data','Descrição','Categoria','Pagamento','Valor','Obs',''].map(h=>`<th style="padding:6px 7px;font-size:10px;font-weight:700;color:var(--txt3);text-align:left;border-bottom:0.5px solid var(--bdr);background:var(--bg2);white-space:nowrap">${h}</th>`).join('');if(!tb)return;const si='background:transparent;border:none;color:var(--txt);font-family:inherit;font-size:12px;padding:5px 4px';tb.innerHTML=d.map(x=>{const cat=cats.find(c=>c.id===x.catId),pag=pags.find(p=>p.id===x.pagId),pL=x.totalParcelas?` (${x.parcela}/${x.totalParcelas})`:'';return`<tr data-id="${x.id}"><td><input value="${x.data}" onchange="shE('${x.id}','data',this.value)" style="width:95px;${si}"/></td><td><input value="${x.desc}${pL}" onchange="shE('${x.id}','desc',this.value)" style="min-width:120px;${si}"/></td><td><input value="${cat?cat.nome:''}" onchange="shE('${x.id}','catNome',this.value)" style="width:100px;${si}"/></td><td><input value="${pag?pag.nome:''}" readonly style="width:75px;${si};color:var(--txt3)"/></td><td><input type="number" value="${x.valor.toFixed(2)}" onchange="shE('${x.id}','valor',this.value)" style="width:75px;${si};text-align:right"/></td><td><input value="${x.obs||''}" onchange="shE('${x.id}','obs',this.value)" style="min-width:80px;${si}"/></td><td><button class="btn xs dn" onclick="delDesp('${x.id}');renderSheet()">✕</button></td></tr>`}).join('')}
function shE(id,f,v){if(!shEdits[id])shEdits[id]={};shEdits[id][f]=v}
function saveShEdits(){let ch=0;Object.entries(shEdits).forEach(([id,e])=>{const idx=desps.findIndex(d=>d.id===id);if(idx<0)return;if(e.data)desps[idx].data=e.data;if(e.valor!==undefined)desps[idx].valor=parseFloat(e.valor)||desps[idx].valor;if(e.obs!==undefined)desps[idx].obs=e.obs;if(e.desc)desps[idx].desc=e.desc.replace(/\s+\(\d+\/\d+\)$/,'').trim();if(e.catNome){const c=cats.find(c=>c.nome.toLowerCase()===e.catNome.toLowerCase());if(c)desps[idx].catId=c.id}desps[idx].ss='p';if(!pend.includes(id))pend.push(id);ch++});shEdits={};saveAll();renderSheet();renderBadge();updSyncBnr();toast(`${ch} registro(s) atualizado(s)!`)}
function cancelShEdits(){shEdits={};renderSheet();toast('Cancelado')}
function addShRow(){const mes=(document.getElementById('sh-mes')||{}).value||curMes,id=uid();desps.unshift({id,desc:'Nova despesa',valor:0,data:mes+'-01',pagId:'',cartId:'',catId:'',subId:'',accId:'',obs:'',ss:'p'});pend.push(id);saveAll();renderSheet();toast('Linha adicionada')}

// ── APAGAR ────────────────────────────────────────────────────────
function previewDel(){const d1=(document.getElementById('del-d1')||{}).value||'',d2=(document.getElementById('del-d2')||{}).value||'';if(!d1||!d2){document.getElementById('del-preview').textContent='Selecione o período.';return}const dc=(document.getElementById('del-cat')||{}).value||'',ds=(document.getElementById('del-sub')||{}).value||'',dcard=(document.getElementById('del-card')||{}).value||'',dacc=(document.getElementById('del-acc')||{}).value||'';let list=desps.filter(x=>x.data>=d1&&x.data<=d2);if(dc)list=list.filter(x=>x.catId===dc);if(ds)list=list.filter(x=>x.subId===ds);if(dcard)list=list.filter(x=>x.cartId===dcard);if(dacc)list=list.filter(x=>x.accId===dacc);delItems=list.map(x=>x.id);const tot=list.reduce((s,x)=>s+x.valor,0);document.getElementById('del-preview').innerHTML=`<strong style="color:${list.length>0?'var(--rose)':'var(--eme)'}">Serão apagados: ${list.length} registros (${fmt(tot)})</strong>`}
function execDel(){if(!delItems.length){toast('Pré-visualize primeiro.');return}openModal(`Apagar ${delItems.length} registro(s)?`,'Irreversível.',()=>{desps=desps.filter(d=>!delItems.includes(d.id));pend=pend.filter(p=>!delItems.includes(p));delItems=[];saveAll();initMesSel();renderAll();updSyncBnr();toast('Registros apagados!');document.getElementById('del-preview').textContent='Selecione um período.'})}

// ── CSV ───────────────────────────────────────────────────────────
function renderCSV(){const mes=(document.getElementById('ex-mes')||{}).value||curMes,d=desps.filter(x=>mesKey(x.data)===mes);const hdr='Data,Descrição,Categoria,Subcategoria,Pagamento,Cartão,Conta,Valor,Parcela,Total Parcelas,Obs';const rows=d.map(x=>{const cat=cats.find(c=>c.id===x.catId),sub=subs.find(s=>s.id===x.subId),pag=pags.find(p=>p.id===x.pagId),cart=carts.find(c=>c.id===x.cartId),acc=accs.find(a=>a.id===x.accId);return`${x.data},"${x.desc}",${cat?cat.nome:''},${sub?sub.nome:''},${pag?pag.nome:''},${cart?cart.nome:''},${acc?acc.nome:''},${x.valor.toFixed(2)},${x.parcela||''},${x.totalParcelas||''},"${x.obs||''}"`});const el=document.getElementById('csv-prev');if(el)el.textContent=hdr+'\n'+rows.join('\n')}
function copyCSV(){navigator.clipboard.writeText(document.getElementById('csv-prev').textContent).then(()=>toast('CSV copiado!'))}
function dlCSV(){const t=document.getElementById('csv-prev').textContent,a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(t);a.download='despesas_'+curMes+'.csv';a.click()}

// ── SYNC ──────────────────────────────────────────────────────────
function syncUI(s,m){const d=document.getElementById('sdot'),t=document.getElementById('stxt');if(!d||!t)return;d.className='sdot '+({on:'don',off:'doff',sync:'dsyn'}[s]||'doff');t.textContent=m}
function updSyncBnr(){const b=document.getElementById('bnr-sync'),cnt=pend.length;if(cnt>0){document.getElementById('bnr-sync-txt').textContent=`${cnt} pendente(s) ${navigator.onLine?'— sync disponível':'— sem internet'}`;b.classList.add('on')}else b.classList.remove('on')}
async function manSync(){if(!cfg.shUrl){nav('planilha',null);toast('Configure a URL em Planilha → Sync.');return}if(!navigator.onLine){toast('Sem internet.');return}await doSync()}
async function testSync(){if(!cfg.shUrl){toast('Cole a URL primeiro.');return}if(!navigator.onLine){toast('Sem internet.');return}syncUI('sync','Testando...');const st=document.getElementById('sh-url-status');try{const res=await fetch(cfg.shUrl+'?action=ping');const json=await res.json();if(json.ok){syncUI('on','Conectado ✓');toast('✓ Conexão confirmada!');if(st)st.innerHTML=`<span style="color:var(--eme)">✓ Conectado ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>`}else{syncUI('off','Erro');if(st)st.innerHTML=`<span style="color:var(--rose)">✗ ${json.error||'Erro'}</span>`}}catch{try{await fetch(cfg.shUrl+'?action=ping',{mode:'no-cors'});syncUI('on','URL ok');toast('URL alcançada. Faça um lançamento e veja na planilha.');if(st)st.innerHTML=`<span style="color:var(--amb)">⚡ URL alcançada — confirme com um lançamento</span>`}catch{syncUI('off','Falha');toast('URL não alcançada. Verifique se publicou com "Qualquer pessoa".');if(st)st.innerHTML=`<span style="color:var(--rose)">✗ URL não alcançada</span>`}}}
function saveSyncCfg(){cfg.shUrl=(document.getElementById('sh-url')||{}).value?.trim()||'';cfg.sheetUrl=(document.getElementById('sh-sheet-url')||{}).value?.trim()||'';saveAll();toast('Configuração salva! Clique em Testar.');renderSyncSt()}
function openSheetDirect(){const url=cfg.sheetUrl;if(!url){toast('Configure a URL da planilha em Planilha/Sync → Configurar.');return}window.open(url,'_blank')}
function renderSyncSt(){const el=document.getElementById('sync-status');if(!el)return;const cnt=pend.length,on=navigator.onLine;el.innerHTML=`<div style="display:flex;align-items:center;gap:9px;padding:10px;background:var(--bg3);border-radius:var(--rs)"><div style="width:9px;height:9px;border-radius:50%;background:${on?'var(--eme)':'var(--rose)'}"></div><div><div style="font-size:13px;font-weight:600">${on?'Online':'Sem internet'}</div><div style="font-size:11px;color:var(--txt3);margin-top:1px">${cnt>0?cnt+' pendente(s)':'Tudo sincronizado ✓'}</div></div></div>${cfg.shUrl?`<div style="font-size:11px;color:var(--eme);padding:6px 10px;background:rgba(16,185,129,.1);border-radius:var(--rs);margin-top:7px">✓ Script configurado</div>`:'<div style="font-size:12px;color:var(--amb);padding:8px 10px;background:rgba(245,158,11,.1);border-radius:var(--rs);margin-top:7px">Configure a URL abaixo.</div>'}`}
function renderPend(){const el=document.getElementById('pend-list');if(!el)return;const pd=desps.filter(d=>pend.includes(d.id));const pc=document.getElementById('pend-card');if(pc)pc.style.display=pd.length?'block':'none';el.innerHTML=pd.map(d=>`<div class="item"><div class="im"><div class="in">${d.desc}</div><div class="is">${fmtD(d.data)} · ${fmt(d.valor)}</div></div><span class="bdg pe">pendente</span></div>`).join('')}

// ── PERFIL — foto com auto-resize sem erro ─────────────────────────
function renderPerfil(){
  document.getElementById('pf-nome').value=cfg.nome||'';
  document.getElementById('pf-email').value=cfg.email||'';
  document.getElementById('pf-meta').value=cfg.meta||'';
  renderAvBig();
  // Update live display
  const nd=document.getElementById('pf-nome-display');if(nd)nd.textContent=cfg.nome||'—';
  const ed=document.getElementById('pf-email-display');if(ed)ed.textContent=cfg.email||'—';
  const md=document.getElementById('pf-meta-display');if(md)md.textContent=cfg.meta>0?'🎯 Meta: '+fmt(cfg.meta)+'/mês':'';
}
function renderAvBig(){const el=document.getElementById('prof-av-big');if(!el)return;const del=document.getElementById('av-del-btn');el.innerHTML=cfg.avatar&&cfg.avatar.length>10?`<img src="${cfg.avatar}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid var(--ind);cursor:pointer" onclick="document.getElementById('av-file').click()"/>`:`<div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,var(--ind),var(--vio));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;border:3px solid rgba(99,102,241,.4);cursor:pointer" onclick="document.getElementById('av-file').click()">${(cfg.nome||'?')[0].toUpperCase()}</div>`;if(del)del.style.display=cfg.avatar&&cfg.avatar.length>10?'':'none'}
function savePerfil(){cfg.nome=document.getElementById('pf-nome').value.trim();cfg.email=document.getElementById('pf-email').value.trim();cfg.meta=parseMoeda(document.getElementById('pf-meta').value)||0;saveAll();renderSBAvatar();document.getElementById('sb-name').textContent=cfg.nome||'Eu';renderLockProfile();toast('Perfil salvo!')}
function renderSBAvatar(){const b=document.getElementById('sbav-box');if(!b)return;b.innerHTML=cfg.avatar&&cfg.avatar.length>10?`<img src="${cfg.avatar}" class="sbav"/>`:`<div class="sbav-init">${(cfg.nome||'?')[0].toUpperCase()}</div>`}
function changeAvatar(input){const f=input.files[0];if(!f)return;// Auto-resize sem mensagem de erro para foto grande
const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),img=new Image();img.onload=()=>{const MAX=800;let w=img.width,h=img.height;if(w>MAX||h>MAX){const r=Math.min(MAX/w,MAX/h);w=Math.round(w*r);h=Math.round(h*r)}// Center crop to square
const sz=Math.min(w,h);canvas.width=200;canvas.height=200;const sx=(w-sz)/2,sy=(h-sz)/2;ctx.drawImage(img,sx/w*img.width,sy/h*img.height,sz/w*img.width,sz/h*img.height,0,0,200,200);cfg.avatar=canvas.toDataURL('image/jpeg',.88);saveAll();renderAvBig();renderSBAvatar();renderLockProfile();toast('Foto atualizada!')};img.onerror=()=>toast('Erro ao carregar imagem');img.src=URL.createObjectURL(f)}
function removeAvatar(){cfg.avatar='';saveAll();renderAvBig();renderSBAvatar();renderLockProfile();toast('Foto removida')}

// ── CONFIGURAÇÕES ─────────────────────────────────────────────────
function renderCfg(){['cfg-col','cfg-bdg','cfg-asy','cfg-son','cfg-lock'].forEach(id=>{const el=document.getElementById(id);if(el){if(id==='cfg-col')el.checked=!!cfg.col;else if(id==='cfg-bdg')el.checked=cfg.bdg!==false;else if(id==='cfg-asy')el.checked=cfg.asy!==false;else if(id==='cfg-son')el.checked=cfg.son!==false;else if(id==='cfg-lock')el.checked=!!cfg.lock}});document.getElementById('cfg-tot').textContent=desps.length+' registros';applyTheme()}
function saveCfg(){cfg.col=document.getElementById('cfg-col').checked;cfg.bdg=document.getElementById('cfg-bdg').checked;cfg.asy=document.getElementById('cfg-asy').checked;cfg.son=document.getElementById('cfg-son').checked;cfg.lock=document.getElementById('cfg-lock').checked;saveAll()}
function expJSON(){const data=JSON.stringify({cats,subs,carts,pags,accs,desps:desps.map(d=>({...d,receipt:undefined})),orcs,cfg:{...cfg,avatar:''},scriptUrl:cfg.shUrl||'',url_sistema:cfg.shUrl||''},null,2);const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(data);a.download='financas_v6_backup.json';a.click();toast('Exportado (sem fotos)')}
function impJSON(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(d.desps)desps=d.desps;if(d.cats)cats=d.cats;if(d.subs)subs=d.subs;if(d.carts)carts=d.carts;if(d.pags)pags=d.pags;if(d.accs)accs=d.accs;if(d.orcs)orcs=d.orcs;if(d.cfg){const pin=cfg.pin;const theme=cfg.theme;cfg={...d.cfg,pin,theme}}const _u=d.url_sistema||d.scriptUrl;if(_u&&typeof _u==='string'&&_u.includes('script.google')){cfg.shUrl=_u;localStorage.setItem('fin6_shUrl_direct',_u);}saveAll();renderAll();const b=document.getElementById('first-run-banner');if(b)b.remove();toast('✓ Backup importado!'+(_u?' URL aplicada.':''))}catch(err){console.error(err);toast('Arquivo inválido')}};r.readAsText(f)}
function clearAll(){openModal('Apagar todos os dados?','Irreversível.',()=>{desps=[];pend=[];orcs={};saveAll();initMesSel();renderAll();updSyncBnr();toast('Dados apagados.')})}

// ── BADGE ─────────────────────────────────────────────────────────
function renderBadge(){const cnt=desps.filter(d=>mesKey(d.data)===curMes).length,el=document.getElementById('sb-cnt');if(el){el.textContent=cnt;el.style.display=cfg.bdg!==false&&sbOpen&&cnt>0?'':'none'}}

// ── MODAL / TOAST ─────────────────────────────────────────────────
function openModal(title,msg,ok){document.getElementById('m-title').textContent=title;document.getElementById('m-msg').textContent=msg;document.getElementById('m-extra').innerHTML='';const ob=document.getElementById('m-ok'),mb=document.getElementById('m-btns');mb.style.display='';ob.style.display=ok?'':'none';if(ok)ob.onclick=()=>{closeModal();ok()};document.getElementById('mov').classList.add('on')}
function closeModal(){document.getElementById('mov').classList.remove('on')}
let toastT;function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2800)}

// ── PWA ───────────────────────────────────────────────────────────
let dPr=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dPr=e;document.getElementById('bnr-inst').classList.add('on')});
function doInst(){if(!dPr)return;dPr.prompt();dPr.userChoice.then(c=>{if(c.outcome==='accepted')dismInst();dPr=null})}
function dismInst(){document.getElementById('bnr-inst').classList.remove('on')}
window.addEventListener('appinstalled',()=>{dismInst();toast('App instalado! 🎉')});

// ── CONNECTIVITY ──────────────────────────────────────────────────
window.addEventListener('online',()=>{syncUI('on','Online');updSyncBnr();if(cfg.asy&&pend.length>0){toast('Internet voltou — sincronizando...');setTimeout(doSync,1200)}});
window.addEventListener('offline',()=>{syncUI('off','Sem internet');updSyncBnr()});

// ── SW ────────────────────────────────────────────────────────────
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>{if('SyncManager' in window)navigator.serviceWorker.ready.then(sw=>sw.sync.register('sync-fin6')).catch(()=>{})});navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='DO_SYNC'&&cfg.asy)doSync()})}

// ── INIT ──────────────────────────────────────────────────────────
function renderAll(){initMesSel();renderResumo();renderBadge();updSyncBnr()}
applyTheme();
document.getElementById('l-date')?.setAttribute('value',today());
if(!navigator.onLine)syncUI('off','Sem internet');else syncUI('on','Online');
renderLockProfile();
renderSBAvatar();


// ════════════════════════════════════════════════════════════════
//  SYNC COMPLETO — APPDATA + DESPESAS
// ════════════════════════════════════════════════════════════════

// ── SALVA TUDO NA PLANILHA ──────────────────────────────────────
// Salva: cats, subs, carts, pags, accs, orcs, cfg (sem foto/avatar)
async function saveAppData() {
  if (!cfg.shUrl) { toast('Configure a URL do script primeiro.'); return false; }
  if (!navigator.onLine) { toast('Sem internet.'); return false; }
  const payload = {
    cats, subs, carts, pags, accs, orcs,
    deletedIds,
    cfg_profile: { nome: cfg.nome, email: cfg.email, meta: cfg.meta, theme: cfg.theme, shUrl: cfg.shUrl, sheetUrl: cfg.sheetUrl, pin: cfg.pin, col: cfg.col, bdg: cfg.bdg, asy: cfg.asy, son: cfg.son, lock: cfg.lock, metaAccs: cfg.metaAccs||[], driveFolder: cfg.driveFolder||'', driveFreq: cfg.driveFreq||'never' }
  };
  // Avatar separately (may be large) - compress to 80px for sync
  if (cfg.avatar && cfg.avatar.length > 10) {
    try {
      const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),img=new Image();
      await new Promise(res=>{img.onload=res;img.onerror=res;img.src=cfg.avatar});
      canvas.width=80;canvas.height=80;
      ctx.drawImage(img,0,0,80,80);
      payload.avatar = canvas.toDataURL('image/jpeg',.7);
    } catch{}
  }
  try {
    const res = await fetch(cfg.shUrl, { method:'POST', headers:{'Content-Type':'text/plain'}, body: JSON.stringify({ action:'saveAppData', payload }) });
    const json = await res.json();
    return !!json.ok;
  } catch { return false; }
}

// ── CARREGA APPDATA DA PLANILHA ─────────────────────────────────
async function loadAppData(url) {
  const shUrl = url || cfg.shUrl;
  if (!shUrl || !navigator.onLine) return null;
  try {
    const res = await fetch(shUrl + '?action=getAppData');
    const json = await res.json();
    if (!json.ok || !json.data) return null;
    return json.data;
  } catch { return null; }
}

// ── CARREGA DESPESAS DA PLANILHA ─────────────────────────────────
async function loadDespsFromSheet() {
  if (!cfg.shUrl || !navigator.onLine) return 0;
  try {
    const res = await fetch(cfg.shUrl + '?action=getRows');
    const json = await res.json();
    if (!json.ok || !json.rows || !json.rows.length) return 0;
    let imported = 0;
    json.rows.forEach(row => {
      if (!row[11]) return; // sem ID App — ignora
      const id = String(row[11]);
      if (desps.find(d => d.id === id)) return; // já existe
      if (deletedIds.includes(id)) return; // foi deletado localmente
      // row: [Data, Desc, Cat, SubCat, Pag, Cart, Conta, Valor, Parcela, TotalParc, Obs, ID]
      const catObj  = cats.find(c => c.nome === row[2]);
      const subObj  = subs.find(s => s.nome === row[3]);
      const pagObj  = pags.find(p => p.nome === row[4]);
      const cartObj = carts.find(c => c.nome === row[5]);
      const accObj  = accs.find(a => a.nome === row[6]);
      desps.push({
        id,
        desc:          String(row[1]||''),
        data:          String(row[0]||today()),
        catId:         catObj  ? catObj.id  : '',
        subId:         subObj  ? subObj.id  : '',
        pagId:         pagObj  ? pagObj.id  : '',
        cartId:        cartObj ? cartObj.id : '',
        accId:         accObj  ? accObj.id  : '',
        valor:         parseFloat(row[7]) || 0,
        parcela:       row[8]  ? parseInt(row[8])  : null,
        totalParcelas: row[9]  ? parseInt(row[9])  : null,
        obs:           String(row[10]||''),
        ss:            's',   // já está sincronizado
        grupoId:       id     // fallback group
      });
      imported++;
    });
    if (imported > 0) { saveAll(); }
    return imported;
  } catch(e) { return 0; }
}

// ── BOTÃO: SALVAR TUDO NA NUVEM ──────────────────────────────────
async function saveAllToCloud() {
  syncUI('sync', 'Salvando...');
  const st = document.getElementById('cfg-sync-status');
  if (st) st.textContent = 'Salvando na nuvem...';
  // 1. Salva AppData (config, cats, etc.)
  const ok1 = await saveAppData();
  // 2. Sync despesas pendentes
  await doSync();
  if (ok1) {
    toast('✓ Tudo salvo na nuvem!');
    if (st) st.innerHTML = '<span style="color:var(--eme)">✓ Config, categorias, cartões e despesas salvos · ' + new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) + '</span>';
  } else {
    toast('Despesas sincronizadas, mas falhou ao salvar config.');
  }
}

// ── BOTÃO: CARREGAR TUDO DA NUVEM ────────────────────────────────
async function loadAllFromCloud(urlParam, silent=false) {
  // Pede a URL se ainda não tiver
  let url = urlParam || cfg.shUrl;
  if (!url) {
    // Show inline form instead of prompt
    openModal('Carregar configurações','Cole a URL do Apps Script para restaurar seus dados neste dispositivo.',null);
    document.getElementById('m-btns').style.display='none';
    document.getElementById('m-extra').innerHTML=`
      <div class="frow" style="margin-top:8px"><div class="fg"><label>URL do Web App</label><input type="url" id="load-url" placeholder="https://script.google.com/macros/s/.../exec" style="font-size:12px"/></div></div>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn pr sm" style="flex:1" onclick="closeModal();loadAllFromCloud(document.getElementById('load-url').value)">Carregar</button><button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button></div>`;
    return;
  }
  if (!url.includes('script.google.com')) { toast('URL inválida.'); return; }
  if (!navigator.onLine) { toast('Sem internet.'); return; }
  const st = document.getElementById('cfg-sync-status');
  if (st) st.textContent = 'Carregando da nuvem...';
  toast('Carregando configurações...');
  syncUI('sync', 'Carregando...');

  const data = await loadAppData(url);
  if (!data || Object.keys(data).length === 0) { toast('Nenhum dado encontrado na planilha.'); syncUI('off','Erro'); if(st)st.textContent='';return; }
  if (!silent && (cats.length > 1 || desps.length > 0)) {
    const ok = window.confirm('Dados locais encontrados.\nCarregar da nuvem vai MESCLAR despesas e SUBSTITUIR categorias/cartões/contas.\n\nContinuar?');
    if (!ok) { if(st)st.textContent=''; return; }
  }

  // Restaura AppData
  if (data.cats)        cats  = data.cats;
  if (data.subs)        subs  = data.subs;
  if (data.carts)       carts = data.carts;
  if (data.pags)        pags  = data.pags;
  if (data.accs)        accs  = data.accs;
  if (data.orcs)        orcs  = data.orcs;
  if (data.deletedIds)  deletedIds = data.deletedIds;
  // Restore avatar (small version for sync)
  if (data.avatar && data.avatar.length > 10 && !cfg.avatar) {
    cfg.avatar = data.avatar;
  }
  if (data.cfg_profile) {
    const p = data.cfg_profile;
    cfg.shUrl    = p.shUrl    || url;
    cfg.sheetUrl = p.sheetUrl || cfg.sheetUrl;
    cfg.nome     = p.nome     || cfg.nome;
    cfg.email    = p.email    || cfg.email;
    cfg.meta     = p.meta     || cfg.meta;
    cfg.pin      = p.pin      || cfg.pin;
    cfg.col      = p.col      !== undefined ? p.col  : cfg.col;
    cfg.bdg      = p.bdg      !== undefined ? p.bdg  : cfg.bdg;
    cfg.asy      = p.asy      !== undefined ? p.asy  : cfg.asy;
    cfg.son      = p.son      !== undefined ? p.son  : cfg.son;
    if (p.theme) { cfg.theme = p.theme; applyTheme(); }
  }
  saveAll();

  // Agora carrega as despesas da planilha
  const imported = await loadDespsFromSheet();
  initMesSel(); renderAll(); renderSBAvatar(); renderLockProfile();
  document.getElementById('sb-name').textContent = cfg.nome || 'Eu';
  applyTheme();

  syncUI('on', 'Sincronizado ✓');
  const msg = `✓ Configurações carregadas! ${imported} despesa(s) importada(s).`;
  toast(msg);
  if (st) st.innerHTML = `<span style="color:var(--eme)">${msg}</span>`;
}

// ── SYNC AUTOMÁTICO AO ABRIR (se tiver URL configurada) ───────────
async function autoLoadOnOpen() {
  if (!navigator.onLine) return;

  // Se config.js tem URL embutida e localStorage não tem — usar automaticamente
  if (!cfg.shUrl && typeof APP_SCRIPT_URL === 'string' && APP_SCRIPT_URL.includes('script.google')) {
    cfg.shUrl = APP_SCRIPT_URL;
    gs('cfg', cfg);
  }

  if (!cfg.shUrl) {
    showFirstRunBanner();
    return;
  }

  const isNew = desps.length === 0;

  if (isNew) {
    // Dispositivo novo: perguntar só uma vez
    openModal(
      'Carregar dados da nuvem?',
      'Nenhum dado local. Carregar tudo da planilha agora?',
      async () => {
        closeModal();
        syncUI('sync', 'Carregando...');
        updateSyncHero();
        await loadAllFromCloud(cfg.shUrl, true);
        initMesSel(); renderAll(); updateSyncHero();
        toast('✓ Dados carregados!');
      }
    );
    // Mudar texto do botão cancelar
    setTimeout(() => {
      const btns = document.getElementById('m-btns');
      if (btns) {
        const cancel = btns.querySelector('button:last-child');
        if (cancel) cancel.textContent = 'Não, começar do zero';
      }
    }, 50);
    return;
  }

  // Tem dados → buscar despesas novas silenciosamente
  const antes = pend.length;
  pend = pend.filter(id => desps.find(d=>d.id===id));
  if (pend.length < antes) { saveAll(); updSyncBnr(); }

  const imported = await loadDespsFromSheet();
  if (imported > 0) {
    initMesSel(); renderAll();
    toast('✓ ' + imported + ' nova(s) despesa(s) sincronizada(s)');
  }
}


// ── PROFILE PREVIEW LIVE ─────────────────────────────────────────
function updateProfilePreview() {
  const n = (document.getElementById('pf-nome')||{}).value || '';
  const e = (document.getElementById('pf-email')||{}).value || '';
  const m = parseMoeda((document.getElementById('pf-meta')||{}).value||'') || 0;
  const nd = document.getElementById('pf-nome-display'); if(nd) nd.textContent = n||'—';
  const ed = document.getElementById('pf-email-display'); if(ed) ed.textContent = e||'—';
  const md = document.getElementById('pf-meta-display'); if(md) md.textContent = m>0?'🎯 Meta: '+fmt(m)+'/mês':'';
  if (cfg.avatar && cfg.avatar.length>10) return;
  const av = document.getElementById('prof-av-big');
  if (av && n) av.innerHTML = `<div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,var(--ind),var(--vio));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;border:3px solid rgba(99,102,241,.4);cursor:pointer" onclick="document.getElementById('av-file').click()">${n[0].toUpperCase()}</div>`;
}

// ── BOTÃO: IMPORTAR DESPESAS DA PLANILHA AGORA ───────────────────
async function importDespsNow() {
  if (!cfg.shUrl) { toast('Configure a URL do script primeiro.'); return; }
  if (!navigator.onLine) { toast('Sem internet.'); return; }
  syncUI('sync', 'Importando...');
  toast('Importando despesas da planilha...');
  const n = await loadDespsFromSheet();
  initMesSel(); renderAll();
  syncUI('on', 'Sincronizado ✓');
  toast(n > 0 ? `✓ ${n} despesa(s) importada(s) da planilha!` : 'Nenhuma despesa nova encontrada.');
}

// ════════════════════════════════════════════════════════════════
//  CALCULADORA + CAPTURA DE TELA
// ════════════════════════════════════════════════════════════════

// ── CALCULADORA INLINE ───────────────────────────────────────────
function calcUpdate(){
  const p=parseMoeda(document.getElementById('calc-parc')?.value||'')||0,n=parseInt(document.getElementById('calc-n')?.value)||0;
  const el=document.getElementById('calc-total');if(el)el.textContent=fmt(p*n);
}
function calcUpdate2(){
  const t=parseMoeda(document.getElementById('calc-tot2')?.value||'')||0,n=parseInt(document.getElementById('calc-n2')?.value)||1;
  const el=document.getElementById('calc-each');if(el)el.textContent=fmt(n>0?t/n:0);
}

// ── CAPTURA DE TELA / COMPARTILHAR ───────────────────────────────

// ══════════════════════════════════════════════════════════════════
//  v6.5 NEW FEATURES
// ══════════════════════════════════════════════════════════════════

// ── BOTTOM NAV ───────────────────────────────────────────────────
function navBot(p, btn) {
  nav(p, null);
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
}

// ── TRANSACTION FILTER TOGGLE ────────────────────────────────────
let transFiltersVisible = false;
function toggleTransFilters() {
  transFiltersVisible = !transFiltersVisible;
  const panel = document.getElementById('trans-filter-panel');
  if (panel) panel.style.display = transFiltersVisible ? 'block' : 'none';
}

function setPer2(t, el) {
  document.querySelectorAll('#period-chips .chip').forEach(c => c.classList.remove('act'));
  if (el) el.classList.add('act');
  const fakeBtn = { classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} } };
  if (t === 'custom') {
    const cr = document.getElementById('custom-range');
    if (cr) cr.style.display = 'block';
    return;
  }
  const cr = document.getElementById('custom-range');
  if (cr) cr.style.display = 'none';
  setPer(t, fakeBtn);
  renderTrans();
}


// ── PARCELAS CATEGORY CHIPS ───────────────────────────────────────
let parcCatFilter = '';
function setParcCat(catId, el) {
  parcCatFilter = catId;
  document.querySelectorAll('#parc-cat-chips .chip').forEach(c => c.classList.remove('act'));
  if (el) el.classList.add('act');
  renderParcs();
}
function populateParcChips() {
  const el = document.getElementById('parc-cat-chips');
  if (!el) return;
  const usedCats = [...new Set(desps.filter(d => d.totalParcelas > 1).map(d => d.catId).filter(Boolean))];
  el.innerHTML = `<div class="chip act" onclick="setParcCat('',this)">Todas</div>` +
    usedCats.map(id => {
      const c = cats.find(x => x.id === id);
      return c ? `<div class="chip" onclick="setParcCat('${id}',this)">${c.emoji || ''} ${c.nome}</div>` : '';
    }).join('');
}

// ── REDESIGNED PARCELAS RENDER ────────────────────────────────────
function renderParcs() {
  populateParcChips();
  const q = ((document.getElementById('parc-q') || {}).value || '').toLowerCase();
  const groups = {};
  desps.filter(d => d.totalParcelas && d.totalParcelas > 1).forEach(d => {
    const k = d.grupoId || d.id;
    if (!groups[k]) groups[k] = { desc: d.desc, list: [], count: d.totalParcelas, catId: d.catId };
    groups[k].list.push(d);
  });
  let gList = Object.values(groups);
  if (q) gList = gList.filter(g => g.desc.toLowerCase().includes(q));
  if (parcCatFilter) gList = gList.filter(g => g.catId === parcCatFilter);

  // Summary cards
  const sumEl = document.getElementById('parc-summary');
  if (sumEl) {
    const totalFut = gList.reduce((s, g) => s + g.list.filter(p => p.data > today()).reduce((a, p) => a + p.valor, 0), 0);
    const totalPaid = gList.reduce((s, g) => s + g.list.filter(p => p.data <= today()).reduce((a, p) => a + p.valor, 0), 0);
    sumEl.innerHTML = `
      <div class="mc b" style="flex:1"><div class="ml">A pagar</div><div class="mv b">${fmt(totalFut)}</div></div>
      <div class="mc g" style="flex:1"><div class="ml">Pago</div><div class="mv g">${fmt(totalPaid)}</div></div>`;
  }

  const el = document.getElementById('list-parc');
  if (!gList.length) { el.innerHTML = '<div class="empty">Sem parcelamentos encontrados</div>'; return; }

  el.innerHTML = gList.map((g, gi) => {
    const cat = cats.find(c => c.id === g.catId);
    const pagas = g.list.filter(p => p.data <= today()).length;
    const pct = clamp(pagas / g.count * 100);
    const tot = g.list.reduce((s, p) => s + p.valor, 0);
    const fut = g.list.filter(p => p.data > today()).reduce((s, p) => s + p.valor, 0);
    const bgColor = cat ? cat.cor + '22' : 'var(--bg3)';
    const detail = g.list.sort((a, b) => a.parcela - b.parcela).map(p => {
      const isPaid = p.data <= today();
      const isCur = mesKey(p.data) === curMes;
      return `<div class="parc-row">
        <div class="parc-row-left">
          <div class="parc-num ${isPaid ? 'paid' : 'future'}">${p.parcela}</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:${isPaid ? 'var(--txt)' : 'var(--txt3)'}">${fmtD(p.data)}${isCur ? ' <span style="font-size:9px;color:var(--accent);font-weight:700">ATUAL</span>' : ''}</div>
            <div style="font-size:10px;color:var(--txt3)">${isPaid ? '✓ paga' : 'futura'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <span style="font-size:13px;font-weight:700;color:${isPaid ? 'var(--rose)' : 'var(--txt3)'}">${fmt(p.valor)}</span>
          <button class="btn xs" onclick="editDesp('${p.id}')" style="font-size:11px">✏️</button>
        </div>
      </div>`;
    }).join('');

    return `<div class="parc-card" id="parc-card-${gi}">
      <div class="parc-hdr" onclick="toggleParcCard(${gi})">
        <div class="parc-cat-icon" style="background:${bgColor}">${cat ? cat.emoji || '📦' : '📦'}</div>
        <div class="parc-hdr-info">
          <div class="parc-hdr-name">${g.desc}</div>
          <div class="parc-hdr-sub">
            <div class="prog" style="width:70px;flex:none"><div class="pf" style="width:${pct}%;background:${cat ? cat.cor : 'var(--accent)'}"></div></div>
            <span style="color:var(--txt3)">${pagas}/${g.count} parcelas</span>
          </div>
        </div>
        <div class="parc-hdr-right">
          <div class="parc-hdr-total">${fmt(tot)}</div>
          <div class="parc-hdr-remain">falta ${fmt(fut)}</div>
        </div>
        <svg class="parc-chevron-icon" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        <button class="btn xs dn" onclick="event.stopPropagation();delParcGroup('${g.list[0].grupoId || g.list[0].id}')" style="flex-shrink:0;margin-left:4px">✕</button>
      </div>
      <div class="parc-detail">${detail}</div>
    </div>`;
  }).join('');
}
function toggleParcCard(i) {
  const el = document.getElementById('parc-card-' + i);
  if (el) el.classList.toggle('expanded');
}

// ── DRAGGABLE CALCULATOR ──────────────────────────────────────────
let dragEl = null, dragOX = 0, dragOY = 0, dragSX = 0, dragSY = 0;

function openCalc() {
  // Remove existing
  const old = document.getElementById('drag-calc');
  if (old) { old.remove(); return; }

  const d = document.createElement('div');
  d.className = 'drag-modal';
  d.id = 'drag-calc';
  d.style.cssText = 'bottom:80px;right:16px;width:320px';
  d.innerHTML = `
    <div class="drag-handle" id="drag-calc-handle">
      <span class="drag-handle-bar"></span>
      <span class="drag-handle-title">🧮 Calculadora de parcelas</span>
      <button class="drag-close" onclick="document.getElementById('drag-calc').remove()">×</button>
    </div>
    <div class="drag-body">
      <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Calcule o total a partir da parcela ou vice-versa</div>
      <div style="background:var(--bg3);border-radius:var(--rs);padding:12px;margin-bottom:10px">
        <div style="font-size:11px;color:var(--txt3);font-weight:600;margin-bottom:7px">PARCELA → TOTAL</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div class="fg" style="flex:1"><label>Valor da parcela</label><input type="number" id="cp1" placeholder="0,00" step="0.01" inputmode="decimal" oninput="calcU1()"/></div>
          <div class="fg" style="flex:1"><label>Nº de parcelas</label><input type="number" id="cn1" placeholder="12" min="1" inputmode="numeric" oninput="calcU1()"/></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg2);border-radius:var(--rx)">
          <span style="font-size:12px;color:var(--txt2)">Total</span>
          <span style="font-size:20px;font-weight:800;color:var(--ind2)" id="cr1">R$ 0,00</span>
        </div>
      </div>
      <div style="background:var(--bg3);border-radius:var(--rs);padding:12px;margin-bottom:12px">
        <div style="font-size:11px;color:var(--txt3);font-weight:600;margin-bottom:7px">TOTAL → PARCELA</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div class="fg" style="flex:1"><label>Total conhecido</label><input type="number" id="cp2" placeholder="0,00" step="0.01" inputmode="decimal" oninput="calcU2()"/></div>
          <div class="fg" style="flex:1"><label>Nº de parcelas</label><input type="number" id="cn2" placeholder="12" min="1" inputmode="numeric" oninput="calcU2()"/></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg2);border-radius:var(--rx)">
          <span style="font-size:12px;color:var(--txt2)">Cada parcela</span>
          <span style="font-size:20px;font-weight:800;color:var(--eme)" id="cr2">R$ 0,00</span>
        </div>
      </div>
      <div style="display:flex;gap:7px">
        <button class="btn pr sm" style="flex:1" onclick="useCalcTotal()">Usar total no lançamento</button>
        <button class="btn sm" onclick="document.getElementById('drag-calc').remove()">Fechar</button>
      </div>
    </div>`;
  document.body.appendChild(d);
  makeDraggable(d, document.getElementById('drag-calc-handle'));
}
function calcU1() {
  const p = parseMoeda(document.getElementById('cp1')?.value||'') || 0;
  const n = parseInt(document.getElementById('cn1')?.value) || 0;
  const r = document.getElementById('cr1'); if (r) r.textContent = fmt(p * n);
}
function calcU2() {
  const t = parseMoeda(document.getElementById('cp2')?.value||'') || 0;
  const n = parseInt(document.getElementById('cn2')?.value) || 1;
  const r = document.getElementById('cr2'); if (r) r.textContent = fmt(n > 0 ? t / n : 0);
}
function useCalcTotal() {
  const p = parseMoeda(document.getElementById('cp1')?.value||'') || 0;
  const n = parseInt(document.getElementById('cn1')?.value) || 0;
  document.getElementById('drag-calc')?.remove();
  nav('lancar', null);
  setTimeout(() => {
    const v = document.getElementById('l-val'); if (v) v.value = (p * n).toFixed(2);
    const np = document.getElementById('l-np'); if (np && n > 1) { np.value = n; document.getElementById('l-parc').checked = true; document.getElementById('l-pb').style.display = 'block'; }
    calcPV(); toast('Valores aplicados!');
  }, 200);
}

function makeDraggable(el, handle) {
  let sx = 0, sy = 0, ox = 0, oy = 0;
  // Get initial position
  const rect = el.getBoundingClientRect();
  el.style.bottom = 'auto'; el.style.right = 'auto';
  el.style.left = rect.left + 'px'; el.style.top = rect.top + 'px';

  function onDown(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    sx = clientX - el.offsetLeft; sy = clientY - el.offsetTop;
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false }); document.addEventListener('touchend', onUp);
    e.preventDefault();
  }
  function onMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const nx = clientX - sx, ny = clientY - sy;
    const maxX = window.innerWidth - el.offsetWidth, maxY = window.innerHeight - el.offsetHeight;
    el.style.left = Math.max(0, Math.min(nx, maxX)) + 'px';
    el.style.top = Math.max(0, Math.min(ny, maxY)) + 'px';
    if (e.cancelable) e.preventDefault();
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp);
  }
  handle.addEventListener('mousedown', onDown);
  handle.addEventListener('touchstart', onDown, { passive: false });
}

// ── SHARE — generate clean report image ──────────────────────────
async function captureAndShare() {
  // Generate a clean canvas-based report image (no html2canvas needed)
  const list = getFiltered();
  if (!list.length) { toast('Sem dados para gerar relatório.'); return; }
  toast('Gerando relatório...');

  const W = 800, ROW = 64, HEADER = 130, FOOTER = 60;
  const H = HEADER + list.length * ROW + FOOTER;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = Math.min(H, HEADER + 20 * ROW + FOOTER);
  const ctx = canvas.getContext('2d');
  const rows = list.slice(0, 20);

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, W, canvas.height);

  // Header gradient bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#6366f1'); grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER);

  // Header text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px -apple-system, sans-serif';
  ctx.fillText('💰 Finanças Pessoais', 32, 50);
  const tot = list.reduce((s, x) => s + x.valor, 0);
  ctx.font = '500 16px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  const[y,mo]=curMes.split('-');
  ctx.fillText(new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}), 32, 80);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px -apple-system, sans-serif';
  ctx.fillText(fmt(tot), 32, 115);
  ctx.font = '500 14px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText(`${list.length} transações`, W - 200, 115);

  // Rows
  rows.forEach((x, i) => {
    const cat = cats.find(c => c.id === x.catId);
    const y = HEADER + i * ROW;
    // Alt row
    ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#111827';
    ctx.fillRect(0, y, W, ROW);
    // Category circle
    ctx.beginPath();
    ctx.arc(52, y + ROW / 2, 20, 0, Math.PI * 2);
    ctx.fillStyle = cat ? cat.cor : '#6366f1';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText(cat ? cat.emoji || '📦' : '📦', 52, y + ROW / 2 + 6);
    ctx.textAlign = 'left';
    // Description
    ctx.fillStyle = '#f9fafb';
    ctx.font = 'bold 15px -apple-system, sans-serif';
    const desc = x.desc.length > 30 ? x.desc.slice(0, 30) + '…' : x.desc;
    ctx.fillText(desc, 82, y + ROW / 2 - 4);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText(fmtD(x.data) + (cat ? ' · ' + cat.nome : ''), 82, y + ROW / 2 + 14);
    // Amount
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(fmt(x.valor), W - 24, y + ROW / 2 + 6);
    ctx.textAlign = 'left';
    // Separator
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(82, y + ROW - 1); ctx.lineTo(W - 24, y + ROW - 1); ctx.stroke();
  });

  if (list.length > 20) {
    const y = HEADER + 20 * ROW;
    ctx.fillStyle = '#1f2937'; ctx.fillRect(0, y, W, FOOTER);
    ctx.fillStyle = '#9ca3af'; ctx.font = '500 13px -apple-system, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`+ ${list.length - 20} mais transações — Total: ${fmt(tot)}`, W / 2, y + FOOTER / 2 + 5);
    ctx.textAlign = 'left';
  }

  // Footer
  const fy = canvas.height - FOOTER;
  ctx.fillStyle = '#1f2937'; ctx.fillRect(0, fy, W, FOOTER);
  ctx.fillStyle = '#6b7280'; ctx.font = '500 12px -apple-system, sans-serif';
  ctx.fillText('Finanças Pessoais v6.5 · ' + new Date().toLocaleDateString('pt-BR'), 24, fy + FOOTER / 2 + 5);

  canvas.toBlob(async blob => {
    const file = new File([blob], 'relatorio_' + today() + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Relatório de despesas', text: fmt(tot) + ' · ' + list.length + ' transações' }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio_' + today() + '.png'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast('Relatório salvo! Compartilhe pelo gerenciador de arquivos.');
  }, 'image/png');
}

// ── DATAGRID ──────────────────────────────────────────────────────
const DG_COLS_ALL = [
  { id: 'data',     label: 'Data',         w: 90 },
  { id: 'desc',     label: 'Descrição',    w: 160 },
  { id: 'cat',      label: 'Categoria',    w: 110 },
  { id: 'sub',      label: 'Subcategoria', w: 110 },
  { id: 'pag',      label: 'Pagamento',    w: 100 },
  { id: 'cart',     label: 'Cartão',       w: 100 },
  { id: 'acc',      label: 'Conta',        w: 100 },
  { id: 'valor',    label: 'Valor',        w: 90  },
  { id: 'parcela',  label: 'Parcela',      w: 70  },
  { id: 'obs',      label: 'Obs.',         w: 120 },
];
let dgVisibleCols = gl('dgCols') || ['data','desc','cat','pag','valor'];
let dgSort = { col: 'data', asc: false };
let dgColOrder = gl('dgColOrder') || DG_COLS_ALL.map(c => c.id);

function renderDGColToggle() {
  const el = document.getElementById('dg-col-toggle'); if (!el) return;
  el.innerHTML = DG_COLS_ALL.map(c =>
    `<div class="chip ${dgVisibleCols.includes(c.id)?'act':''}" onclick="toggleDGCol('${c.id}',this)">${c.label}</div>`
  ).join('');
}
function toggleDGCol(id, el) {
  if (dgVisibleCols.includes(id)) {
    if (dgVisibleCols.length <= 2) { toast('Mínimo 2 colunas.'); return; }
    dgVisibleCols = dgVisibleCols.filter(c => c !== id);
  } else {
    dgVisibleCols.push(id);
  }
  gs('dgCols', dgVisibleCols);
  el.classList.toggle('act');
  renderDG();
}
function renderDG() {
  const mes = (document.getElementById('dg-mes') || {}).value || curMes;
  const fq = ((document.getElementById('dg-q') || {}).value || '').toLowerCase();
  const fcat = (document.getElementById('dg-cat') || {}).value || '';
  let rows = desps.filter(d => mesKey(d.data) === mes);
  if (fcat) rows = rows.filter(d => d.catId === fcat);
  if (fq) rows = rows.filter(d => d.desc.toLowerCase().includes(fq) || (d.obs || '').toLowerCase().includes(fq));
  // Sort
  rows.sort((a, b) => {
    let va = getCellVal(a, dgSort.col), vb = getCellVal(b, dgSort.col);
    if (dgSort.col === 'valor') { va = a.valor; vb = b.valor; }
    if (va < vb) return dgSort.asc ? -1 : 1;
    if (va > vb) return dgSort.asc ? 1 : -1;
    return 0;
  });
  const tot = rows.reduce((s, d) => s + d.valor, 0);
  const lbl = document.getElementById('dg-lbl'); if (lbl) lbl.textContent = rows.length + ' registros';
  const totEl = document.getElementById('dg-tot'); if (totEl) totEl.textContent = fmt(tot);

  const visibleCols = DG_COLS_ALL.filter(c => dgVisibleCols.includes(c.id));
  const head = document.getElementById('dg-head');
  if (head) head.innerHTML = visibleCols.map(c =>
    `<th onclick="dgSetSort('${c.id}')" class="${dgSort.col===c.id?'sorted':''}" style="min-width:${c.w}px">${c.label}<span class="sort-icon">${dgSort.col===c.id?(dgSort.asc?'↑':'↓'):'↕'}</span></th>` +
    (c.id === 'obs' ? '' : '')
  ).join('') + '<th style="min-width:60px">Ações</th>';

  const body = document.getElementById('dg-body');
  if (body) body.innerHTML = rows.map(d =>
    `<tr>${visibleCols.map(c => {
      const v = getCellVal(d, c.id);
      if (c.id === 'valor') return `<td class="amt">${fmt(d.valor)}</td>`;
      return `<td title="${v}">${v}</td>`;
    }).join('')}<td><div style="display:flex;gap:4px"><button class="btn xs" onclick="editDesp('${d.id}')">✏️</button><button class="btn xs dn" onclick="delDesp('${d.id}')">✕</button></div></td></tr>`
  ).join('');

  renderDGColToggle();
  populateDGCatSel();
}
function getCellVal(d, col) {
  if (col === 'data')    return d.data || '';
  if (col === 'desc')    return d.desc || '';
  if (col === 'cat')     return (cats.find(c => c.id === d.catId) || {}).nome || '';
  if (col === 'sub')     return (subs.find(s => s.id === d.subId) || {}).nome || '';
  if (col === 'pag')     return (pags.find(p => p.id === d.pagId) || {}).nome || '';
  if (col === 'cart')    return (carts.find(c => c.id === d.cartId) || {}).nome || '';
  if (col === 'acc')     return (accs.find(a => a.id === d.accId) || {}).nome || '';
  if (col === 'valor')   return d.valor || 0;
  if (col === 'parcela') return d.totalParcelas ? `${d.parcela}/${d.totalParcelas}` : '';
  if (col === 'obs')     return d.obs || '';
  return '';
}
function dgSetSort(col) { dgSort = { col, asc: dgSort.col === col ? !dgSort.asc : false }; renderDG(); }
function populateDGCatSel() {
  const el = document.getElementById('dg-cat'); if (!el || el.options.length > 1) return;
  el.innerHTML = '<option value="">Todas categorias</option>' + cats.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}
function populateDGMesSel() {
  const ms = [...new Set([today().slice(0,7),...desps.map(d=>mesKey(d.data))])].sort().reverse();
  const el = document.getElementById('dg-mes'); if (!el) return;
  el.innerHTML = ms.map(m=>{const[y,mo]=m.split('-');const n=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'});return`<option value="${m}"${m===curMes?' selected':''}>${n}</option>`}).join('');
}
function exportDGCSV() {
  const mes = (document.getElementById('dg-mes') || {}).value || curMes;
  const rows = desps.filter(d => mesKey(d.data) === mes);
  const visibleCols = DG_COLS_ALL.filter(c => dgVisibleCols.includes(c.id));
  const hdr = visibleCols.map(c => c.label).join(',');
  const data = rows.map(d => visibleCols.map(c => {
    const v = getCellVal(d, c.id);
    return `"${String(v).replace(/"/g, '""')}"`;
  }).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(hdr + '\n' + data);
  a.download = 'dados_' + mes + '.csv'; a.click();
}



// ════ FEATURES v7.x ════


// ── GLOBALS v7.5 ──────────────────────────────────────────────
let recorrencias = gl('recorrencias') || [];
let assinTipoFilt = '';
let orcTipo = 'cat';
let _importPreview = null;
const DG_ALL_COLS = [
  {id:'data',   label:'Data',      def:true},
  {id:'desc',   label:'Descrição', def:true},
  {id:'valor',  label:'Valor',     def:true},
  {id:'cat',    label:'Categoria', def:true},
  {id:'sub',    label:'Subcat',    def:false},
  {id:'pag',    label:'Pagamento', def:false},
  {id:'cart',   label:'Cartão',    def:false},
  {id:'acc',    label:'Conta',     def:true},
  {id:'parcela',label:'Parcela',   def:false},
  {id:'obs',    label:'Obs',       def:false},
  {id:'acao',   label:'Ações',     def:true},
];
let dgCols = gl('dgCols') || DG_ALL_COLS.filter(c=>c.def).map(c=>c.id);
const PERIODOS = {
  semanal:    {label:'Semanal',    fator:52},
  quinzenal:  {label:'Quinzenal',  fator:26},
  mensal:     {label:'Mensal',     fator:12},
  bimestral:  {label:'Bimestral',  fator:6},
  trimestral: {label:'Trimestral', fator:4},
  semestral:  {label:'Semestral',  fator:2},
  anual:      {label:'Anual',      fator:1},
};


// ── nav() ÚNICO ───────────────────────────────────────────────
const TITLES = {
  resumo:'Resumo', lancar:'Lançar', transacoes:'Transações',
  calendario:'Calendário', parcelas:'Parcelamentos', contas:'Contas',
  cartoes:'Cartões', categorias:'Categorias', pagamentos:'Pagamentos',
  orcamento:'Orçamento', planilha:'Planilha / Sync', perfil:'Perfil & Config',
  config:'Configurações', datagrid:'Grade de dados', relatorio:'Relatório',
  importar:'Importar / Migração',
};

function nav(p, btn) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('on'));
  const page = document.getElementById('p-'+p);
  if (page) page.classList.add('on');
  document.querySelectorAll('.sbtn').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  else document.querySelector(`.sbtn[data-p="${p}"]`)?.classList.add('act');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = TITLES[p] || p;
  if (window.innerWidth < 640 && sbOpen) { closeSB(); }
  // Scroll to top após transição do sidebar
  setTimeout(() => {
    const cnt = document.querySelector('.cnt');
    if (cnt) cnt.scrollTop = 0;
  }, 50);

  // Inicializar página
  const inits = {
    resumo:     () => { populateRSels(); renderResumo(); },
    lancar:     () => { populateForm(); },
    transacoes: () => { const btn=document.querySelector('#period-chips .chip'); if(btn){setPer2('mes',btn);} populateFlt(); renderTrans(); },
    calendario: () => { _initCalFltSels(); renderCalPlus(); },
    parcelas:   () => { populateAssinSelects(); renderParcs(); },
    orcamento:  () => { renderOrcPlus(); },
    relatorio:  () => { initRelatorio(); },
    datagrid:   () => { populateDGMesSel(); initDGColChips(); renderDGPlus(); },
    config:     () => { cfgTab('contas', null); },
    dados:      () => { dadosTab('sync', null); updateSyncHero(); onImpTipo(); populateDel2Sels(); updateDriveStatus(); },
    perfil:     () => {
      renderPerfil(); renderCfg(); renderMetaAccs();
      ['pf-seg','pf-tema','pf-dados'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
      const info=document.getElementById('pf-info'); if(info)info.style.display='block';
      document.querySelectorAll('#p-perfil .tab').forEach((b,i)=>i===0?b.classList.add('act'):b.classList.remove('act'));
    },
  };
  inits[p]?.();
}


// ── doSync() LIMPO — lotes de 50, sem timeout, anti-duplicata ──
async function doSync() {
  if (!cfg.shUrl || !navigator.onLine) return;

  // Limpar pendentes órfãos
  pend = pend.filter(id => desps.find(d=>d.id===id));
  saveAll(); updSyncBnr();

  if (!pend.length) {
    const h = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    syncUI('on', `Sync ${h}`); updateSyncHero(); return;
  }

  const toSync = desps.filter(d => pend.includes(d.id));
  const total  = toSync.length;
  const BATCH  = 50;
  let done = 0;

  const setUI = (n) => {
    const rest = total - n;
    syncUI('sync', `${rest} pendentes`);
    const hs = document.getElementById('sync-hero-status');
    const hb = document.getElementById('sync-hero-sub');
    if (hs) hs.textContent = n < total ? `Enviando ${n}/${total}` : 'Enviado ✓';
    if (hb) hb.textContent = n < total ? `${rest} restantes...` : '';
    const bt = document.getElementById('bnr-sync-txt');
    if (bt && rest > 0) bt.textContent = `${rest} pendente(s) — enviando...`;
  };

  setUI(0);

  for (let i = 0; i < toSync.length; i += BATCH) {
    const batch = toSync.slice(i, i + BATCH);
    const rows  = batch.map(d => {
      const cat=cats.find(c=>c.id===d.catId), sub=subs.find(s=>s.id===d.subId),
            pag=pags.find(p=>p.id===d.pagId), cart=carts.find(c=>c.id===d.cartId),
            acc=accs.find(a=>a.id===d.accId);
      return [d.data,d.desc,cat?.nome||'',sub?.nome||'',pag?.nome||'',
              cart?.nome||'',acc?.nome||'',Number(d.valor).toFixed(2),
              d.parcela||'',d.totalParcelas||'',d.obs||'',d.id];
    });

    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      let json;
      try {
        const res = await fetch(cfg.shUrl, {
          method:'POST', headers:{'Content-Type':'text/plain'},
          body: JSON.stringify({action:'addRows', rows}),
          signal: ctrl.signal
        });
        clearTimeout(timer);
        json = await res.json();
      } catch (fetchErr) {
        clearTimeout(timer);
        if (fetchErr.name === 'AbortError') {
          toast(`⏱ Timeout no lote ${Math.floor(i/BATCH)+1}. Progresso salvo — toque Enviar para continuar.`);
          break;
        }
        // CORS bloqueado — tentar no-cors (envia mas não lê resposta)
        await fetch(cfg.shUrl, {method:'POST', mode:'no-cors',
          headers:{'Content-Type':'text/plain'},
          body: JSON.stringify({action:'addRows', rows})});
        json = {ok:true, inserted:batch.length};
      }

      if (json?.ok) {
        batch.forEach(d => { d.ss = 's'; });
        pend = pend.filter(id => !batch.find(d => d.id===id));
        done += batch.length;
        saveAll(); updSyncBnr(); setUI(done);
      } else {
        toast('Erro planilha: '+(json?.error||'?'));
        break;
      }
    } catch(e) {
      toast('Erro de conexão.'); break;
    }

    if (i + BATCH < toSync.length)
      await new Promise(r => setTimeout(r, 250));
  }

  const hora = new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  syncUI(pend.length===0 ? 'on' : 'off',
         pend.length===0 ? `Sync ${hora}` : `${pend.length} pendentes`);
  if (done > 0) toast(`✓ ${done} enviados!`);
  renderPend(); updateSyncHero(); saveAll();
}


// ── togSB limpo ───────────────────────────────────────────────
function togSB() {
  sbOpen = !sbOpen; applySB();
  const icon = document.getElementById('sb-tog-icon');
  if (icon) icon.innerHTML = sbOpen
    ? '<path d="M10 3L4 8l6 5"/>'
    : '<path d="M6 3l6 5-6 5"/>';
}

async function _impJSON(file, negPos, onlyD) {
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('JSON inválido — verifique o arquivo'); }

  let d = Array.isArray(data.desps) ? [...data.desps] : [];
  if (negPos) d = d.map(x => ({...x, valor: Math.abs(x.valor)}));
  if (onlyD)  d = d.filter(x => x.valor > 0);

  return {
    desps: d,
    cats:  Array.isArray(data.cats)  ? data.cats  : [],
    subs:  Array.isArray(data.subs)  ? data.subs  : [],
    accs:  Array.isArray(data.accs)  ? data.accs  : [],
    pags:  Array.isArray(data.pags)  ? data.pags  : [],
    orcs:  data.orcs || {},
    source: 'json'
  };
}

async function _impXLSX(file, negPos, onlyD) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B)
    throw new Error('Não é um arquivo .xlsx válido');

  const zip = await _unzip(buf);
  const sst = _parseSst(zip['xl/sharedStrings.xml'] || '');
  const sh  = zip['xl/worksheets/sheet1.xml'] || '';

  function cellVal(cellXml) {
    const tM = cellXml.match(/t="([^"]*)"/);
    const vM = cellXml.match(/<v>([^<]*)<\/v>/);
    if (!vM) return '';
    if (tM && tM[1]==='s') return sst[parseInt(vM[1])] || '';
    return vM[1];
  }
  function xlDate(serial) {
    const d = new Date(Date.UTC(1899,11,30) + parseFloat(serial)*86400000);
    return d.toISOString().slice(0,10);
  }

  const rowMatches = [...sh.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)];
  const desps = [];

  for (const [, rn, rowXml] of rowMatches) {
    if (parseInt(rn) <= 3) continue;
    const cells = [...rowXml.matchAll(/<c [^>]*>[\s\S]*?<\/c>/g)].map(m => cellVal(m[0]));
    if (!cells[0]) continue;
    let valor = parseFloat(cells[0]);
    if (isNaN(valor)) continue;
    if (onlyD && valor > 0) continue;
    if (negPos) valor = Math.abs(valor);
    if (valor <= 0) continue;

    const catNome = cells[2]||'';
    const accNome = cells[3]||'';
    const dataRaw = cells[4]||'';
    const desc    = (cells[5]||'').trim() || (cells[6]||'').trim() || catNome || 'Despesa';
    const obs     = (cells[5]||'').trim() && (cells[6]||'').trim() ? (cells[6]||'').trim() : '';
    const data    = dataRaw ? xlDate(dataRaw) : '';
    if (!data) continue;

    const cat  = cats.find(c => c.nome.toLowerCase() === catNome.toLowerCase());
    const sub  = subs.find(s => s.nome.toLowerCase() === catNome.toLowerCase());
    const acc  = accs.find(a => a.nome.toLowerCase() === accNome.toLowerCase());

    desps.push({
      id:uid(), desc:desc.slice(0,80), valor:Math.round(valor*100)/100, data,
      pagId:'px', cartId:'',
      catId:cat?.id||sub?.pai||'', subId:sub?.id||'',
      accId:acc?.id||'', obs:obs.slice(0,100), ss:'p'
    });
  }
  return { desps, cats:[], subs:[], accs:[], pags:[], orcs:{}, source:'xlsx' };
}

function _initCalFltSels() {
  const calAcc = document.getElementById('cal-acc-flt');
  if (calAcc) calAcc.innerHTML = '<option value="">Todas contas</option>'+
    accs.map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
  const calCat = document.getElementById('cal-cat-flt');
  if (calCat) calCat.innerHTML = '<option value="">Todas cats</option>'+
    cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');
}

function _parseSst(xml) {
  return [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(m=>m[1]);
}

function _showImpResult(r, merge) {
  const el  = document.getElementById('imp-result');
  const act = document.getElementById('imp-actions');
  if (!el||!act) return;
  const total = r.desps.reduce((s,d)=>s+d.valor,0);
  el.style.display='block'; act.style.display='block';
  el.innerHTML = `
    <div style="color:var(--eme);font-weight:700;font-size:14px;margin-bottom:8px">✓ Arquivo lido com sucesso</div>
    <div>📊 <strong>${r.desps.length}</strong> despesas</div>
    <div>💰 Total: <strong>${fmt(total)}</strong></div>
    ${r.cats.length?`<div>🏷️ ${r.cats.length} categorias</div>`:''}
    ${r.accs.length?`<div>🏦 ${r.accs.length} contas</div>`:''}
    <div style="margin-top:8px;color:var(--txt3);font-size:11px">Modo: ${merge?'Mesclar com dados existentes':'Substituir tudo'}</div>
    <div style="margin-top:4px;color:var(--amb);font-size:11px">⚠ Confirme abaixo — não pode ser desfeito.</div>`;
}

async function _unzip(buf) {
  const result = {}, dec = new TextDecoder('utf-8');
  const view = new DataView(buf);
  let pos = 0;
  while (pos < buf.byteLength - 4) {
    if (view.getUint32(pos, true) !== 0x04034b50) { pos++; continue; }
    const method  = view.getUint16(pos+8,  true);
    const compSz  = view.getUint32(pos+18, true);
    const fnLen   = view.getUint16(pos+26, true);
    const exLen   = view.getUint16(pos+28, true);
    const fname   = dec.decode(new Uint8Array(buf, pos+30, fnLen));
    const dStart  = pos+30+fnLen+exLen;
    if (method === 0) {
      result[fname] = dec.decode(new Uint8Array(buf, dStart, compSz));
    } else if (method === 8) {
      try {
        const ds = new DecompressionStream('deflate-raw');
        const w  = ds.writable.getWriter();
        w.write(new Uint8Array(buf, dStart, compSz)); w.close();
        const chunks = []; const r = ds.readable.getReader();
        for(;;){const{done,value}=await r.read();if(done)break;chunks.push(value);}
        const tot = chunks.reduce((s,c)=>s+c.length,0);
        const out = new Uint8Array(tot); let off=0;
        chunks.forEach(c=>{out.set(c,off);off+=c.length;});
        result[fname] = dec.decode(out);
      } catch{}
    }
    pos = dStart + compSz;
  }
  return result;
}

function addAssinatura() {
  const nome   = document.getElementById('as-nome')?.value.trim();
  const valor  = parseMoeda(document.getElementById('as-val')?.value||'');
  const periodo= document.getElementById('as-periodo')?.value || 'mensal';
  const dia    = parseInt(document.getElementById('as-dia')?.value) || new Date().getDate();
  const catId  = document.getElementById('as-cat')?.value || '';
  const accId  = document.getElementById('as-acc')?.value || '';
  const inicio = document.getElementById('as-inicio')?.value || today();
  const fim    = document.getElementById('as-fim')?.value || '';
  const obs    = document.getElementById('as-obs')?.value.trim() || '';
  const tipo   = document.querySelector('input[name="as-tipo"]:checked')?.value || 'assinatura';
  const nParc  = tipo === 'parcelado' ? (parseInt(document.getElementById('as-n')?.value) || 0) : 0;

  if (!nome || !valor || valor <= 0) { toast('Preencha nome e valor.'); return; }
  if (tipo === 'parcelado' && nParc < 2) { toast('Informe ao menos 2 parcelas.'); return; }

  const rec = { id: uid(), nome, valor, periodo, dia, catId, accId, inicio, fim, obs, tipo, ativa: true };
  if (tipo === 'parcelado') {
    rec.totalParcelas = nParc;
    rec.parcelaAtual  = 1;
    rec.valorParcela  = valor / nParc;
  }
  recorrencias.unshift(rec);
  saveAll();
  renderAssinaturas();
  // Fechar form e limpar
  togAssinForm();
  ['as-nome','as-val','as-dia','as-obs'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
  toast('Recorrência salva!');
}

function applyMigCats() {
  let changes = 0;
  cats.forEach(c => {
    const sel = document.getElementById(`mig-cat-sel-${c.id}`);
    if (!sel || sel.value !== 'acc') return;
    let accId = accs.find(a=>a.nome.toLowerCase()===c.nome.toLowerCase())?.id;
    if (!accId) {
      accId = uid();
      accs.push({id:accId, nome:c.nome, emoji:'🏦', tipo:'carteira', cor:c.cor||'#6366f1', saldo:0});
    }
    desps.forEach(d => { if (d.catId===c.id) { d.accId=accId; d.catId=''; changes++; }});
  });
  saveAll(); renderAll();
  toast(`✓ ${changes} despesas convertidas!`);
}

function applyMigPags() {
  let changes = 0;
  const accsUniq = [...new Set(desps.map(d=>d.accId).filter(Boolean))];
  accsUniq.forEach(accId => {
    const sel = document.getElementById(`mig-pag-${accId}`);
    if (!sel) return;
    desps.forEach(d => { if (d.accId===accId && d.pagId==='px') { d.pagId=sel.value; changes++; }});
  });
  saveAll();
  toast(`✓ ${changes} pagamentos atualizados!`);
}

function applyMigSubs() {
  let changes = 0;
  subs.forEach(s => {
    const sel = document.getElementById(`mig-sub-sel-${s.id}`);
    if (!sel) return;
    const v = sel.value;
    if (v === 'sub') return;

    if (v === 'novo_cartao' || v === 'cartao') {
      // Criar cartão com o nome da sub e mapear despesas
      let cartId = carts.find(c=>c.nome.toLowerCase()===s.nome.toLowerCase())?.id;
      if (!cartId) {
        cartId = uid();
        carts.push({id:cartId, nome:s.nome, emoji:'💳', bandeira:'outro', cor:'#6366f1', limit:0, fechamento:1, vencimento:10, accId:''});
      }
      desps.forEach(d => { if (d.subId===s.id) { d.cartId=cartId; d.subId=''; d.pagId='cr'; changes++; }});
    } else if (v === 'novo_acc' || v === 'conta') {
      let accId = accs.find(a=>a.nome.toLowerCase()===s.nome.toLowerCase())?.id;
      if (!accId) {
        accId = uid();
        accs.push({id:accId, nome:s.nome, emoji:'🏦', tipo:'carteira', cor:'#14b8a6', saldo:0});
      }
      desps.forEach(d => { if (d.subId===s.id) { d.accId=accId; d.subId=''; changes++; }});
    }
  });
  saveAll(); renderAll();
  toast(`✓ ${changes} despesas remapeadas!`);
}

function applySplit(despId) {
  const d = desps.find(x=>x.id===despId);
  if (!d) return;
  const n    = Math.max(2, parseInt(document.getElementById('sp-n')?.value)||2);
  const dt   = document.getElementById('sp-dt')?.value || d.data;
  const freq = document.getElementById('sp-freq')?.value || 'm';
  const parc = Math.round(d.valor/n*100)/100;
  const gid  = d.grupoId || uid();

  // Remover despesa original
  desps = desps.filter(x=>x.id!==despId);
  pend  = pend.filter(x=>x!==despId);

  let cur = new Date(dt+'T12:00:00');
  for (let i=0;i<n;i++) {
    const newId = uid();
    desps.push({...d, id:newId, valor:parc, data:cur.toISOString().slice(0,10),
      parcela:i+1, totalParcelas:n, grupoId:gid, ss:'p'});
    pend.push(newId);
    if (freq==='m')      cur.setMonth(cur.getMonth()+1);
    else if (freq==='q') cur.setDate(cur.getDate()+15);
    else                 cur.setDate(cur.getDate()+7);
  }

  saveAll(); renderAll(); closeModal();
  toast(`✓ Dividido em ${n} parcelas!`);
}

async function backupToDrive() {
  if (!cfg.shUrl) {
    toast('Configure a URL do Apps Script em Planilha/Sync primeiro.');
    nav('planilha', null); return;
  }
  if (!navigator.onLine) { toast('Sem internet.'); return; }

  const res = document.getElementById('drive-result');
  const dot = document.getElementById('drive-dot');
  if (res) res.innerHTML = '<span style="color:var(--amb)">⏳ Enviando dados para o Drive...</span>';
  if (dot) dot.style.background = 'var(--amb)';
  toast('Iniciando backup...');

  // Montar linhas
  const rows = [
    ['Data','Descrição','Categoria','Subcategoria','Pagamento','Cartão','Conta','Valor','Parcela','Total Parcelas','Obs']
  ];
  desps.forEach(d => {
    const cat=cats.find(c=>c.id===d.catId), sub=subs.find(s=>s.id===d.subId),
          pag=pags.find(p=>p.id===d.pagId), cart=carts.find(c=>c.id===d.cartId),
          acc=accs.find(a=>a.id===d.accId);
    rows.push([d.data, d.desc, cat?.nome||'', sub?.nome||'', pag?.nome||'',
               cart?.nome||'', acc?.nome||'', d.valor.toFixed(2),
               d.parcela||'', d.totalParcelas||'', d.obs||'']);
  });

  try {
    const r = await fetch(cfg.shUrl, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({
        action:'backupToDrive',
        rows,
        meta: {
          cats, subs, accs,
          folder: cfg.driveFolder || '',
          filename: `Financas_${today()}.xlsx`
        }
      })
    });
    const json = await r.json();
    if (json.ok) {
      cfg.lastDriveBackup = new Date().toISOString();
      saveAll();
      const link = json.url ? ` · <a href="${json.url}" target="_blank" style="color:var(--accent2)">Abrir ↗</a>` : '';
      if (res) res.innerHTML = `<span style="color:var(--eme)">✓ Backup salvo no Drive${link}</span>`;
      if (dot) dot.style.background = 'var(--eme)';
      updateDriveStatus();
      toast('✓ Backup no Drive concluído!');
    } else {
      throw new Error(json.error || 'Erro desconhecido no script');
    }
  } catch(e) {
    if (res) res.innerHTML = `<span style="color:var(--rose)">✗ ${e.message}</span>`;
    if (dot) dot.style.background = 'var(--rose)';
    toast('Erro: ' + e.message);
  }
}

function buildRelatorio() {
  const mes = (document.getElementById('rel-mes')||{}).value || curMes;
  const fcat = (document.getElementById('rel-cat')||{}).value || '';
  const facc = (document.getElementById('rel-acc')||{}).value || '';
  const fpag = (document.getElementById('rel-pag')||{}).value || '';
  const incResumo = document.getElementById('rel-inc-resumo')?.checked;
  const incCats   = document.getElementById('rel-inc-cats')?.checked;
  const incLista  = document.getElementById('rel-inc-lista')?.checked;
  const incParc   = document.getElementById('rel-inc-parc')?.checked;

  let list = desps.filter(d => mesKey(d.data) === mes);
  if(fcat) list = list.filter(d => d.catId === fcat);
  if(facc) list = list.filter(d => d.accId === facc);
  if(fpag) list = list.filter(d => d.pagId === fpag);
  list.sort((a,b) => a.data < b.data ? 1 : -1);

  const tot = list.reduce((s,d) => s+d.valor, 0);
  const[y,mo] = mes.split('-');
  const mesLabel = new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  let html = '';

  // RESUMO
  if(incResumo) {
    const cart = list.filter(d=>{const p=pags.find(q=>q.id===d.pagId);return p&&(p.tipo==='credit'||p.tipo==='debit')}).reduce((s,d)=>s+d.valor,0);
    const pix  = list.filter(d=>{const p=pags.find(q=>q.id===d.pagId);return p&&(p.tipo==='pix'||p.tipo==='dinheiro')}).reduce((s,d)=>s+d.valor,0);
    html += `<div class="rel-section">
      <div class="rel-section-title">Resumo · ${mesLabel}</div>
      <div class="rel-hero-val">${fmt(tot)}</div>
      <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">${list.length} transações</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="mc b"><div class="ml">Cartão/Débito</div><div class="mv b">${fmt(cart)}</div></div>
        <div class="mc g"><div class="ml">Pix/Dinheiro</div><div class="mv g">${fmt(pix)}</div></div>
      </div>
    </div>`;
  }

  // POR CATEGORIA
  if(incCats) {
    const bc = {};
    list.forEach(d => { if(d.catId) bc[d.catId]=(bc[d.catId]||0)+d.valor; });
    const sorted = Object.entries(bc).sort((a,b)=>b[1]-a[1]);
    if(sorted.length) {
      const mx = sorted[0][1];
      html += `<div class="rel-section"><div class="rel-section-title">Por categoria</div>`;
      html += sorted.map(([id,v]) => {
        const c = cats.find(x=>x.id===id)||{nome:id,cor:'#888',emoji:'📦'};
        const pct = clamp(v/mx*100);
        const pctTot = tot>0 ? Math.round(v/tot*100) : 0;
        return `<div class="rel-cat-row">
          <span style="font-size:18px;width:24px;flex-shrink:0">${c.emoji||'📦'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;margin-bottom:4px">${c.nome} <span style="font-size:10px;color:var(--txt3);font-weight:400">${pctTot}%</span></div>
            <div class="prog"><div class="pf" style="width:${pct}%;background:${c.cor}"></div></div>
          </div>
          <span style="font-size:13px;font-weight:700;color:var(--rose);margin-left:10px;flex-shrink:0">${fmt(v)}</span>
        </div>`;
      }).join('');
      html += '</div>';
    }
  }

  // LISTA DE TRANSAÇÕES
  if(incLista) {
    html += `<div class="rel-section"><div class="rel-section-title">Transações (${list.length})</div>`;
    html += list.slice(0,50).map(d => {
      const cat = cats.find(c=>c.id===d.catId);
      const pag = pags.find(p=>p.id===d.pagId);
      return `<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:0.5px solid var(--bdr)">
        <div style="width:32px;height:32px;border-radius:10px;background:${cat?cat.cor+'22':'var(--bg3)'};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${cat?cat.emoji||'📦':'📦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.desc}${d.totalParcelas?` <span style="font-size:10px;color:var(--txt3)">${d.parcela}/${d.totalParcelas}</span>`:''}</div>
          <div style="font-size:11px;color:var(--txt3)">${fmtD(d.data)}${pag?' · '+pag.nome:''}${cat?' · '+cat.nome:''}</div>
        </div>
        <span style="font-size:13px;font-weight:700;color:var(--rose);flex-shrink:0">${fmt(d.valor)}</span>
      </div>`;
    }).join('');
    if(list.length > 50) html += `<div style="text-align:center;padding:10px;font-size:12px;color:var(--txt3)">+ ${list.length-50} mais transações</div>`;
    html += '</div>';
  }

  // PARCELAMENTOS
  if(incParc) {
    const groups = {};
    desps.filter(d=>d.totalParcelas>1).forEach(d=>{
      const k=d.grupoId||d.id;
      if(!groups[k]) groups[k]={desc:d.desc,list:[],count:d.totalParcelas,catId:d.catId};
      groups[k].list.push(d);
    });
    const gList = Object.values(groups);
    if(gList.length) {
      html += `<div class="rel-section"><div class="rel-section-title">Parcelamentos ativos (${gList.length})</div>`;
      html += gList.map(g => {
        const cat = cats.find(c=>c.id===g.catId);
        const pagas = g.list.filter(p=>p.data<=today()).length;
        const fut = g.list.filter(p=>p.data>today()).reduce((s,p)=>s+p.valor,0);
        const tot2 = g.list.reduce((s,p)=>s+p.valor,0);
        const pct = clamp(pagas/g.count*100);
        return `<div style="padding:9px 0;border-bottom:0.5px solid var(--bdr)">
          <div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
            <span style="font-size:18px">${cat?cat.emoji||'📦':'📦'}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:600">${g.desc}</div>
              <div style="font-size:11px;color:var(--txt3)">${pagas}/${g.count} pagas · total ${fmt(tot2)}</div>
            </div>
            <span style="font-size:12px;color:var(--rose);font-weight:700;flex-shrink:0">falta ${fmt(fut)}</span>
          </div>
          <div class="prog"><div class="pf" style="width:${pct}%;background:${cat?cat.cor:'var(--accent)'}"></div></div>
        </div>`;
      }).join('');
      html += '</div>';
    }
  }

  const el = document.getElementById('rel-preview');
  if(el) el.innerHTML = html || '<div class="empty">Selecione ao menos uma seção para incluir no relatório.</div>';
}

function calcAssinPV() {
  const v = parseMoeda(document.getElementById('as-val')?.value||'') || 0;
  const n = parseInt(document.getElementById('as-n')?.value) || 1;
  const el = document.getElementById('as-pv');
  if (el) el.textContent = n > 0 ? fmt(v / n) : 'R$ 0,00';
}

function cancelImport() {
  _importPreview=null;
  document.getElementById('imp-result').style.display='none';
  document.getElementById('imp-actions').style.display='none';
  const icon=document.getElementById('imp-zone-icon');
  const text=document.getElementById('imp-zone-text');
  const sub =document.getElementById('imp-zone-sub');
  if(icon)icon.textContent='📂';
  if(text)text.textContent='Toque aqui para selecionar';
  if(sub) sub.textContent='importar_bak.json ou .xlsx';
}

function checkAutoBackup() {
  if (!cfg.shUrl) return;
  const freq = cfg.driveFreq || 'never';
  if (freq === 'never') return;
  const last = cfg.lastDriveBackup ? new Date(cfg.lastDriveBackup) : null;
  const now  = new Date();
  const diff = last ? (now - last) : Infinity;
  const threshold = freq === 'daily' ? 23*3600*1000 : 6*24*3600*1000;
  if (diff > threshold) {
    console.log('Auto-backup Drive (' + freq + ')...');
    setTimeout(backupToDrive, 4000);
  }
}

function clearOrcItem(orcKey) {
  delete orcs[orcKey]; saveAll(); renderOrc();
}

function confirmImport() {
  if (!_importPreview) { toast('Selecione um arquivo primeiro.'); return; }
  const { result:r, merge } = _importPreview;

  if (!merge) {
    desps=[]; cats=[]; subs=[]; accs=[];
    pags=[{id:'cr',nome:'Crédito',tipo:'credit'},{id:'db',nome:'Débito',tipo:'debit'},
          {id:'px',nome:'Pix',tipo:'pix'},{id:'dn',nome:'Dinheiro',tipo:'dinheiro'}];
  }

  // Mesclar evitando duplicados por id
  const eD=new Set(desps.map(x=>x.id)), eC=new Set(cats.map(x=>x.id)),
        eS=new Set(subs.map(x=>x.id)),  eA=new Set(accs.map(x=>x.id));
  let added=0;
  r.desps.forEach(d=>{if(!eD.has(d.id)){desps.push(d);pend.push(d.id);added++;}});
  r.cats?.forEach(c=>{if(!eC.has(c.id))cats.push(c);});
  r.subs?.forEach(s=>{if(!eS.has(s.id))subs.push(s);});
  r.accs?.forEach(a=>{if(!eA.has(a.id))accs.push(a);});

  saveAll(); initMesSel(); renderAll(); updSyncBnr();
  _importPreview=null;
  document.getElementById('imp-result').style.display='none';
  document.getElementById('imp-actions').style.display='none';
  // Reset zone
  const icon=document.getElementById('imp-zone-icon');
  const text=document.getElementById('imp-zone-text');
  const sub =document.getElementById('imp-zone-sub');
  if(icon)icon.textContent='✅';
  if(text)text.textContent=`${added} despesas importadas!`;
  if(sub) sub.textContent='';
  toast(`✓ ${added} despesas importadas!`);
  setTimeout(()=>nav('resumo',null), 1500);
}

function delAllDGFiltered() {
  const mes  = document.getElementById('dg-mes')?.value   || curMes;
  const fcat = document.getElementById('dg-cat')?.value  || '';
  const facc = document.getElementById('dg-acc-flt')?.value || '';
  const fq   = (document.getElementById('dg-q')?.value   ||'').toLowerCase();
  let rows = desps.filter(d=>mesKey(d.data)===mes);
  if (fcat) rows=rows.filter(d=>d.catId===fcat);
  if (facc) rows=rows.filter(d=>d.accId===facc);
  if (fq)   rows=rows.filter(d=>(d.desc+' '+(d.obs||'')).toLowerCase().includes(fq));
  if (!rows.length) { toast('Nenhum registro filtrado.'); return; }
  openModal(`Apagar ${rows.length} registros?`,'Não pode ser desfeito.',()=>{
    const ids = new Set(rows.map(d=>d.id));
    desps = desps.filter(d=>!ids.has(d.id));
    pend  = pend.filter(x=>!ids.has(x));
    saveAll(); renderDG(); renderBadge(); updSyncBnr();
    toast(`✓ ${ids.size} apagados!`);
  });
}

function delAssin(id) {
  openModal('Remover recorrência?', 'Remove apenas o cadastro, não os lançamentos já gerados.', () => {
    recorrencias = recorrencias.filter(r => r.id !== id);
    saveAll(); renderAssinaturas(); toast('Removida!');
  });
}

function delDespById(id) {
  openModal('Apagar este lançamento?','',()=>{
    desps = desps.filter(d=>d.id!==id);
    pend  = pend.filter(x=>x!==id);
    saveAll(); renderDG(); renderBadge(); updSyncBnr();
    toast('Apagado!');
  });
}

function dlCSVDG() {
  const mes  = document.getElementById('dg-mes')?.value || curMes;
  let rows   = desps.filter(d=>mesKey(d.data)===mes);
  const fcat = document.getElementById('dg-cat')?.value||'';
  if(fcat) rows=rows.filter(d=>d.catId===fcat);
  const hdr  = 'Data,Descrição,Categoria,Subcategoria,Pagamento,Conta,Valor,Obs';
  const lines = rows.map(d=>{
    const cat=cats.find(c=>c.id===d.catId), sub=subs.find(s=>s.id===d.subId),
          pag=pags.find(p=>p.id===d.pagId), acc=accs.find(a=>a.id===d.accId);
    return `${d.data},"${d.desc}",${cat?.nome||''},${sub?.nome||''},${pag?.nome||''},${acc?.nome||''},${d.valor.toFixed(2)},"${d.obs||''}"`;
  });
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(hdr+'\n'+lines.join('\n'));
  a.download='despesas_'+mes+'.csv'; a.click();
  toast('CSV baixado!');
}

function dlRelatorioCSV() {
  const mes = (document.getElementById('rel-mes')||{}).value || curMes;
  const fcat = (document.getElementById('rel-cat')||{}).value || '';
  let list = desps.filter(d=>mesKey(d.data)===mes);
  if(fcat) list = list.filter(d=>d.catId===fcat);
  const hdr='Data,Descrição,Categoria,Pagamento,Conta,Valor,Parcela,Obs';
  const rows=list.map(d=>{
    const cat=cats.find(c=>c.id===d.catId),pag=pags.find(p=>p.id===d.pagId),acc=accs.find(a=>a.id===d.accId);
    return `${d.data},"${d.desc}",${cat?cat.nome:''},${pag?pag.nome:''},${acc?acc.nome:''},${d.valor.toFixed(2)},${d.totalParcelas?d.parcela+'/'+d.totalParcelas:''},"${d.obs||''}"`;
  });
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(hdr+'\n'+rows.join('\n'));
  a.download='relatorio_'+mes+'.csv';a.click();
  toast('CSV baixado!');
}

function editAssin(id) {
  const r = recorrencias.find(x => x.id === id);
  if (!r) return;
  openModal('Editar recorrência', '', null);
  document.getElementById('m-btns').style.display = 'none';
  const pOpts = Object.entries(PERIODOS).map(([k,v]) =>
    `<option value="${k}"${k===r.periodo?' selected':''}>${v.label}</option>`).join('');
  const cOpts = '<option value="">Nenhuma</option>' + cats.map(c =>
    `<option value="${c.id}"${c.id===r.catId?' selected':''}>${c.emoji||''} ${c.nome}</option>`).join('');
  const aOpts = '<option value="">Nenhuma</option>' + accs.map(a =>
    `<option value="${a.id}"${a.id===r.accId?' selected':''}>${a.emoji||'🏦'} ${a.nome}</option>`).join('');
  document.getElementById('m-extra').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px">
      <div class="edit-row"><label>Nome</label><input id="ea2-n" value="${r.nome}" style="flex:1"/></div>
      <div class="edit-row"><label>Valor R$</label><input id="ea2-v" type="number" value="${r.valor.toFixed(2)}" style="width:110px"/></div>
      <div class="edit-row"><label>Periodicidade</label><select id="ea2-p" style="flex:1">${pOpts}</select></div>
      <div class="edit-row"><label>Dia cobrança</label><input id="ea2-d" type="number" min="1" max="31" value="${r.dia||1}" style="width:70px"/></div>
      <div class="edit-row"><label>Categoria</label><select id="ea2-c" style="flex:1">${cOpts}</select></div>
      <div class="edit-row"><label>Conta</label><select id="ea2-a" style="flex:1">${aOpts}</select></div>
      <div class="edit-row"><label>Início</label><input id="ea2-i" type="date" value="${r.inicio||''}" style="flex:1"/></div>
      <div class="edit-row"><label>Término</label><input id="ea2-f" type="date" value="${r.fim||''}" style="flex:1"/></div>
      <div class="edit-row"><label>Obs.</label><input id="ea2-o" value="${r.obs||''}" style="flex:1"/></div>
      <div style="display:flex;gap:7px;margin-top:4px">
        <button class="btn pr sm" style="flex:1" onclick="saveAssinEdit('${id}')">Salvar</button>
        <button class="btn sm" style="flex:1" onclick="closeModal()">Cancelar</button>
        <button class="btn dn sm" onclick="delAssin('${id}');closeModal()">Apagar</button>
      </div>
    </div>`;
}

function execDel2() {
  const d1   = document.getElementById('del2-d1')?.value  || '';
  const d2   = document.getElementById('del2-d2')?.value  || '';
  const fcat = document.getElementById('del2-cat')?.value || '';
  const facc = document.getElementById('del2-acc')?.value || '';
  const delD = document.getElementById('del2-desp')?.checked;
  const delC = document.getElementById('del2-cfg')?.checked;
  const tudo = document.getElementById('del2-tudo')?.checked;

  const msg = tudo ? 'APAGAR TUDO? Isso reseta o app completamente.' :
              `Apagar ${delD?'despesas filtradas':''}${delC?' + configurações':''}?`;

  openModal(msg, 'Não pode ser desfeito.', () => {
    if (tudo) { clearAll(); return; }
    if (delD) {
      const antes = desps.length;
      desps = desps.filter(d => {
        if (d1 && d.data < d1) return true;
        if (d2 && d.data > d2) return true;
        if (fcat && d.catId !== fcat) return true;
        if (facc && d.accId !== facc) return true;
        return false;
      });
      toast(`✓ ${antes - desps.length} registros apagados`);
    }
    if (delC) { cats=[]; subs=[]; carts=[]; accs=[]; pags=[
      {id:'cr',nome:'Crédito',tipo:'credit'},{id:'db',nome:'Débito',tipo:'debit'},
      {id:'px',nome:'Pix',tipo:'pix'},{id:'dn',nome:'Dinheiro',tipo:'dinheiro'}];
    }
    pend = pend.filter(id => desps.find(d=>d.id===id));
    saveAll(); renderAll(); updSyncBnr();
    document.getElementById('del2-preview').textContent = 'Concluído.';
  });
}

function getAssinAlerts() {
  return recorrencias.filter(r => r.ativa && !( r.fim && r.fim < today() )).map(r => {
    const prox = proxData(r);
    const dias = Math.ceil((new Date(prox+'T12:00:00') - new Date()) / 864e5);
    return { ...r, prox, dias };
  }).filter(r => r.dias <= 5).sort((a,b) => a.dias - b.dias);
}

function handleDropImport(ev) {
  ev.preventDefault();
  const file = ev.dataTransfer?.files?.[0];
  if (file) handleImportFile(file);
}

async function handleImportFile(file) {
  if (!file) return;

  // Feedback visual imediato
  const icon = document.getElementById('imp-zone-icon');
  const text = document.getElementById('imp-zone-text');
  const sub  = document.getElementById('imp-zone-sub');
  if (icon) icon.textContent = '⏳';
  if (text) text.textContent = 'Lendo ' + file.name + '...';
  if (sub)  sub.textContent  = '';

  const tipo    = document.querySelector('input[name="imp-tipo"]:checked')?.value || 'json';
  const negPos  = document.getElementById('imp-neg-pos')?.checked !== false;
  const onlyD   = document.getElementById('imp-only-desp')?.checked !== false;
  const merge   = document.getElementById('imp-merge')?.checked !== false;

  try {
    let result;
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'json' || tipo === 'json') {
      result = await _impJSON(file, negPos, onlyD);
    } else if (ext === 'xlsx' || ext === 'xls' || tipo === 'xlsx') {
      result = await _impXLSX(file, negPos, onlyD);
    } else {
      throw new Error('Formato não suportado: .' + ext + '. Use .json ou .xlsx');
    }

    _importPreview = { result, merge };
    _showImpResult(result, merge);

    if (icon) icon.textContent = '✅';
    if (text) text.textContent = result.desps.length + ' despesas prontas';
    if (sub)  sub.textContent  = 'Confirme abaixo para importar';

  } catch(e) {
    if (icon) icon.textContent = '❌';
    if (text) text.textContent = 'Erro ao ler arquivo';
    if (sub)  sub.textContent  = e.message;
    const res = document.getElementById('imp-result');
    if (res) { res.style.display='block'; res.innerHTML=`<span style="color:var(--rose)">✗ ${e.message}</span>`; }
  }

  // Limpar input para permitir re-selecionar o mesmo arquivo
  const inp = document.getElementById('imp-file');
  if (inp) inp.value = '';
}

function impTab(t, btn) {
  ['imp','mig','drv'].forEach(x => {
    const el = document.getElementById('imp-t-'+x);
    if (el) el.style.display = x===t ? 'block' : 'none';
  });
  document.querySelectorAll('#imp-tabs .tab').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  if (t==='mig') renderMigration();
  if (t==='drv') { updateDriveStatus(); populateDel2Sels(); }
}

function initDGColChips() {
  const el = document.getElementById('dg-col-chips');
  if (!el) return;
  el.innerHTML = DG_ALL_COLS.map(c => `
    <span class="dg-col-toggle-chip ${dgCols.includes(c.id)?'on':''}"
      onclick="toggleDGCol('${c.id}',this)">${c.label}</span>`).join('');
}

function initRelatorio() {
  // Populate mes selector
  const ms = [...new Set([today().slice(0,7),...desps.map(d=>mesKey(d.data))])].sort().reverse();
  const rm = document.getElementById('rel-mes');
  if(rm) rm.innerHTML = ms.map(m => {
    const[y,mo]=m.split('-');
    const n=new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    return `<option value="${m}"${m===curMes?' selected':''}>${n}</option>`;
  }).join('');
  // Cats
  const rc = document.getElementById('rel-cat');
  if(rc) rc.innerHTML = '<option value="">Todas</option>' + cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');
  // Contas
  const ra = document.getElementById('rel-acc');
  if(ra) ra.innerHTML = '<option value="">Todas</option>' + accs.map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
  // Pag
  const rp = document.getElementById('rel-pag');
  if(rp) rp.innerHTML = '<option value="">Todos</option>' + pags.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('');
  buildRelatorio();
}

function lancarAssin(id) {
  const r = recorrencias.find(x => x.id === id);
  if (!r) return;
  const valor = r.tipo === 'parcelado' ? r.valorParcela : r.valor;
  const pagId = pags.find(p => p.tipo==='pix')?.id || pags[0]?.id || '';
  const despId = uid();
  desps.unshift({
    id: despId, desc: r.nome, valor, data: today(),
    pagId, catId: r.catId, accId: r.accId, obs: r.obs || '',
    cartId: '', subId: '', ss: 'p',
    grupoId: r.id, recorrenciaId: r.id,
    parcela: r.tipo==='parcelado' ? r.parcelaAtual : null,
    totalParcelas: r.tipo==='parcelado' ? r.totalParcelas : null,
  });
  pend.push(despId);
  // Avançar parcela se parcelado
  if (r.tipo === 'parcelado') {
    r.parcelaAtual = (r.parcelaAtual || 1) + 1;
    if (r.parcelaAtual > r.totalParcelas) { r.ativa = false; toast('✓ Lançado! Parcelamento concluído.'); }
    else toast(`✓ Parcela ${r.parcelaAtual-1}/${r.totalParcelas} lançada!`);
  } else {
    toast('✓ Lançado nas transações!');
  }
  saveAll(); renderAssinaturas(); renderBadge(); updSyncBnr();
  if (cfg.son && navigator.onLine) setTimeout(doSync, 600);
}

function migTab(t, btn) {
  ['sub','pag','cat'].forEach(x => {
    const el = document.getElementById('mig-t-'+x);
    if (el) el.style.display = x===t ? 'block' : 'none';
  });
  document.querySelectorAll('#imp-t-mig .tabs .tab').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
}

function onAsTipo() {
  const tipo = document.querySelector('input[name="as-tipo"]:checked')?.value || 'assinatura';
  const wrap = document.getElementById('as-n-wrap');
  if (wrap) wrap.style.display = tipo === 'parcelado' ? 'flex' : 'none';
  calcAssinPV();
}

function onImpTipo() {
  const tipo = document.querySelector('input[name="imp-tipo"]:checked')?.value || 'json';
  const json = document.getElementById('imp-info-json');
  const xlsx = document.getElementById('imp-info-xlsx');
  if (json) json.style.display = tipo === 'json' ? 'block' : 'none';
  if (xlsx) xlsx.style.display = tipo === 'xlsx' ? 'block' : 'none';
  const sub = document.getElementById('imp-zone-sub');
  if (sub) sub.textContent = tipo === 'json' ? 'importar_bak.json' : 'arquivo .xlsx ou .xls';
}

function onMigSubChange(subId, sel) {
  const detail = document.getElementById(`mig-sub-detail-${subId}`);
  if (!detail) return;
  const v = sel.value;
  detail.textContent = v==='cartao'?'Mapeará despesas para cartão existente':
                       v==='conta' ?'Mapeará despesas para conta existente':
                       v==='novo_cartao'?'Criará novo cartão com este nome':
                       v==='novo_acc'?'Criará nova conta com este nome':'Permanece como subcategoria';
  detail.style.color = v==='sub'?'var(--txt3)':'var(--eme)';
}

function openSplitParc(despId) {
  const d = desps.find(x=>x.id===despId);
  if (!d) return;
  openModal('Dividir em parcelas','',null);
  document.getElementById('m-btns').style.display='none';
  document.getElementById('m-extra').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:13px;color:var(--txt2)">Valor total: <strong>${fmt(d.valor)}</strong></div>
      <div class="edit-row"><label>Nº de parcelas</label>
        <input id="sp-n" type="number" min="2" max="60" value="2" style="width:80px" inputmode="numeric"
          oninput="previewSplit('${despId}',this.value)"/>
      </div>
      <div class="edit-row"><label>1ª parcela em</label>
        <input id="sp-dt" type="date" value="${d.data}" style="flex:1"/>
      </div>
      <div class="edit-row"><label>Intervalo</label>
        <select id="sp-freq">
          <option value="m">Mensal</option>
          <option value="q">Quinzenal</option>
          <option value="s">Semanal</option>
        </select>
      </div>
      <div id="sp-prev" class="split-prev"></div>
      <div style="display:flex;gap:7px;margin-top:4px">
        <button class="btn pr sm" style="flex:1" onclick="applySplit('${despId}')">✓ Dividir</button>
        <button class="btn sm" onclick="closeModal()">Cancelar</button>
      </div>
    </div>`;
  previewSplit(despId, 2);
}

function orcTab(t, btn) {
  orcTipoAtual = t;
  document.querySelectorAll('#orc-tabs .tab').forEach(b=>b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  renderOrc();
}

function parcTab(t, btn) {
  document.getElementById('pt-parc').style.display  = t === 'parc'  ? 'block' : 'none';
  document.getElementById('pt-assin').style.display = t === 'assin' ? 'block' : 'none';
  document.querySelectorAll('#parc-tabs .tab').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  if (t === 'assin') { populateAssinSelects(); renderAssinaturas(); }
}

function pfTab(t, btn) {
  ['pf-info','pf-seg','pf-tema','pf-dados'].forEach(id => {
    const el = document.getElementById(id); if(el) el.style.display = 'none';
  });
  const el = document.getElementById('pf-'+t); if(el) el.style.display = 'block';
  document.querySelectorAll('#p-perfil .tab').forEach(b => b.classList.remove('act'));
  if(btn) btn.classList.add('act');
  // Render cfg fields when showing seg/tema/dados
  if(t === 'seg' || t === 'tema' || t === 'dados') renderCfg();
}

function populateAssinSelects() {
  const ac = document.getElementById('as-cat');
  if (ac) ac.innerHTML = '<option value="">Nenhuma</option>' + cats.map(c => `<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');
  const aa = document.getElementById('as-acc');
  if (aa) aa.innerHTML = '<option value="">Nenhuma</option>' + accs.map(a => `<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
}

function populateDel2Sels() {
  const dc = document.getElementById('del2-cat');
  if (dc) dc.innerHTML = '<option value="">Todas cats</option>' + cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  const da = document.getElementById('del2-acc');
  if (da) da.innerHTML = '<option value="">Todas contas</option>' + accs.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('');
}

function previewDel2() {
  const d1   = document.getElementById('del2-d1')?.value  || '';
  const d2   = document.getElementById('del2-d2')?.value  || '';
  const fcat = document.getElementById('del2-cat')?.value || '';
  const facc = document.getElementById('del2-acc')?.value || '';
  const tudo = document.getElementById('del2-tudo')?.checked;
  const el   = document.getElementById('del2-preview');
  if (!el) return;

  if (tudo) { el.innerHTML='<span style="color:var(--rose)">⚠ Apagará TUDO — reset completo do app</span>'; return; }

  let list = desps;
  if (d1) list = list.filter(d=>d.data>=d1);
  if (d2) list = list.filter(d=>d.data<=d2);
  if (fcat) list = list.filter(d=>d.catId===fcat);
  if (facc) list = list.filter(d=>d.accId===facc);

  const total = list.reduce((s,d)=>s+d.valor,0);
  el.innerHTML = `<span style="color:var(--amb)">Serão apagados: <strong>${list.length}</strong> registros · R$ ${fmt(total)}</span>`;
}

function previewSplit(despId, n) {
  n = Math.max(2, parseInt(n)||2);
  const d = desps.find(x=>x.id===despId);
  if (!d) return;
  const parc = d.valor/n;
  const dt   = document.getElementById('sp-dt')?.value || d.data;
  const freq = document.getElementById('sp-freq')?.value || 'm';
  const el   = document.getElementById('sp-prev');
  if (!el) return;

  const rows = [];
  let cur = new Date(dt+'T12:00:00');
  for (let i=0;i<Math.min(n,12);i++) {
    rows.push(`<div class="split-row"><span>${i+1}/${n} · ${cur.toISOString().slice(0,10)}</span><span>${fmt(parc)}</span></div>`);
    if (freq==='m') { cur.setMonth(cur.getMonth()+1); }
    else if (freq==='q') { cur.setDate(cur.getDate()+15); }
    else { cur.setDate(cur.getDate()+7); }
  }
  if (n>12) rows.push(`<div style="text-align:center;color:var(--txt3);font-size:11px;padding:4px">+ ${n-12} mais...</div>`);
  el.innerHTML = rows.join('');
}

function proxData(rec) {
  const hoje = today();
  const periodo = rec.periodo || 'mensal';
  const p = PERIODOS[periodo];
  if (!p) return hoje;

  const inicio = rec.inicio || hoje;
  let d = new Date(inicio + 'T12:00:00');

  if (periodo === 'semanal' || periodo === 'quinzenal') {
    // Avança até passar de hoje
    while (d.toISOString().slice(0,10) <= hoje) {
      d.setDate(d.getDate() + p.dias);
    }
  } else {
    // Mensal / trimestral etc — usar o dia de cobrança
    const dia = rec.dia || d.getDate();
    d = new Date();
    d.setDate(dia);
    // Se já passou este mês, avança
    if (d.toISOString().slice(0,10) <= hoje) {
      const meses = p.dias >= 365 ? 12 : p.dias >= 180 ? 6 : p.dias >= 90 ? 3 : p.dias >= 60 ? 2 : 1;
      d.setMonth(d.getMonth() + meses);
    }
  }
  return d.toISOString().slice(0,10);
}

function renderAssinaturas() {
  const q = (document.getElementById('assin-q')?.value || '').toLowerCase();
  let list = recorrencias.filter(r => !q || r.nome.toLowerCase().includes(q));
  if (assinTipoFilt) list = list.filter(r => r.tipo === assinTipoFilt);

  // Summary cards
  const sumEl = document.getElementById('assin-summary');
  if (sumEl) {
    const ativas = recorrencias.filter(r => r.ativa);
    const totalMes = ativas.reduce((s, r) => {
      const p = PERIODOS[r.periodo || 'mensal'];
      return s + (r.valor * (p ? p.fator / 12 : 1));
    }, 0);
    const totalAnual = ativas.reduce((s, r) => {
      const p = PERIODOS[r.periodo || 'mensal'];
      return s + (r.valor * (p ? p.fator : 12));
    }, 0);
    sumEl.innerHTML = `
      <div class="mc r" style="flex:1"><div class="ml">Por mês</div><div class="mv r">${fmt(totalMes)}</div></div>
      <div class="mc b" style="flex:1"><div class="ml">Por ano</div><div class="mv b">${fmt(totalAnual)}</div></div>
      <div class="mc g" style="flex:1"><div class="ml">Ativas</div><div class="mv g">${ativas.length}</div></div>`;
  }

  const el = document.getElementById('list-assin');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty">Nenhuma recorrência cadastrada.<br>Toque em "+ Adicionar" para começar.</div>`;
    return;
  }

  el.innerHTML = list.map((r, gi) => {
    const cat = cats.find(c => c.id === r.catId);
    const acc = accs.find(a => a.id === r.accId);
    const p   = PERIODOS[r.periodo || 'mensal'];
    const prox = proxData(r);
    const diasProx = Math.ceil((new Date(prox+'T12:00:00') - new Date()) / 864e5);
    const enc  = r.fim && r.fim < today();
    const status = enc ? 'encerrada' : !r.ativa ? 'inativo' : diasProx <= 3 ? 'vencida' : 'ativa';
    const statusLabel = enc ? 'Encerrada' : !r.ativa ? 'Pausada' : diasProx <= 0 ? 'Vence hoje' : diasProx <= 3 ? `Vence em ${diasProx}d` : 'Ativa';
    const anual = r.valor * (p ? p.fator : 12);

    // Progresso para parcelados
    let progHTML = '';
    if (r.tipo === 'parcelado' && r.totalParcelas) {
      const pct = clamp(((r.parcelaAtual||1)-1) / r.totalParcelas * 100);
      progHTML = `<div class="assin-prog-bar">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--txt3);margin-bottom:4px">
          <span>Parcelas pagas: ${(r.parcelaAtual||1)-1}/${r.totalParcelas}</span>
          <span>${pct}%</span>
        </div>
        <div class="prog"><div class="pf" style="width:${pct}%;background:${cat?cat.cor:'var(--accent)'}"></div></div>
      </div>`;
    }

    return `<div class="assin-card" id="assin-card-${gi}">
      <div class="assin-hdr" onclick="toggleAssinCard(${gi})">
        <div class="assin-logo" style="background:${cat?cat.cor+'22':'var(--bg3)'}">
          ${cat ? cat.emoji||'📦' : r.tipo==='assinatura'?'📱':r.tipo==='recorrente'?'🔄':'💳'}
          <div class="assin-badge ${enc||!r.ativa?'inativo':r.tipo}">${r.tipo==='assinatura'?'★':r.tipo==='recorrente'?'↺':'#'}</div>
        </div>
        <div class="assin-info">
          <div class="assin-nome">${r.nome}</div>
          <div class="assin-meta">
            <span class="status-pill ${status}"><span class="status-dot"></span>${statusLabel}</span>
            <span class="assin-per-pill">${p ? p.label : r.periodo}</span>
            ${diasProx > 0 && r.ativa && !enc ? `<span style="font-size:10px;color:var(--txt3)">próx. ${fmtD(prox)}</span>` : ''}
          </div>
        </div>
        <div class="assin-right">
          <div class="assin-val">${fmt(r.tipo==='parcelado'?(r.valorParcela||r.valor):r.valor)}</div>
          <div class="assin-anual">${fmt(anual)}/ano</div>
        </div>
        <svg class="assin-chev" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      <div class="assin-detail">
        ${progHTML}
        <div class="assin-detail-row"><span class="lbl">Tipo</span><span class="val">${r.tipo==='assinatura'?'📱 Assinatura':r.tipo==='recorrente'?'🔄 Recorrente':'💳 Parcelado fixo'}</span></div>
        <div class="assin-detail-row"><span class="lbl">Periodicidade</span><span class="val">${p?p.label:r.periodo} · dia ${r.dia||'—'}</span></div>
        ${r.tipo==='parcelado'?`<div class="assin-detail-row"><span class="lbl">Valor por parcela</span><span class="val">${fmt(r.valorParcela||r.valor)}</span></div>`:''}
        <div class="assin-detail-row"><span class="lbl">Custo mensal</span><span class="val" style="color:var(--rose)">${fmt(r.valor*(p?p.fator/12:1))}</span></div>
        <div class="assin-detail-row"><span class="lbl">Custo anual</span><span class="val">${fmt(anual)}</span></div>
        ${cat?`<div class="assin-detail-row"><span class="lbl">Categoria</span><span class="val">${cat.emoji||''} ${cat.nome}</span></div>`:''}
        ${acc?`<div class="assin-detail-row"><span class="lbl">Conta</span><span class="val">${acc.emoji||'🏦'} ${acc.nome}</span></div>`:''}
        <div class="assin-detail-row"><span class="lbl">Início</span><span class="val">${fmtD(r.inicio||'')}</span></div>
        ${r.fim?`<div class="assin-detail-row"><span class="lbl">Término</span><span class="val">${fmtD(r.fim)}</span></div>`:''}
        ${r.obs?`<div class="assin-detail-row"><span class="lbl">Obs.</span><span class="val">${r.obs}</span></div>`:''}
        <div class="assin-actions">
          <button class="btn sm pr" onclick="lancarAssin('${r.id}')" ${!r.ativa||enc?'disabled style="opacity:.4;pointer-events:none"':''}>
            ✓ Lançar agora
          </button>
          <button class="btn sm" onclick="toggleAssinAtiva('${r.id}')">
            ${r.ativa&&!enc ? '⏸ Pausar' : '▶ Reativar'}
          </button>
          <button class="btn sm" onclick="editAssin('${r.id}')">✏️ Editar</button>
          <button class="btn sm dn" onclick="delAssin('${r.id}')">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderCalPlus() {
  _initCalFltSels();
  renderCal(); // função original

  const fAcc = document.getElementById('cal-acc-flt')?.value || '';
  const fCat = document.getElementById('cal-cat-flt')?.value || '';
  const y  = calDate ? calDate.getFullYear() : new Date().getFullYear();
  const mo = calDate ? calDate.getMonth()+1  : new Date().getMonth()+1;
  const mesK = `${y}-${String(mo).padStart(2,'0')}`;

  let listMes = desps.filter(d=>d.data.startsWith(mesK));
  if (fAcc) listMes = listMes.filter(d=>d.accId===fAcc);
  if (fCat) listMes = listMes.filter(d=>d.catId===fCat);

  const totEl = document.getElementById('cal-month-total');
  if (totEl) totEl.textContent = listMes.length ? fmt(listMes.reduce((s,d)=>s+d.valor,0)) : '';

  // Mini-total em cada célula do dia
  document.querySelectorAll('.cal-day').forEach(cell => {
    const dt = cell.dataset.date; if (!dt) return;
    let dayL = desps.filter(x=>x.data===dt);
    if (fAcc) dayL = dayL.filter(x=>x.accId===fAcc);
    if (fCat) dayL = dayL.filter(x=>x.catId===fCat);
    if (!dayL.length) return;
    if (cell.querySelector('.cal-day-val')) return;
    const tot = dayL.reduce((s,x)=>s+x.valor,0);
    const span = document.createElement('div');
    span.className = 'cal-day-val';
    span.style.cssText = 'font-size:8px;color:var(--rose);font-weight:700;line-height:1;margin-top:1px';
    span.textContent = tot>=1000?(tot/1000).toFixed(1)+'k':tot.toFixed(0);
    cell.appendChild(span);
  });
}

function renderDGPlus() {
  const mes  = document.getElementById('dg-mes')?.value||curMes;
  const fq   = (document.getElementById('dg-q')?.value||'').toLowerCase();
  const fcat = document.getElementById('dg-cat')?.value||'';
  const facc = document.getElementById('dg-acc-flt')?.value||'';
  let rows   = desps.filter(d=>mesKey(d.data)===mes);
  if(fcat)  rows=rows.filter(d=>d.catId===fcat);
  if(facc)  rows=rows.filter(d=>d.accId===facc);
  if(fq)    rows=rows.filter(d=>(d.desc+' '+(d.obs||'')).toLowerCase().includes(fq));
  rows.sort((a,b)=>b.data.localeCompare(a.data));
  const lbl=document.getElementById('dg-lbl'); if(lbl)lbl.textContent=`${rows.length} registros`;
  const tot=document.getElementById('dg-tot'); if(tot)tot.textContent=fmt(rows.reduce((s,d)=>s+d.valor,0));
  const ac=document.getElementById('dg-acc-flt');
  if(ac&&ac.options.length<=1) ac.innerHTML='<option value="">Todas contas</option>'+accs.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('');
  const dc=document.getElementById('dg-cat');
  if(dc&&dc.options.length<=1) dc.innerHTML='<option value="">Todas cats</option>'+cats.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  const head=document.getElementById('dg-head'), body=document.getElementById('dg-body');
  if(!head||!body) return;
  const visCols=DG_ALL_COLS.filter(c=>dgCols.includes(c.id));
  head.innerHTML=visCols.map(c=>`<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;color:var(--txt3);border-bottom:0.5px solid var(--bdr);white-space:nowrap">${c.label}</th>`).join('');
  body.innerHTML=rows.map(d=>{
    const cat=cats.find(c=>c.id===d.catId),sub=subs.find(s=>s.id===d.subId),
          pag=pags.find(p=>p.id===d.pagId),cart=carts.find(c=>c.id===d.cartId),
          acc=accs.find(a=>a.id===d.accId);
    const cells={
      data:   `<td style="padding:7px 10px;white-space:nowrap;border-bottom:0.5px solid var(--bdr);font-size:12px">${fmtD(d.data)}</td>`,
      desc:   `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.desc}${d.totalParcelas?` <span style="font-size:10px;color:var(--txt3)">${d.parcela}/${d.totalParcelas}</span>`:''}</td>`,
      valor:  `<td style="padding:7px 10px;white-space:nowrap;border-bottom:0.5px solid var(--bdr);font-weight:700;color:var(--rose);font-size:12px">${fmt(d.valor)}</td>`,
      cat:    `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:12px">${cat?`<span style="background:${cat.cor}22;color:${cat.cor};padding:2px 6px;border-radius:8px;font-size:11px;font-weight:600">${cat.emoji||''} ${cat.nome}</span>`:''}</td>`,
      sub:    `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:11px;color:var(--txt2)">${sub?.nome||''}</td>`,
      pag:    `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:11px;color:var(--txt2)">${pag?.nome||''}</td>`,
      cart:   `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:11px;color:var(--txt2)">${cart?.nome||''}</td>`,
      acc:    `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:11px;color:var(--txt2)">${acc?.nome||''}</td>`,
      parcela:`<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:11px;text-align:center">${d.totalParcelas?`${d.parcela}/${d.totalParcelas}`:''}</td>`,
      obs:    `<td style="padding:7px 10px;border-bottom:0.5px solid var(--bdr);font-size:11px;color:var(--txt3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.obs||''}</td>`,
      acao:   `<td style="padding:7px 6px;border-bottom:0.5px solid var(--bdr);text-align:center;white-space:nowrap">
        <span style="cursor:pointer;color:var(--accent2);font-size:12px;padding:0 5px" onclick="editDesp('${d.id}')" title="Editar">✏️</span>
        <span style="cursor:pointer;color:var(--rose);font-size:12px;padding:0 5px;opacity:.7" onclick="delDespById('${d.id}')" title="Apagar">✕</span>
      </td>`,
    };
    return `<tr style="transition:background .1s" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">${visCols.map(c=>cells[c.id]||'<td></td>').join('')}</tr>`;
  }).join('')||`<tr><td colspan="${visCols.length}" style="padding:24px;text-align:center;color:var(--txt3)">Nenhum registro neste mês</td></tr>`;
}

function renderMetaAccs() {
  const el = document.getElementById('meta-acc-list');
  if (!el) return;
  if (!cfg.metaAccs) cfg.metaAccs = [];

  if (!accs.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--txt3);padding:8px 0">Nenhuma conta cadastrada. Crie em Contas primeiro.</div>';
    return;
  }

  el.innerHTML = accs.map(a => {
    const checked = cfg.metaAccs.includes(a.id);
    const gasto = desps.filter(d => mesKey(d.data)===curMes && d.accId===a.id).reduce((s,d)=>s+d.valor,0);
    return `<div class="meta-acc-item">
      <input type="checkbox" class="meta-acc-check" id="mac-${a.id}"
        ${checked ? 'checked' : ''}
        onchange="toggleMetaAcc('${a.id}',this.checked)"/>
      <label for="mac-${a.id}" style="flex:1;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
        <span class="meta-acc-label">${a.emoji||'🏦'} ${a.nome}</span>
        <span style="font-size:11px;color:var(--rose);font-weight:600">${gasto>0?fmt(gasto):''}</span>
      </label>
    </div>`;
  }).join('');
  updateMetaBar();
}

function renderMigCats() {
  const el = document.getElementById('mig-cat-list');
  if (!el) return;
  const ACC_KW = ['neto','mariana','outras'];
  el.innerHTML = cats.map(c => {
    const isAcc = ACC_KW.some(k=>c.nome.toLowerCase().includes(k));
    const n = desps.filter(d=>d.catId===c.id).length;
    return `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:0.5px solid var(--bdr)">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700">${c.emoji||'📦'} ${c.nome}</div>
        <div style="font-size:11px;color:var(--txt3)">${n} despesas</div>
      </div>
      <select id="mig-cat-sel-${c.id}" style="font-size:12px">
        <option value="cat">Manter como categoria</option>
        <option value="acc" ${isAcc?'selected':''}>→ Converter para conta</option>
      </select>
    </div>`;
  }).join('') || '<div class="empty">Nenhuma categoria.</div>';
}

function renderMigPags() {
  const el = document.getElementById('mig-pag-list');
  if (!el) return;
  const accsUniq = [...new Set(desps.map(d=>d.accId).filter(Boolean))];
  el.innerHTML = accsUniq.map(accId => {
    const acc = accs.find(a=>a.id===accId);
    if (!acc) return '';
    const n = desps.filter(d=>d.accId===accId).length;
    return `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:0.5px solid var(--bdr)">
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${acc.nome}</div><div style="font-size:11px;color:var(--txt3)">${n} despesas</div></div>
      <select id="mig-pag-${accId}" style="font-size:12px">
        <option value="px">Pix</option>
        <option value="db">Débito</option>
        <option value="cr">Crédito</option>
        <option value="dn">Dinheiro</option>
      </select>
    </div>`;
  }).join('') || '<div class="empty">Importe dados primeiro.</div>';
}

function renderMigSubs() {
  const el = document.getElementById('mig-sub-list');
  if (!el) return;
  if (!subs.length) { el.innerHTML='<div class="empty">Nenhuma subcategoria cadastrada.</div>'; return; }

  const CARD_KW = ['neo','bmg','nubank','nunbank','mcard','picpay','amazon','sx','next','mercado'];
  const ACC_KW  = ['neto','mariana','outras','naja','meu'];

  el.innerHTML = subs.map(s => {
    const nome = s.nome.toLowerCase();
    const sugg = CARD_KW.some(k=>nome.includes(k)) ? 'cartao' : ACC_KW.some(k=>nome.includes(k)) ? 'conta' : 'sub';
    const cartOpts = carts.map(c=>`<option value="cart_${c.id}">${c.nome}</option>`).join('');
    const accOpts  = accs.map(a=>`<option value="acc_${a.id}">${a.nome}</option>`).join('');
    const catObj   = cats.find(c=>c.id===s.pai);
    const n = desps.filter(d=>d.subId===s.id).length;
    return `<div style="padding:10px 0;border-bottom:0.5px solid var(--bdr)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">${s.nome}</div>
          <div style="font-size:11px;color:var(--txt3)">${catObj?catObj.nome:''} · ${n} despesas</div>
        </div>
        <select id="mig-sub-sel-${s.id}" style="font-size:12px;flex:1;max-width:160px" onchange="onMigSubChange('${s.id}',this)">
          <option value="sub">Manter como subcategoria</option>
          <option value="cartao" ${sugg==='cartao'?'selected':''}>→ Cartão</option>
          <option value="conta"  ${sugg==='conta' ?'selected':''}>→ Conta</option>
          <option value="novo_cartao">→ Novo cartão</option>
          <option value="novo_acc">→ Nova conta</option>
        </select>
      </div>
      <div id="mig-sub-detail-${s.id}" style="font-size:11px;color:var(--eme);padding-left:4px">
        ${sugg==='cartao'?'Será mapeada para cartão existente ou criará novo':sugg==='conta'?'Será mapeada para conta existente ou criará nova':''}
      </div>
    </div>`;
  }).join('');
}

function renderMigration() {
  renderMigSubs();
  renderMigPags();
  renderMigCats();
}

function renderOrcPlus() {
  const q   = (document.getElementById('orc-q')?.value||'').toLowerCase();
  const el  = document.getElementById('list-orc');
  const sum = document.getElementById('orc-summary');
  if (!el) return;
  const mes = curMes;
  const gasto = {};
  desps.filter(d=>mesKey(d.data)===mes).forEach(d=>{
    const k = orcTipo==='cat'?d.catId:orcTipo==='acc'?d.accId:d.cartId;
    if(k) gasto[k]=(gasto[k]||0)+d.valor;
  });
  let items = (orcTipo==='cat'?cats:orcTipo==='acc'?accs:carts).filter(i=>i.nome.toLowerCase().includes(q));
  let tOrc=0, tGasto=0;
  el.innerHTML = items.map(item=>{
    const g=gasto[item.id]||0;
    const orcKey=`${orcTipo}_${item.id}`;
    const ov=orcs[orcKey]||0; tOrc+=ov; tGasto+=g;
    const pct=ov>0?clamp(g/ov*100):0, over=ov>0&&g>ov;
    const col=over?'var(--rose)':pct>80?'var(--amb)':'var(--eme)';
    return `<div class="card" style="padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${ov?'8px':'4px'}">
        <div style="width:36px;height:36px;border-radius:12px;background:${item.cor||'#6366f1'}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${item.emoji||'📦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700">${item.nome}</div>
          <div style="font-size:11px;color:var(--txt3)">Gasto: <strong style="color:var(--rose)">${fmt(g)}</strong>${ov?' · meta: '+fmt(ov):''}</div>
        </div>
        ${over?'<span style="font-size:10px;background:rgba(244,63,94,.15);color:var(--rose);padding:2px 7px;border-radius:8px;font-weight:700">PASSOU</span>':''}
      </div>
      ${ov?`<div class="prog" style="margin-bottom:8px"><div class="pf" style="width:${pct}%;background:${col}"></div></div>`:''}
      <div style="display:flex;gap:6px">
        <input type="number" id="orc-inp-${item.id}" value="${ov||''}" placeholder="Meta R$"
          style="flex:1;font-size:12px;padding:6px 9px;background:var(--bg3);border:0.5px solid var(--bdr);border-radius:var(--rs);color:var(--txt)" min="0" inputmode="decimal"/>
        <button class="btn pr xs" onclick="saveOrcItem('${orcKey}','${item.id}')">OK</button>
        ${ov?`<button class="btn xs dn" onclick="clearOrcItem('${orcKey}')">✕</button>`:''}
      </div>
    </div>`;
  }).join('')||'<div class="empty">Nenhum item.</div>';
  if(sum) sum.innerHTML=tOrc>0?`
    <div class="mc r" style="flex:1"><div class="ml">Gasto</div><div class="mv r">${fmt(tGasto)}</div></div>
    <div class="mc b" style="flex:1"><div class="ml">Meta</div><div class="mv b">${fmt(tOrc)}</div></div>
    <div class="mc ${tGasto>tOrc?'r':'g'}" style="flex:1"><div class="ml">Uso</div><div class="mv ${tGasto>tOrc?'r':'g'}">${tOrc>0?clamp(tGasto/tOrc*100):0}%</div></div>`:'';
}

function saveAssinEdit(id) {
  const idx = recorrencias.findIndex(x => x.id === id);
  if (idx < 0) return;
  const r = recorrencias[idx];
  r.nome   = document.getElementById('ea2-n')?.value.trim() || r.nome;
  r.valor  = parseMoeda(document.getElementById('ea2-v')?.value||'') || r.valor;
  r.periodo= document.getElementById('ea2-p')?.value || r.periodo;
  r.dia    = parseInt(document.getElementById('ea2-d')?.value) || r.dia;
  r.catId  = document.getElementById('ea2-c')?.value;
  r.accId  = document.getElementById('ea2-a')?.value;
  r.inicio = document.getElementById('ea2-i')?.value;
  r.fim    = document.getElementById('ea2-f')?.value;
  r.obs    = document.getElementById('ea2-o')?.value.trim();
  saveAll(); closeModal(); renderAssinaturas(); toast('Atualizado!');
}

function saveDriveCfg() {
  cfg.driveFolder = (document.getElementById('drive-folder')?.value||'').trim() || '';
  cfg.driveFreq   = document.querySelector('input[name="drive-freq"]:checked')?.value || 'weekly';
  saveAll();
  updateDriveStatus();
}

function saveOrcItem(orcKey, itemId) {
  const inp = document.getElementById(`orc-inp-${itemId}`);
  const v   = parseMoeda(inp?.value||'');
  if (!isNaN(v) && v>0) { orcs[orcKey]=v; } else { delete orcs[orcKey]; }
  saveAll(); renderOrc();
  toast('Meta salva!');
}

function setAssinTipoFilt(tipo, el) {
  assinTipoFilt = tipo;
  document.querySelectorAll('#assin-tipo-chips .chip').forEach(c => c.classList.remove('act'));
  if (el) el.classList.add('act');
  renderAssinaturas();
}

async function shareRelatorio() {
  const list = (() => {
    const mes = (document.getElementById('rel-mes')||{}).value || curMes;
    const fcat = (document.getElementById('rel-cat')||{}).value || '';
    let l = desps.filter(d => mesKey(d.data) === mes);
    if(fcat) l = l.filter(d => d.catId === fcat);
    return l;
  })();

  if(!list.length) { toast('Sem dados para gerar relatório.'); return; }
  toast('Gerando relatório...');

  const mes = (document.getElementById('rel-mes')||{}).value || curMes;
  const[y,mo] = mes.split('-');
  const mesLabel = new Date(y,+mo-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  const tot = list.reduce((s,d)=>s+d.valor,0);

  // Gerar imagem canvas
  const W = 800, ROW = 58, HEADER = 140, FOOTER = 60;
  const rows = list.slice(0, 25);
  const H = HEADER + rows.length * ROW + FOOTER;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // BG
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, W, H);

  // Header gradient
  const grad = ctx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,'#6366f1'); grad.addColorStop(1,'#8b5cf6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER);

  // Header text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px -apple-system,sans-serif';
  ctx.fillText('💰 Relatório Financeiro', 28, 46);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = '500 14px -apple-system,sans-serif';
  ctx.fillText(mesLabel, 28, 72);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px -apple-system,sans-serif';
  ctx.fillText(fmt(tot), 28, 116);
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.font = '500 13px -apple-system,sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${list.length} transações`, W-28, 116);
  ctx.textAlign = 'left';

  // Cat breakdown em pills no header
  const bc={};
  list.forEach(d=>{if(d.catId)bc[d.catId]=(bc[d.catId]||0)+d.valor;});
  const topCats=Object.entries(bc).sort((a,b)=>b[1]-a[1]).slice(0,4);
  let px=28;
  topCats.forEach(([id,v])=>{
    const c=cats.find(x=>x.id===id);
    if(!c) return;
    const label=`${c.emoji||''} ${c.nome}`;
    const w=ctx.measureText(label).width+20;
    ctx.fillStyle='rgba(0,0,0,.3)';
    ctx.beginPath();ctx.roundRect(px,HEADER-30,w+8,20,8);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.font='11px -apple-system,sans-serif';
    ctx.fillText(label,px+4,HEADER-17);
    px+=w+14;
  });

  // Rows
  rows.forEach((d,i)=>{
    const cat=cats.find(c=>c.id===d.catId);
    const ry=HEADER+i*ROW;
    ctx.fillStyle=i%2===0?'#1f2937':'#111827';
    ctx.fillRect(0,ry,W,ROW);
    // circle
    ctx.beginPath();ctx.arc(46,ry+ROW/2,18,0,Math.PI*2);
    ctx.fillStyle=cat?cat.cor:'#6366f1';ctx.fill();
    ctx.fillStyle='#fff';ctx.font='15px serif';ctx.textAlign='center';
    ctx.fillText(cat?cat.emoji||'📦':'📦',46,ry+ROW/2+5);
    ctx.textAlign='left';
    // desc
    ctx.fillStyle='#f9fafb';ctx.font='bold 14px -apple-system,sans-serif';
    const desc=d.desc.length>36?d.desc.slice(0,36)+'…':d.desc;
    ctx.fillText(desc,74,ry+ROW/2-3);
    ctx.fillStyle='#9ca3af';ctx.font='11px -apple-system,sans-serif';
    const sub=[fmtD(d.data),cat?cat.nome:''].filter(Boolean).join(' · ');
    ctx.fillText(sub,74,ry+ROW/2+13);
    // amount
    ctx.fillStyle='#f43f5e';ctx.font='bold 15px -apple-system,sans-serif';
    ctx.textAlign='right';ctx.fillText(fmt(d.valor),W-24,ry+ROW/2+5);ctx.textAlign='left';
    // sep
    ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(74,ry+ROW-1);ctx.lineTo(W-24,ry+ROW-1);ctx.stroke();
  });

  if(list.length>25){
    const ry=HEADER+25*ROW;
    ctx.fillStyle='#1f2937';ctx.fillRect(0,ry,W,FOOTER/2);
    ctx.fillStyle='#6b7280';ctx.font='500 12px -apple-system,sans-serif';ctx.textAlign='center';
    ctx.fillText(`+ ${list.length-25} mais transações`,W/2,ry+FOOTER/4+8);ctx.textAlign='left';
  }

  // Footer
  const fy=H-FOOTER;
  ctx.fillStyle='#1f2937';ctx.fillRect(0,fy,W,FOOTER);
  ctx.fillStyle='#6b7280';ctx.font='500 11px -apple-system,sans-serif';
  ctx.fillText('Finanças Pessoais v7.3 · '+new Date().toLocaleDateString('pt-BR'),24,fy+FOOTER/2+5);
  ctx.fillStyle='#6366f1';ctx.textAlign='right';
  ctx.fillText(cfg.nome||'',W-24,fy+FOOTER/2+5);ctx.textAlign='left';

  canvas.toBlob(async blob=>{
    const file=new File([blob],'relatorio_'+mes+'.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file],title:'Relatório Financeiro',text:fmt(tot)+' · '+mesLabel});return;}catch(e){if(e.name==='AbortError')return;}
    }
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='relatorio_'+mes+'.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),3000);
    toast('Relatório salvo! Compartilhe pelo gerenciador.');
  },'image/png');
}

function togAssinForm() {
  const body = document.getElementById('assin-form-body');
  if (!body) return;
  const open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  document.querySelector('#assin-form-card .btn.xs').textContent = open ? '+ Adicionar' : '✕ Fechar';
  if (!open) {
    populateAssinSelects();
    const ini = document.getElementById('as-inicio');
    if (ini && !ini.value) ini.value = today();
  }
}

function togNotas() {
  const tog  = document.getElementById('notas-tog');
  const area = document.getElementById('l-obs');
  if (!tog||!area) return;
  const open = area.classList.toggle('open');
  tog.classList.toggle('open', open);
}

function togSetupDetail() {
  const el = document.getElementById('setup-detail');
  const btn = document.getElementById('setup-tog');
  if(!el) return;
  const open = el.style.display === 'block';
  el.style.display = open ? 'none' : 'block';
  if(btn) btn.textContent = open ? 'Configurar' : 'Fechar';
  // Se URL já configurada, mostrar como conectado
  if(!open && cfg.shUrl) {
    const u = document.getElementById('sh-url'); if(u) u.value = cfg.shUrl;
    const su = document.getElementById('sh-sheet-url'); if(su) su.value = cfg.sheetUrl||'';
    const st = document.getElementById('sh-url-status');
    if(st) st.innerHTML = `<span style="color:var(--eme)">✓ URL configurada</span>`;
  }
}

function toggleAssinAtiva(id) {
  const r = recorrencias.find(x => x.id === id);
  if (!r) return;
  r.ativa = !r.ativa;
  saveAll(); renderAssinaturas();
  toast(r.ativa ? '✓ Reativada' : 'Pausada');
}

function toggleAssinCard(i) {
  document.getElementById('assin-card-' + i)?.classList.toggle('expanded');
}

function toggleMetaAcc(id, checked) {
  if (!cfg.metaAccs) cfg.metaAccs = [];
  if (checked) { if (!cfg.metaAccs.includes(id)) cfg.metaAccs.push(id); }
  else cfg.metaAccs = cfg.metaAccs.filter(x => x !== id);
  gs('cfg', cfg); saveAll();
  updateMetaBar(); // não reconstruir innerHTML — checkbox mantém estado visual
}

function updateDriveStatus() {
  const dot  = document.getElementById('drive-dot');
  const text = document.getElementById('drive-status-text');
  if (!dot||!text) return;
  const last = cfg.lastDriveBackup;
  if (last) {
    const d = new Date(last);
    const label = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    dot.style.background = 'var(--eme)';
    text.textContent = 'Último backup: ' + label;
  } else {
    dot.style.background = 'var(--txt3)';
    text.textContent = 'Nunca realizado';
  }
  // Sincronizar radio
  const freq = cfg.driveFreq || 'weekly';
  const radio = document.querySelector(`input[name="drive-freq"][value="${freq}"]`);
  if (radio) radio.checked = true;
  const folder = document.getElementById('drive-folder');
  if (folder) folder.value = cfg.driveFolder || '';
}

function updateMetaBar() {
  const bar = document.getElementById('meta-total-bar');
  if (!bar) return;
  if (!cfg.metaAccs) cfg.metaAccs = [];
  const sel = cfg.metaAccs;
  if (!sel.length || !cfg.meta) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  // Calcular gasto do mês nas contas selecionadas
  const gasto = desps.filter(d => mesKey(d.data) === curMes && sel.includes(d.accId))
                      .reduce((s,d) => s+d.valor, 0);
  const meta  = cfg.meta || 1;
  const pct   = clamp(gasto/meta*100);
  const col   = pct>=100?'var(--rose)':pct>=80?'var(--amb)':'var(--eme)';
  const valEl = document.getElementById('meta-total-val');
  const pgEl  = document.getElementById('meta-prog-bar');
  const txtEl = document.getElementById('meta-prog-text');
  if (valEl) { valEl.textContent = fmt(gasto); valEl.className = 'meta-total-val '+(pct>=100?'over':pct>=80?'warn':'ok'); }
  if (pgEl)  { pgEl.style.width = pct+'%'; pgEl.style.background = col; }
  if (txtEl) txtEl.textContent = `${pct}% da meta de ${fmt(meta)} · falta ${fmt(Math.max(0,meta-gasto))}`;
}

function updateSyncHero() {
  const dot = document.getElementById('sync-dot-big');
  const status = document.getElementById('sync-hero-status');
  const sub = document.getElementById('sync-hero-sub');
  if(!dot) return;
  const on = navigator.onLine;
  const cnt = pend.length;
  if(on && cnt === 0) {
    dot.className = 'sync-dot-big on';
    if(status) status.textContent = 'Tudo sincronizado';
    if(sub) sub.textContent = cfg.shUrl ? 'Conectado à planilha' : 'Configure a URL para ativar o sync';
  } else if(on && cnt > 0) {
    dot.className = 'sync-dot-big sync';
    if(status) status.textContent = `${cnt} pendente(s)`;
    if(sub) sub.textContent = 'Toque em Enviar para sincronizar';
  } else {
    dot.className = 'sync-dot-big off';
    if(status) status.textContent = 'Sem internet';
    if(sub) sub.textContent = cnt > 0 ? `${cnt} pendente(s) aguardando conexão` : 'Offline';
  }

  showFirstRunBanner();
}

// ── BOOT ──────────────────────────────────────────────────────
function _bootApp() {
  applyTheme(); applySB(); renderAll();
  updateSyncHero(); renderCfg();
  setTimeout(autoLoadOnOpen, 600);
  setTimeout(checkAutoBackup, 5000);
}

window.addEventListener('DOMContentLoaded', () => {
  applyTheme(); renderLockProfile();
  const hasPIN = cfg.pin && cfg.pin.length === 4;
  if (hasPIN && cfg.lock) {
    document.getElementById('lock').style.display  = '';
    document.getElementById('shell').style.display = 'none';
  } else {
    document.getElementById('lock').style.display  = 'none';
    document.getElementById('shell').style.display = '';
    _bootApp();
  }
  window.addEventListener('online',  updateSyncHero);
  window.addEventListener('offline', updateSyncHero);
});

// ══════════════════════════════════════════════════════════════
//  v7.5.1 — FIXES: boot, sync dispositivo novo, primeiro acesso
// ══════════════════════════════════════════════════════════════

// ── PRIMEIRO ACESSO — banner com campo de URL ─────────────────
function showFirstRunBanner() {
  const banner = document.getElementById('first-run-banner');
  if (!banner) return;
  banner.style.display = 'block';
  // Pré-preencher se tiver algo parcial salvo
  const inp = document.getElementById('first-run-url');
  if (inp && cfg.shUrl) { inp.value = cfg.shUrl; banner.style.display = 'none'; }
}

async function firstRunLoad() {
  const url = (document.getElementById('first-run-url')?.value || '').trim();
  const st  = document.getElementById('first-run-status');
  if (!url || !url.includes('script.google.com')) {
    if (st) st.innerHTML = '<span style="color:var(--rose)">✗ URL inválida — cole a URL completa do Apps Script</span>';
    return;
  }
  if (!navigator.onLine) {
    if (st) st.innerHTML = '<span style="color:var(--rose)">✗ Sem internet</span>';
    return;
  }
  if (st) st.innerHTML = '<span style="color:var(--amb)">⏳ Conectando...</span>';

  // Testar URL antes de carregar
  try {
    const res  = await fetch(url + '?action=ping');
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Script não respondeu');
  } catch(e) {
    // Tentar no-cors — se não abortar, URL existe
    try {
      await fetch(url + '?action=ping', {mode:'no-cors'});
    } catch {
      if (st) st.innerHTML = '<span style="color:var(--rose)">✗ URL não alcançada. Verifique a implantação.</span>';
      return;
    }
  }

  // Salvar URL e carregar tudo
  cfg.shUrl = url;
  const u = document.getElementById('sh-url'); if (u) u.value = url;
  saveAll();
  if (st) st.innerHTML = '<span style="color:var(--amb)">⏳ Carregando configurações e despesas...</span>';
  updateSyncHero();

  await loadAllFromCloud(url, false);

  const banner = document.getElementById('first-run-banner');
  if (banner) banner.style.display = 'none';
  if (st) st.innerHTML = '<span style="color:var(--eme)">✓ Carregado com sucesso!</span>';
  initMesSel(); renderAll(); updateSyncHero();
  toast('✓ App sincronizado com a nuvem!');
}

// ── FIX updateSyncHero — mostrar banner quando sem URL ───────

// ── FIX showFirstRunBanner override ──────────────────────────
// (a função original apenas mostrava mensagem no cfg-sync-status)
// agora delega para o banner real
const _showFirstRunBannerOrig = showFirstRunBanner;
showFirstRunBanner = function() {
  const banner = document.getElementById('first-run-banner');
  if (banner && !cfg.shUrl) banner.style.display = 'block';
};

// ── Ao abrir Planilha/Sync, sempre atualizar hero e banner ───
// (já feito no PAGE_INIT do nav, mas garantir aqui também)
const _manSyncFixed = manSync;
manSync = async function() {
  if (!cfg.shUrl) {
    nav('planilha', null);
    toast('Cole a URL do Apps Script no campo acima e toque em "⬇ Carregar tudo"');
    return;
  }
  await doSync();
};


// ══════════════════════════════════════════════════════════════
//  v7.8 — CONFIG UNIFICADO + DADOS + FILTROS MULTI-SELECT
// ══════════════════════════════════════════════════════════════

// ── TÍTULOS NOVOS ─────────────────────────────────────────────
TITLES['config'] = 'Configurações';
TITLES['dados']  = 'Sync & Importação';

// ── ABAS: CONFIG ──────────────────────────────────────────────
function cfgTab(t, btn) {
  ['contas','cartoes','pags','cats'].forEach(x => {
    const el = document.getElementById('cfg-t-'+x);
    if (el) el.style.display = x===t ? 'block' : 'none';
  });
  document.querySelectorAll('#cfg-tabs .tab').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  else {
    const tabs = document.querySelectorAll('#cfg-tabs .tab');
    const order = ['contas','cartoes','pags','cats'];
    const idx = order.indexOf(t);
    if (tabs[idx]) tabs[idx].classList.add('act');
  }
  if (t==='contas')  renderCfgContas();
  if (t==='cartoes') { _populateCartAccSel(); renderCfgCartoes(); }
  if (t==='pags')    renderCfgPags();
  if (t==='cats')    { renderCfgCats(); catTab('cat', null); }
}


function renderCfgContas() {
  const el = document.getElementById('acc-list');
  if (!el) return;
  if (!accs.length) { el.innerHTML = '<div class="empty">Nenhuma conta. Toque em + Nova.</div>'; return; }
  el.innerHTML = accs.map((a,i) => {
    const gasto = desps.filter(d=>d.accId===a.id&&mesKey(d.data)===curMes).reduce((s,d)=>s+d.valor,0);
    const cartsVinc = carts.filter(c=>c.accId===a.id);
    const ativo = a.ativa !== false;
    return `<div class="cfg-item ${ativo?'':'cfg-item-off'}">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;border-radius:12px;background:${a.cor||'#6366f1'}22;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${a.emoji||'🏦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${a.nome}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${a.tipo||'carteira'} · gasto ${fmt(gasto)}${cartsVinc.length?` · ${cartsVinc.length} cartão(ões)`:''}</div>
        </div>
        <label class="tgl" style="flex-shrink:0"><input type="checkbox" ${ativo?'checked':''} onchange="toggleAccAtiva('${a.id}',this.checked)"/><span class="ts"></span></label>
      </div>
      <div class="cfg-item-actions">
        <button class="btn xs" onclick="editAcc(${i})">✏ Editar</button>
        <button class="btn xs dn" onclick="delAcc(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function renderCfgCartoes() {
  const el = document.getElementById('cart-list');
  if (!el) return;
  if (!carts.length) { el.innerHTML = '<div class="empty">Nenhum cartão. Toque em + Novo.</div>'; return; }
  el.innerHTML = carts.map((c,i) => {
    const acc = accs.find(a=>a.id===c.accId);
    const ativo = c.ativa !== false;
    return `<div class="cfg-item ${ativo?'':'cfg-item-off'}">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;border-radius:12px;background:${c.cor||'#6366f1'}22;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${c.emoji||'💳'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${c.nome}</div>
          <div style="font-size:11px;color:var(--txt3);margin-top:2px">${c.band||c.bandeira||''}${acc?' · '+acc.nome:' · ⚠ sem conta vinculada'}</div>
        </div>
        <label class="tgl" style="flex-shrink:0"><input type="checkbox" ${ativo?'checked':''} onchange="toggleCartAtiva('${c.id}',this.checked)"/><span class="ts"></span></label>
      </div>
      <div class="cfg-item-actions">
        <button class="btn xs" onclick="editCart(${i})">✏ Editar</button>
        <button class="btn xs dn" onclick="delCart(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function renderCfgPags() {
  const el = document.getElementById('pag-list');
  if (!el) return;
  const TIPO_LABEL = {credit:'Crédito',debit:'Débito',pix:'Pix',dinheiro:'Dinheiro',outro:'Outro'};
  const TIPO_COR   = {credit:'var(--ind)',debit:'var(--teal)',pix:'var(--eme)',dinheiro:'var(--amb)',outro:'var(--txt3)'};
  el.innerHTML = pags.map((p,i) => `
    <div class="cfg-item">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:10px;background:${TIPO_COR[p.tipo]||'var(--bg3)'}22;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">
          ${p.tipo==='credit'?'💳':p.tipo==='debit'?'🏦':p.tipo==='pix'?'📲':p.tipo==='dinheiro'?'💵':'💰'}
        </div>
        <div style="flex:1"><div style="font-size:14px;font-weight:700">${p.nome}</div>
          <div style="font-size:11px;color:var(--txt3)">${TIPO_LABEL[p.tipo]||p.tipo}</div></div>
        <button class="btn xs dn" onclick="delPag(${i})">✕</button>
      </div>
    </div>`).join('');
}

function renderCfgCats() {
  const catEl = document.getElementById('cat-list');
  const subEl = document.getElementById('sub-list');
  if (catEl) catEl.innerHTML = cats.length ? cats.map((c,i) => {
    const mySubs = subs.filter(s=>s.pai===c.id);
    return `<div class="cfg-item">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:10px;background:${c.cor}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${c.emoji||'📦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${c.nome}</div>
          <div style="font-size:11px;color:var(--txt3)">${mySubs.length} subcategoria(s)${mySubs.length?': '+mySubs.map(s=>s.nome).join(', '):''}</div>
        </div>
        <button class="btn xs" onclick="editCat(${i})">✏</button>
        <button class="btn xs dn" onclick="delCat(${i})">✕</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Nenhuma categoria.</div>';

  if (subEl) subEl.innerHTML = subs.length ? subs.map((s,i) => {
    const pai = cats.find(c=>c.id===s.pai);
    return `<div class="cfg-item">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:10px;background:${pai?pai.cor+'22':'var(--bg3)'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${pai?pai.emoji||'📦':'📦'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700">${s.nome}</div>
          <div style="font-size:11px;color:var(--txt3)">${pai?'→ '+pai.nome:'⚠ sem categoria pai'}</div>
        </div>
        <button class="btn xs" onclick="editSub(${i})">✏</button>
        <button class="btn xs dn" onclick="delSub(${i})">✕</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Nenhuma subcategoria.</div>';
}

// ── TOGGLE ATIVO/INATIVO ──────────────────────────────────────
function toggleAccAtiva(id, v) {
  const a = accs.find(x=>x.id===id); if(a){a.ativa=v; saveAll(); renderCfgContas(); populateForm(); toast(v?'Conta ativada':'Conta desativada');}
}
function toggleCartAtiva(id, v) {
  const c = carts.find(x=>x.id===id); if(c){c.ativa=v; saveAll(); renderCfgCartoes(); populateForm(); toast(v?'Cartão ativado':'Cartão desativado');}
}
function togglePagAtiva(id, v){ const p=pags.find(x=>x.id===id); if(p){p.ativa=v; saveAll(); if(typeof renderCfgPags==='function')renderCfgPags(); populateForm(); toast(v?'Pagamento ativado':'Pagamento desativado');} }
function toggleCatAtiva(id, v){ const c=cats.find(x=>x.id===id); if(c){c.ativa=v; saveAll(); if(typeof renderCfgCats==='function')renderCfgCats(); populateForm(); toast(v?'Categoria ativada':'Categoria desativada');} }

// ── ABRIR/FECHAR FORMS ────────────────────────────────────────
function openAddAcc()  { const el=document.getElementById('add-acc-form');  if(el){el.style.display='block'; el.scrollIntoView({behavior:'smooth',block:'nearest'});} }
function closeAddAcc() { const el=document.getElementById('add-acc-form');  if(el) el.style.display='none'; }
function openAddCart() {
  const el=document.getElementById('add-cart-form'); if(!el) return;
  _populateCartAccSel();
  el.style.display='block'; el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function _populateCartAccSel() {
  const sel=document.getElementById('cc-acc');
  if(sel) sel.innerHTML='<option value="">Selecione a conta...</option>'+
    accs.filter(a=>a.ativa!==false).map(a=>`<option value="${a.id}">${a.emoji||'🏦'} ${a.nome}</option>`).join('');
}
function closeAddCart(){ const el=document.getElementById('add-cart-form'); if(el) el.style.display='none'; }
function openAddPag()  { const el=document.getElementById('add-pag-form');  if(el){el.style.display='block'; el.scrollIntoView({behavior:'smooth',block:'nearest'});} }
function closeAddPag() { const el=document.getElementById('add-pag-form');  if(el) el.style.display='none'; }
function openAddCat()  { const el=document.getElementById('add-cat-form');  if(el){el.style.display='block'; el.scrollIntoView({behavior:'smooth',block:'nearest'});} }
function closeAddCat() { const el=document.getElementById('add-cat-form');  if(el) el.style.display='none'; }
function openAddSub() {
  const el=document.getElementById('add-sub-form'); if(!el) return;
  const sel=document.getElementById('ns-cat');
  if(sel) sel.innerHTML='<option value="">Selecione...</option>'+
    cats.map(c=>`<option value="${c.id}">${c.emoji||''} ${c.nome}</option>`).join('');
  el.style.display='block'; el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function closeAddSub() { const el=document.getElementById('add-sub-form'); if(el) el.style.display='none'; }

// catTab agora serve a cfg-cat-list e cfg-sub-list
function catTab(t, btn) {
  const catEl = document.getElementById('cfg-cat-list');
  const subEl = document.getElementById('cfg-sub-list');
  if (catEl) catEl.style.display = t==='cat' ? 'block' : 'none';
  if (subEl) subEl.style.display = t==='sub' ? 'block' : 'none';
  document.querySelectorAll('#cfg-t-cats > .tabs .tab').forEach(b=>b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  renderCfgCats();
};

// ── ABAS: DADOS (sync+importar) ───────────────────────────────
function dadosTab(t, btn) {
  ['sync','imp','drv','csv'].forEach(x => {
    const el = document.getElementById('dados-t-'+x);
    if (el) el.style.display = x===t ? 'block' : 'none';
  });
  document.querySelectorAll('#dados-tabs .tab').forEach(b => b.classList.remove('act'));
  if (btn) btn.classList.add('act');
  else { const b = document.querySelector(`#dados-tabs .tab[onclick*="'${t}'"]`); if(b) b.classList.add('act'); }
  if (t==='sync') { updateSyncHero(); renderSyncSt(); renderPend();
    const u=document.getElementById('sh-url'); if(u) u.value=cfg.shUrl||'';
    const su=document.getElementById('sh-sheet-url'); if(su) su.value=cfg.sheetUrl||'';
    pend=pend.filter(id=>desps.find(d=>d.id===id)); updSyncBnr();
  }
  if (t==='imp') { onImpTipo(); populateDel2Sels(); renderMigration(); }
  if (t==='drv') { updateDriveStatus(); }
  if (t==='csv') { initShMes(); renderCSV(); populateDelSels(); }
}

// ── POPULATEFORM: só contas/cartões ATIVOS ────────────────────
// Override para filtrar por ativo
// ── FILTROS MULTI-SELECT ──────────────────────────────────────
// Estado dos filtros ativos

function renderFltChips(containerId, items, fltKey, labelFn, onChangeFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(item => {
    const on = FLT[fltKey].includes(item.id);
    return `<div class="flt-chip ${on?'on':''}" onclick="toggleFlt('${fltKey}','${item.id}',this,${onChangeFn})">${labelFn(item)}</div>`;
  }).join('');
}

function toggleFlt(key, id, el, onChangeFn) {
  const idx = FLT[key].indexOf(id);
  if (idx >= 0) { FLT[key].splice(idx,1); el.classList.remove('on'); }
  else          { FLT[key].push(id);      el.classList.add('on'); }
  if (typeof onChangeFn === 'function') onChangeFn();
}

function clearAllFlt(onChangeFn) {
  Object.keys(FLT).forEach(k => FLT[k] = []);
  document.querySelectorAll('.flt-chip').forEach(c=>c.classList.remove('on'));
  if (typeof onChangeFn === 'function') onChangeFn();
}

// ── FILTROS DE TRANSAÇÕES: multi-select ──────────────────────
function populateFlt() {
  // Conta
  renderFltBlock('f-flt-accs', accs.filter(a=>a.ativa!==false), 'accs', a=>`${a.emoji||'🏦'} ${a.nome}`, renderTrans);
  // Cartão
  renderFltBlock('f-flt-carts', carts.filter(c=>c.ativa!==false), 'carts', c=>c.nome, renderTrans);
  // Pagamento
  renderFltBlock('f-flt-pags', pags, 'pags', p=>p.nome, renderTrans);
  // Categoria
  renderFltBlock('f-flt-cats', cats, 'cats', c=>`${c.emoji||''} ${c.nome}`, () => { populateFltSubs(); renderTrans(); });
}

function populateFltSubs() {
  const catIds = FLT.cats.length ? FLT.cats : cats.map(c=>c.id);
  const mySubs = subs.filter(s=>catIds.includes(s.pai));
  // Limpar subs que não são mais válidas
  FLT.subs = FLT.subs.filter(id=>mySubs.find(s=>s.id===id));
  renderFltBlock('f-flt-subs', mySubs, 'subs', s=>s.nome, renderTrans);
}

function renderFltBlock(containerId, items, key, labelFn, _onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) { el.innerHTML = '<span style="font-size:11px;color:var(--txt3)">Nenhum</span>'; return; }
  el.innerHTML = items.map(item => {
    const on = FLT[key].includes(item.id);
    const label = labelFn(item);
    // Usar data-atributos para evitar quebra por caracteres especiais no id
    return `<div class="flt-chip ${on?'on':''}" data-key="${key}" data-id="${item.id}" onclick="handleFltChip(this)">${label}</div>`;
  }).join('');
}

function handleFltChip(el) {
  const key = el.dataset.key;
  const id  = el.dataset.id;
  const idx = FLT[key].indexOf(id);
  if (idx >= 0) { FLT[key].splice(idx,1); el.classList.remove('on'); }
  else          { FLT[key].push(id);      el.classList.add('on'); }
  if (key === 'cats') { populateFltSubs(); }
  renderTrans();
}


function toggleFltChip(key, id, el) {
  const idx = FLT[key].indexOf(id);
  if (idx >= 0) { FLT[key].splice(idx,1); el.classList.remove('on'); }
  else          { FLT[key].push(id);      el.classList.add('on'); }
  // Se foi categoria, re-popular subs
  if (key === 'cats') populateFltSubs();
  renderTrans();
}

function clearFlt() {
  ['accs','carts','cats','subs','pags'].forEach(k=>FLT[k]=[]);
  ['f-flt-accs','f-flt-carts','f-flt-pags','f-flt-cats','f-flt-subs'].forEach(id=>{
    document.querySelectorAll(`#${id} .flt-chip`).forEach(c=>c.classList.remove('on'));
  });
  renderTrans();
}

// ── RENDERTRANS: usar FLT ────────────────────────────────────
// Patch renderTrans para usar os novos filtros multi-select
// Override completo do filtro — injetar nos resultados de renderTrans
// Via override da função de filtragem interna
const _getTransFiltered_orig = typeof getTransFiltered === 'function' ? getTransFiltered : null;

// Como renderTrans é minificada, vamos patchear o resultado HTML injetando filtro antes
// A abordagem mais simples: substituir o que populateFlt() injetava antes (selects) por chips
// E no renderTrans, ler FLT[] em vez dos selects

// Verificar o que renderTrans usa como filtros


// ═══════════════════════════════════════════════════════════════
//  v7.83 — adições
// ═══════════════════════════════════════════════════════════════

// Cartão dual (crédito/débito)
function onCart(){
  const cartId=document.getElementById('l-cart').value;
  const c=carts.find(x=>x.id===cartId);
  const row=document.getElementById('l-pag-row');
  const pagSel=document.getElementById('l-pag');
  if(!c){if(row)row.style.display='';if(pagSel){pagSel.innerHTML='<option value="">Selecione...</option>'+pags.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('');}return;}
  if(c.tipoUso==='credit'){
    const px=pags.find(p=>p.tipo==='credit');
    if(pagSel){pagSel.innerHTML=`<option value="${px.id}">${px.nome}</option>`;pagSel.value=px.id;}
    if(row)row.style.display='none';
  }else if(c.tipoUso==='debit'){
    const px=pags.find(p=>p.tipo==='debit');
    if(pagSel){pagSel.innerHTML=`<option value="${px.id}">${px.nome}</option>`;pagSel.value=px.id;}
    if(row)row.style.display='none';
  }else{
    if(row)row.style.display='';
    if(pagSel){
      const opts=pags.filter(p=>p.tipo==='credit'||p.tipo==='debit');
      pagSel.innerHTML='<option value="">Crédito ou Débito? *</option>'+opts.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('');
    }
  }
  if(typeof onPag==='function')onPag();
}

// Editar pagamento
function editPag(id){
  const p=pags.find(x=>x.id===id); if(!p) return;
  const novoNome=prompt('Nome do pagamento:',p.nome);
  if(novoNome===null) return;
  const t=p.tipo;
  const novoTipo=prompt('Tipo (credit/debit/pix/dinheiro/outro):',t);
  if(novoTipo===null) return;
  p.nome=novoNome.trim()||p.nome;
  p.tipo=novoTipo.trim()||p.tipo;
  saveAll(); if(typeof renderPags==='function')renderPags();
  toast('Pagamento atualizado!');
}

// ── FILTRO GLOBAL UNIFICADO (estilo Transações) — v7.84 ───────
window.GFLT = window.GFLT || { per:'mes', d1:'', d2:'', q:'', accs:[], carts:[], pags:[], cats:[], subs:[] };

function _getActivePage(){
  const p=document.querySelector('.page.on');
  return p?p.id.replace('p-',''):'resumo';
}

function _gflt_periodRange(){
  const t=today(); const G=window.GFLT;
  const d=new Date(t);
  if(G.per==='custom') return [G.d1||'', G.d2||''];
  if(G.per==='7'){const a=new Date(d);a.setDate(a.getDate()-7);return [a.toISOString().slice(0,10),t];}
  if(G.per==='30'){const a=new Date(d);a.setDate(a.getDate()-30);return [a.toISOString().slice(0,10),t];}
  if(G.per==='90'){const a=new Date(d);a.setDate(a.getDate()-90);return [a.toISOString().slice(0,10),t];}
  if(G.per==='ano'){return [t.slice(0,4)+'-01-01',t];}
  // mes
  return [t.slice(0,8)+'01', t];
}

function applyGlobalToFLT(){
  // Espelha GFLT em FLT[] (multi-select da página Transações)
  FLT.accs=[...window.GFLT.accs];
  FLT.carts=[...window.GFLT.carts];
  FLT.pags=[...window.GFLT.pags];
  FLT.cats=[...window.GFLT.cats];
  FLT.subs=[...window.GFLT.subs];
  const [d1,d2]=_gflt_periodRange();
  perStart=d1; perEnd=d2;
  const e1=document.getElementById('f-d1'); if(e1)e1.value=d1||'';
  const e2=document.getElementById('f-d2'); if(e2)e2.value=d2||'';
  const eq=document.getElementById('f-q'); if(eq)eq.value=window.GFLT.q||'';
}

function gfltFiltered(){
  // Lista filtrada para qualquer página, baseada em GFLT
  const [d1,d2]=_gflt_periodRange();
  const G=window.GFLT;
  let list=desps.slice();
  if(d1) list=list.filter(x=>x.data>=d1);
  if(d2) list=list.filter(x=>x.data<=d2);
  if(G.accs.length)  list=list.filter(x=>G.accs.includes(x.accId));
  if(G.carts.length) list=list.filter(x=>G.carts.includes(x.cartId));
  if(G.pags.length)  list=list.filter(x=>G.pags.includes(x.pagId));
  if(G.cats.length)  list=list.filter(x=>G.cats.includes(x.catId));
  if(G.subs.length)  list=list.filter(x=>G.subs.includes(x.subId));
  if(G.q){const q=G.q.toLowerCase();list=list.filter(x=>(x.desc+' '+(x.obs||'')).toLowerCase().includes(q));}
  return list.sort((a,b)=>b.data.localeCompare(a.data));
}

function openGlobalFilter(){
  const page=_getActivePage();
  if(page==='transacoes'){ if(typeof toggleTransFilters==='function')toggleTransFilters(); return; }
  let modal=document.getElementById('global-flt-modal');
  if(!modal){
    modal=document.createElement('div'); modal.id='global-flt-modal'; modal.className='mov';
    document.body.appendChild(modal);
  }
  const G=window.GFLT;
  const chip=(label,val)=>`<div class="chip ${G.per===val?'act':''}" onclick="window.GFLT.per='${val}';document.getElementById('gf-custom').style.display='${val}==='custom'?'block':'none';document.querySelectorAll('#gf-period .chip').forEach(c=>c.classList.remove('act'));this.classList.add('act');document.getElementById('gf-custom').style.display='${val}'==='custom'?'block':'none';">${label}</div>`;
  const block=(title,key,items,labelFn)=>{
    if(!items.length) return '';
    return `<div class="flt-section"><div class="flt-section-label">${title}</div><div class="flt-chips">${items.map(it=>{
      const on=G[key].includes(it.id);
      return `<div class="flt-chip ${on?'on':''}" data-gkey="${key}" data-gid="${it.id}" onclick="gfltToggle(this)">${labelFn(it)}</div>`;
    }).join('')}</div></div>`;
  };
  modal.innerHTML=`<div class="modal" style="max-width:460px;max-height:88vh;overflow-y:auto">
    <div class="mhnd"></div>
    <h3 style="margin-bottom:6px">☰ Filtrar — <span id="gf-page-lbl">${({resumo:'Resumo',calendario:'Calendário',parcelas:'Parcelamentos',relatorio:'Relatório',datagrid:'Grade de Dados',orcamento:'Orçamento',analise:'Análise'})[page]||page}</span></h3>
    <div class="chip-row" id="gf-period" style="margin:6px 0 8px">
      ${chip('Este mês','mes')}${chip('7 dias','7')}${chip('30 dias','30')}${chip('90 dias','90')}${chip('Este ano','ano')}${chip('Período livre','custom')}
    </div>
    <div id="gf-custom" style="display:${G.per==='custom'?'block':'none'};margin-bottom:8px">
      <div class="drange"><input type="date" id="gf-d1" value="${G.d1||''}"/><span style="font-size:11px;color:var(--txt3)">até</span><input type="date" id="gf-d2" value="${G.d2||''}"/></div>
    </div>
    <div class="fg" style="margin-bottom:8px"><label>Buscar</label><input id="gf-q" placeholder="Descrição..." value="${G.q||''}"/></div>
    <div style="background:var(--bg2);border:0.5px solid var(--bdr);border-radius:var(--r);padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:700;color:var(--txt3);text-transform:uppercase;letter-spacing:.05em">Filtros — marque um ou mais</span>
        <button class="btn xs" onclick="clearGlobalFilter()">Limpar</button>
      </div>
      ${block('Contas','accs',accs.filter(a=>a.ativa!==false),a=>`${a.emoji||'🏦'} ${a.nome}`)}
      ${block('Pagamentos','pags',pags.filter(p=>p.ativa!==false),p=>p.nome)}
      ${block('Cartões','carts',carts.filter(c=>c.ativa!==false),c=>c.nome)}
      ${block('Categorias','cats',cats.filter(c=>c.ativa!==false),c=>`${c.emoji||''} ${c.nome}`)}
      ${block('Subcategorias','subs',subs,s=>s.nome)}
    </div>
    <div class="mbtns" style="margin-top:10px">
      <button class="btn sm" onclick="closeGlobalFilter()">Cancelar</button>
      <button class="btn pr sm" onclick="applyGlobalFilter()">Aplicar</button>
    </div>
  </div>`;
  modal.classList.add('on');
}

function gfltToggle(el){
  const k=el.dataset.gkey,id=el.dataset.gid;
  const arr=window.GFLT[k]; const i=arr.indexOf(id);
  if(i>=0){arr.splice(i,1);el.classList.remove('on');} else {arr.push(id);el.classList.add('on');}
}

function closeGlobalFilter(){const m=document.getElementById('global-flt-modal');if(m)m.classList.remove('on');}

function clearGlobalFilter(){
  window.GFLT={per:'mes',d1:'',d2:'',q:'',accs:[],carts:[],pags:[],cats:[],subs:[]};
  closeGlobalFilter(); openGlobalFilter();
}

function applyGlobalFilter(){
  const G=window.GFLT;
  const d1=document.getElementById('gf-d1'); if(d1)G.d1=d1.value;
  const d2=document.getElementById('gf-d2'); if(d2)G.d2=d2.value;
  const q=document.getElementById('gf-q'); if(q)G.q=q.value;
  applyGlobalToFLT();
  const page=_getActivePage();
  try{
    if(page==='resumo'  && typeof renderResumo==='function')   renderResumo();
    if(page==='calendario'&&typeof renderCal==='function')     renderCal();
    if(page==='parcelas' && typeof renderParcs==='function')   renderParcs();
    if(page==='datagrid' && typeof renderDG==='function')      renderDG();
    if(page==='relatorio'&& typeof buildRelatorio==='function')buildRelatorio();
    if(page==='analise'  && typeof renderAnalise==='function') renderAnalise();
    if(page==='orcamento'&& typeof renderOrc==='function')     renderOrc();
    if(page==='transacoes'&&typeof renderTrans==='function')   renderTrans();
  }catch(e){console.warn('apply filter err',e);}
  closeGlobalFilter();
  toast('Filtro aplicado');
}

function topbarFilterClick(){ openGlobalFilter(); }

// README dinâmico
function atualizarLogAlteracoes(){
  const log=`# Finanças Pessoais — v${VERSAO_ATUAL}

## Changelog v${VERSAO_ATUAL}
- ✅ Filtro unificado v${VERSAO_ATUAL}: botão ☰ no cabeçalho controla filtros de Resumo, Calendário, Parcelamentos, Relatório, Grade de Dados e Transações.
- ✅ Edição de registros habilitada em Contas, Cartões, Pagamentos, Categorias e Subcategorias.
- ✅ Persistência de URL via Backup: o JSON exportado inclui \`url_sistema\` e novos dispositivos aplicam automaticamente no localStorage.
- ✅ Hierarquia de lançamento obrigatória: Conta → Cartão → Função (se dual) → Categoria → Subcategoria.
- ✅ Cartões com tipo de uso (Crédito, Débito ou Ambos).

## Como usar
1. Abra Apps Script da sua planilha → cole \`apps-script.gs\` → Implantar como Web App.
2. Cole a URL gerada em **Sync** ou importe um backup que já a contenha.
3. Lance despesas, filtre tudo pelo botão ☰ e edite qualquer cadastro pelo ícone ✏️.
`;
  return log;
}

// Versão automática + título + rodapé
function injectVersaoUI(){
  document.title='Finanças Pessoais v'+VERSAO_ATUAL;
  document.querySelectorAll('[data-versao]').forEach(el=>{el.textContent='v'+VERSAO_ATUAL;});
  const ftr=document.getElementById('app-footer');
  if(ftr) ftr.textContent='Finanças Pessoais — v'+VERSAO_ATUAL;
}
window.addEventListener('load',()=>{ try{injectVersaoUI();}catch(e){} });

// URL do script direto (fallback rápido se cfg ainda não carregou)
(function(){
  try{
    const direct=localStorage.getItem('fin6_shUrl_direct');
    if(direct&&!cfg.shUrl){cfg.shUrl=direct;gs('cfg',cfg);}
  }catch(e){}
})();


// Editar cartão (modo formulário)
function editCart(id){
  const c=carts.find(x=>x.id===id); if(!c) return;
  if(typeof openAddCart==='function') openAddCart();
  const set=(i,v)=>{const e=document.getElementById(i);if(e)e.value=v??'';};
  set('cc-nome',c.nome);
  set('cc-band',c.band||'Visa');
  set('cc-acc',c.accId||'');
  set('cc-lim',c.limite||0);
  const f=document.getElementById('cc-fec')||document.getElementById('cc-fech'); if(f)f.value=c.fech||'';
  const v=document.getElementById('cc-vec')||document.getElementById('cc-venc'); if(v)v.value=c.venc||'';
  set('cc-tipo',c.tipoUso||'ambos');
  set('cc-cor',c.cor||'#6366f1');
  const tip=document.getElementById('cc-tipo'); if(tip)tip.dataset.editId=id;
  const btn=document.getElementById('cc-save-btn'); if(btn)btn.textContent='Atualizar';
  toast('Editando: '+c.nome);
}
