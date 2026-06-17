/**
 * FINANÇAS PESSOAIS v1.8 — Apps Script
 * ─────────────────────────────────────
 * COMO IMPLANTAR:
 *   1. Extensões → Apps Script → cole este código → Salve (Ctrl+S)
 *   2. Implantar → Nova implantação → Tipo: App da Web
 *   3. Executar como: EU MESMO
 *   4. Quem tem acesso: QUALQUER PESSOA (incluindo anônimos)  ← OBRIGATÓRIO
 *   5. Clique em Implantar → Autorize → Copie a URL /exec
 *
 * REAUTORIZAR (se parar de funcionar):
 *   Implantar → Gerenciar implantações → Editar → Nova versão → Implantar
 */

const SHEET_NAME  = 'Transações';
const APPDATA_KEY = 'appdata_v2';

// ─── CORS: responde com headers corretos ─────────────────────
function makeResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function makeJSONP(cb, data) {
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// ─── ROTEADOR GET ─────────────────────────────────────────────
// GET é usado para: ping, info, healthcheck, JSONP, e como fallback
// para addRows quando POST falha (via parâmetro 'data' encodado)
function doGet(e) {
  const p = e.parameter || {};
  const action = p.action || '';
  const cb = p.callback || p.cb || '';  // JSONP callback name

  try {
    let result;

    if (action === 'ping') {
      result = {ok:true, v:'1.8', ts: Date.now()};

    } else if (action === 'info' || action === 'healthcheck') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sh = getOrCreateSheet();
      result = {
        ok: true, v: '1.8',
        sheetUrl: ss.getUrl(),
        sheetName: ss.getName(),
        rows: Math.max(0, sh.getLastRow() - 1)
      };

    } else if (action === 'getRows') {
      result = getRowsData();

    } else if (action === 'getAppData') {
      result = getAppDataFromStore();

    } else if (action === 'addRowsGet') {
      // Fallback: dados enviados como GET param (encodado em base64/JSON)
      // Usado quando POST é bloqueado
      const raw = p.data || '';
      if (!raw) { result = {ok:false, error:'no data'}; }
      else {
        const rows = JSON.parse(decodeURIComponent(raw));
        result = insertRows(rows);
      }

    } else if (action === 'fixValores') {
      result = fixValoresNaPlanilha();

    } else {
      result = {ok: true, info: 'Finanças v1.8', ts: Date.now()};
    }

    // Retornar como JSONP se tiver callback, senão JSON normal
    return cb ? makeJSONP(cb, result) : makeResponse(result);

  } catch(err) {
    const errObj = {ok: false, error: err.toString()};
    return cb ? makeJSONP(cb, errObj) : makeResponse(errObj);
  }
}

// ─── ROTEADOR POST ────────────────────────────────────────────
function doPost(e) {
  try {
    // Parse do body (enviado como text/plain para evitar preflight CORS)
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';

    if (action === 'addRows')       return makeResponse(insertRows(body.rows || []));
    if (action === 'deleteRow')     return makeResponse(deleteById(body.id));
    if (action === 'updateRow')     return makeResponse(updateById(body.id, body.row || []));
    if (action === 'saveAppData')   return makeResponse(storeAppData(body.payload));
    if (action === 'backupToDrive') return makeResponse(createDriveBackup(body.rows||[], body.meta||{}));

    return makeResponse({ok: false, error: 'Ação desconhecida: ' + action});

  } catch(err) {
    return makeResponse({ok: false, error: err.toString()});
  }
}

// ─── PLANILHA ─────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    const hdr = ['Data','Descrição','Categoria','Subcategoria',
                 'Pagamento','Cartão','Conta','Valor',
                 'Parcela','Total Parc.','Obs','ID App'];
    sh.appendRow(hdr);
    sh.getRange(1, 1, 1, hdr.length)
      .setFontWeight('bold')
      .setBackground('#6366f1')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 100);  // Data
    sh.setColumnWidth(2, 200);  // Descrição
    sh.setColumnWidth(12, 160); // ID App
  }
  return sh;
}

