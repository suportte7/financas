/**
 * FINANÇAS PESSOAIS — Apps Script v7.4
 * Cole em: Extensões → Apps Script → Implantar → App da Web
 * Executar como: Eu mesmo | Acesso: Qualquer pessoa
 *
 * PERMISSÕES NECESSÁRIAS (aparecem na autorização):
 *   - Google Sheets (leitura/escrita)
 *   - Google Drive (criar arquivos para backup)
 */

const SHEET_NAME  = 'Transações';
const APPDATA_KEY = 'appdata_v7';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'ping')       return ok({ok:true, v:'7.83'});
  if (action === 'getRows')    return getRows();
  if (action === 'getAppData') return getAppData();
  return ok({ok:true, info:'Finanças v7.83'});
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action || '';
    if (action === 'addRows')       return addRows(body.rows || []);
    if (action === 'deleteRow')     return deleteRowById(body.id);
    if (action === 'updateRow')     return updateRowById(body.id, body.row || []);
    if (action === 'saveAppData')   return saveAppData(body.payload);
    if (action === 'backupToDrive') return backupToDrive(body.rows || [], body.meta || {});
    return ok({ok:false, error:'Ação desconhecida: ' + action});
  } catch(err) {
    return ok({ok:false, error: err.toString()});
  }
}

// ── PLANILHA ─────────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    const hdr = ['Data','Descrição','Categoria','Subcategoria','Pagamento',
                 'Cartão','Conta','Valor','Parcela','Total Parcelas','Obs','ID App'];
    sh.appendRow(hdr);
    sh.getRange(1,1,1,hdr.length)
      .setFontWeight('bold').setBackground('#6366f1').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function addRows(rows) {
  const sh = getSheet();
  // Ler IDs existentes UMA vez para checar duplicata
  const lastRow = sh.getLastRow();
  const existingIds = lastRow > 1
    ? sh.getRange(2, 12, lastRow - 1, 1).getValues().flat().map(String)
    : [];
  const existSet = new Set(existingIds);

  let inserted = 0, skipped = 0;
  const toAdd = [];
  rows.forEach(row => {
    const id = String(row[11] || '');
    if (id && existSet.has(id)) { skipped++; return; }
    toAdd.push(row);
    if (id) existSet.add(id);
    inserted++;
  });

  if (toAdd.length > 0) {
    sh.getRange(sh.getLastRow()+1, 1, toAdd.length, toAdd[0].length).setValues(toAdd);
  }
  return ok({ok:true, inserted, skipped});
}

function getRows() {
  const sh = getSheet();
  if (sh.getLastRow() <= 1) return ok({ok:true, rows:[]});
  const vals = sh.getRange(2,1,sh.getLastRow()-1,12).getValues();
  return ok({ok:true, rows: vals.filter(r => r[0] && r[11])});
}

function deleteRowById(id) {
  const sh = getSheet();
  const vals = sh.getDataRange().getValues();
  for (let i = vals.length-1; i >= 1; i--) {
    if (String(vals[i][11]) === String(id)) sh.deleteRow(i+1);
  }
  return ok({ok:true});
}

// ── APP DATA ─────────────────────────────────────────────────
function saveAppData(payload) {
  PropertiesService.getScriptProperties()
    .setProperty(APPDATA_KEY, JSON.stringify(payload));
  return ok({ok:true});
}

function getAppData() {
  const raw = PropertiesService.getScriptProperties().getProperty(APPDATA_KEY);
  return ok({ok:true, data: raw ? JSON.parse(raw) : {}});
}

// ── BACKUP GOOGLE DRIVE ───────────────────────────────────────
// IMPORTANTE: ao implantar pela primeira vez, o Google pedirá permissão
// para acessar o Drive — clique em "Permitir"
function backupToDrive(rows, meta) {
  try {
    // Criar nova planilha Google Sheets no Drive
    const filename = (meta.filename || ('Financas_' + new Date().toISOString().slice(0,10)))
                       .replace(/\.xlsx?$/,'');
    const ss = SpreadsheetApp.create(filename);

    // Aba de transações
    const sh = ss.getActiveSheet();
    sh.setName('Transações');
    if (rows.length > 0) {
      sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      sh.getRange(1, 1, 1, rows[0].length)
        .setFontWeight('bold').setBackground('#6366f1').setFontColor('#fff');
      sh.setFrozenRows(1);
      sh.autoResizeColumns(1, rows[0].length);
    }

    // Aba de categorias
    if (meta.cats && meta.cats.length) {
      const sc = ss.insertSheet('Categorias');
      sc.appendRow(['ID','Nome','Emoji','Cor']);
      meta.cats.forEach(c => sc.appendRow([c.id, c.nome, c.emoji||'', c.cor||'']));
    }

    // Aba de contas
    if (meta.accs && meta.accs.length) {
      const sa = ss.insertSheet('Contas');
      sa.appendRow(['ID','Nome','Emoji','Tipo']);
      meta.accs.forEach(a => sa.appendRow([a.id, a.nome, a.emoji||'', a.tipo||'']));
    }

    // Mover para a pasta correta
    const file = DriveApp.getFileById(ss.getId());
    if (meta.folder && meta.folder.trim() !== '') {
      try {
        const folder = DriveApp.getFolderById(meta.folder.trim());
        folder.addFile(file);
        DriveApp.getRootFolder().removeFile(file);
      } catch(e) {
        // Pasta inválida — manter na raiz
      }
    }

    return ok({ok:true, url: ss.getUrl(), name: ss.getName()});
  } catch(err) {
    return ok({ok:false, error: err.toString()});
  }
}

function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── UPDATE ROW BY APP ID (v7.83) ─────────────────────────────
// Recebe ID e a linha completa (mesmo formato de addRows) e atualiza
// a linha exata na planilha. Mantém o ID na coluna 12.
function updateRowById(id, row) {
  if (!id || !row || !row.length) return ok({ok:false, error:'id/row obrigatórios'});
  const sh = getSheet();
  const last = sh.getLastRow();
  if (last <= 1) return ok({ok:false, error:'Planilha vazia'});
  const ids = sh.getRange(2, 12, last - 1, 1).getValues().flat().map(String);
  const idx = ids.indexOf(String(id));
  if (idx < 0) return ok({ok:false, error:'ID não encontrado'});
  const rowNum = idx + 2;
  // Garante que o ID continue na coluna 12
  if (row.length < 12) row[11] = id;
  sh.getRange(rowNum, 1, 1, row.length).setValues([row]);
  return ok({ok:true, row: rowNum});
}