// Converte string "1234.56" ou "1.234,56" para número limpo
function _numValor(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  var s = String(v).trim().replace(/[R$\s]/g,'');
  // "1.234,56" → 1234.56
  if (/^[\d.]+,[\d]{1,2}$/.test(s)) return parseFloat(s.replace(/\./g,'').replace(',','.'));
  // "1,234.56" → 1234.56
  if (/^[\d,]+\.[\d]{1,2}$/.test(s)) return parseFloat(s.replace(/,/g,''));
  var n = parseFloat(s.replace(',','.'));
  return isNaN(n) ? 0 : n;
}

// Converte qualquer formato de data para objeto Date seguro
function _parseDataGS(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  var s = String(raw).trim();
  // YYYY-MM-DD
  var m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return new Date(+m1[1], +m1[2]-1, +m1[3]);
  // DD/MM/YYYY
  var m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return new Date(+m2[3], +m2[2]-1, +m2[1]);
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// Formata Date para "YYYY-MM-DD" (sem timezone)
function _fmtDataGS(raw) {
  var d = _parseDataGS(raw);
  if (!d) return '';
  var y = d.getFullYear();
  var m = String(d.getMonth()+1).padStart(2,'0');
  var dd = String(d.getDate()).padStart(2,'0');
  return y + '-' + m + '-' + dd;
}

function insertRows(rows) {
  if (!rows || rows.length === 0) return {ok:true, inserted:0, skipped:0};
  const sh = getOrCreateSheet();

  const lastRow = sh.getLastRow();
  let existSet = new Set();
  if (lastRow > 1) {
    sh.getRange(2, 12, lastRow - 1, 1)
      .getValues().flat()
      .forEach(id => { if (id) existSet.add(String(id)); });
  }

  const toInsert = [];
  let inserted = 0, skipped = 0;

  rows.forEach(row => {
    const id = String(row[11] || '');
    if (id && existSet.has(id)) { skipped++; return; }
    // Garantir: col 0 = data como string YYYY-MM-DD, col 7 = número
    const clean = row.slice();
    clean[0] = _fmtDataGS(clean[0]) || String(clean[0] || '');
    clean[7] = _numValor(clean[7]);
    toInsert.push(clean);
    if (id) existSet.add(id);
    inserted++;
  });

  if (toInsert.length > 0) {
    const startRow = sh.getLastRow() + 1;
    sh.getRange(startRow, 1, toInsert.length, 12).setValues(toInsert);
    // Coluna Valor (8) como número com 2 casas decimais
    try { sh.getRange(startRow, 8, toInsert.length, 1).setNumberFormat('#,##0.00'); } catch(e) {}
    // Coluna Data (1) como texto YYYY-MM-DD (já é string limpa)
    try { sh.getRange(startRow, 1, toInsert.length, 1).setNumberFormat('@'); } catch(e) {}
  }

  return {ok: true, inserted, skipped};
}

function getRowsData() {
  const sh = getOrCreateSheet();
  if (sh.getLastRow() <= 1) return {ok:true, rows:[]};
  const vals = sh.getRange(2, 1, sh.getLastRow()-1, 12).getValues();
  const rows = vals
    .filter(r => r[0] || r[11])
    .map(r => {
      const clean = r.slice();
      // Normalizar data: sempre YYYY-MM-DD (string)
      clean[0] = _fmtDataGS(clean[0]) || String(clean[0] || '');
      // Normalizar valor: sempre número
      clean[7] = _numValor(clean[7]);
      return clean;
    });
  return {ok: true, rows};
}

function deleteById(id) {
  if (!id) return {ok:false, error:'id obrigatório'};
  const sh = getOrCreateSheet();
  const vals = sh.getDataRange().getValues();
  let deleted = 0;
  for (let i = vals.length - 1; i >= 1; i--) {
    if (String(vals[i][11]) === String(id)) {
      sh.deleteRow(i + 1);
      deleted++;
    }
  }
  return {ok: true, deleted};
}

function updateById(id, row) {
  if (!id || !row.length) return {ok:false, error:'id e row obrigatórios'};
  const sh = getOrCreateSheet();
  const last = sh.getLastRow();
  if (last <= 1) return {ok:false, error:'planilha vazia'};
  const ids = sh.getRange(2, 12, last-1, 1).getValues().flat().map(String);
  const idx = ids.indexOf(String(id));
  if (idx < 0) return {ok:false, error:'ID não encontrado — será inserido na próxima sync'};
  // Garantir 12 colunas e manter ID
  while (row.length < 12) row.push('');
  row[11] = id;
  sh.getRange(idx+2, 1, 1, 12).setValues([row]);
  return {ok: true, rowNum: idx+2};
}


// ─── FIX: corrigir datas e valores ruins na planilha ─────────────
// Chamar uma vez via: GET ?action=fixValores
function fixValoresNaPlanilha() {
  const sh = getOrCreateSheet();
  const last = sh.getLastRow();
  if (last <= 1) return {ok:true, fixed:0};
  const range = sh.getRange(2, 1, last-1, 12);
  const vals  = range.getValues();
  let fixed = 0;

  for (var i = 0; i < vals.length; i++) {
    let changed = false;
    // Col 1 (índice 0): Data
    const rawData = vals[i][0];
    const dataLimpa = _fmtDataGS(rawData);
    if (dataLimpa && String(rawData) !== dataLimpa) {
      vals[i][0] = dataLimpa;
      changed = true;
    }
    // Col 8 (índice 7): Valor
    const rawVal = vals[i][7];
    const numVal = _numValor(rawVal);
    if (String(rawVal) !== String(numVal) || typeof rawVal !== 'number') {
      vals[i][7] = numVal;
      changed = true;
    }
    if (changed) fixed++;
  }

  if (fixed > 0) {
    range.setValues(vals);
    // Formatar coluna Valor como número
    try { sh.getRange(2, 8, last-1, 1).setNumberFormat('#,##0.00'); } catch(e) {}
    // Formatar coluna Data como texto
    try { sh.getRange(2, 1, last-1, 1).setNumberFormat('@'); } catch(e) {}
  }
  return {ok: true, fixed, total: vals.length};
}
function storeAppData(payload) {
  if (!payload) return {ok:false, error:'payload vazio'};
  try {
    PropertiesService.getScriptProperties()
      .setProperty(APPDATA_KEY, JSON.stringify(payload));
    return {ok: true};
  } catch(e) {
    return {ok: false, error: e.toString()};
  }
}

function getAppDataFromStore() {
  const raw = PropertiesService.getScriptProperties().getProperty(APPDATA_KEY);
  return {ok: true, data: raw ? JSON.parse(raw) : null};
}

// ─── BACKUP NO DRIVE ──────────────────────────────────────────
function createDriveBackup(rows, meta) {
  try {
    const name = (meta.filename || ('Financas_' + new Date().toISOString().slice(0,10)))
                   .replace(/\.xlsx?$/, '');
    const ss = SpreadsheetApp.create(name);
    const sh = ss.getActiveSheet();
    sh.setName('Transações');

    if (rows.length > 0) {
      sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      sh.getRange(1, 1, 1, rows[0].length)
        .setFontWeight('bold').setBackground('#6366f1').setFontColor('#fff');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, rows[0].length);
    }

    if (meta.cats?.length) {
      const sc = ss.insertSheet('Categorias');
      sc.appendRow(['ID','Nome','Emoji','Cor']);
      meta.cats.forEach(c => sc.appendRow([c.id, c.nome, c.emoji||'', c.cor||'']));
    }
    if (meta.accs?.length) {
      const sa = ss.insertSheet('Contas');
      sa.appendRow(['ID','Nome','Emoji','Tipo']);
      meta.accs.forEach(a => sa.appendRow([a.id, a.nome, a.emoji||'', a.tipo||'']));
    }

    const file = DriveApp.getFileById(ss.getId());
    if (meta.folder?.trim()) {
      try {
        const folder = DriveApp.getFolderById(meta.folder.trim());
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);
      } catch(e) { /* pasta inválida — manter na raiz */ }
    }

    return {ok: true, url: ss.getUrl(), name: ss.getName()};
  } catch(err) {
    return {ok: false, error: err.toString()};
  }
}
