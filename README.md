# 💰 Finanças Pessoais v1.8

*PWA de controle financeiro pessoal · sincronizado com Google Sheets*

---

## O que é

Aplicativo web progressivo (PWA) para controle de despesas pessoais. Funciona no celular como app instalado, sincroniza com uma planilha Google Sheets via Apps Script, e opera offline com cache local.

---

## Arquivos do projeto

| Arquivo | Função |
|---|---|
| `index.html` | Interface completa do app (UI, estilos) |
| `app.js` | Toda a lógica: dados, sync, render, navegação |
| `cfg-migrate.js` | Menu Contas & Categorias: operações e filtro drawer |
| `apps-script.gs` | Backend Google Apps Script (deploy no Google) |
| `config.js` | URL do Apps Script (configurar antes de usar) |
| `sw.js` | Service Worker para funcionamento offline |
| `manifest.json` | Manifesto PWA (ícone, nome, cores) |
| `build.sh` | **Único jeito de gerar ZIP** — sempre usar este |
| `bump_version.py` | Bump de versão + registro no changelog |
| `version.json` | Fonte única de verdade da versão e changelog |

---

## Como instalar

### 1. Configurar o Apps Script

1. Abrir [script.google.com](https://script.google.com) e criar novo projeto
2. Colar o conteúdo de `apps-script.gs`
3. Publicar como Web App:
   - Execute as: **Eu**
   - Acesso: **Qualquer pessoa**
4. Copiar a URL gerada (`https://script.google.com/macros/s/.../exec`)

### 2. Configurar o app

Editar `config.js` e colocar a URL do Apps Script:

```js
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID/exec';
```

### 3. Usar o app

Abrir `index.html` no navegador ou hospedar em qualquer servidor estático.

Na tela de Config → Sync, tocar em **Carregar da nuvem** para importar os dados da planilha.

---

## Regras do projeto

### Dados — regras permanentes

- **`_vivos(type)`** é a única função autorizada para iterar sobre cats/accs/carts/pags/subs em qualquer select, chip ou lista. Nunca usar os arrays diretamente.
- Arrays `cats`, `carts`, `accs` iniciam **vazios**. Dados vêm 100% da planilha.
- `localStorage` é cache. Ao carregar da nuvem, **sempre zerar** os arrays antes de aplicar.
- Com dados importados: só aparecem itens que têm despesas vinculadas.
- App sem dados: aparecem demos fictícios para orientar o usuário.

### Versionamento — regras permanentes

- **`build.sh`** é o único jeito de gerar ZIP. Nunca usar `zip` diretamente.
- `bump_version.py --changes "..."` é **obrigatório** antes de qualquer ZIP.
- Toda alteração de código deve ser documentada no `--changes`.

```bash
# Jeito correto de gerar uma nova versão:
bash build.sh --changes \
  "app.js: descrição do que mudou" \
  "cfg-migrate.js: descrição do que mudou"
```

---

## Estrutura de dados

Cada despesa (`desps[]`) tem os campos:

```js
{
  id, desc, data,      // identificação
  catId, subId,        // categoria e subcategoria
  pagId, cartId,       // pagamento e cartão
  accId,               // conta
  valor,               // valor em reais
  parcela, totalParcelas, // parcelamento
  obs, receipt,        // observação e comprovante
  ss,                  // status de sync ('s' = sincronizado)
  grupoId              // agrupa parcelas
}
```

As entidades (`cats`, `accs`, `carts`, `pags`, `subs`) são populadas exclusivamente a partir das colunas da planilha Google Sheets.

---

## Histórico de versões

### v1.8 — 2026-06-30
**Arquivos:** `app.js`, `cfg-migrate.js`
- app.js CORRECAO RAIZ: addDesp gerava datas de parcelas com 'new Date(data)' sem hora — em fuso negativo (Brasil, UTC-3) isso faz getMonth()/getDate() locais ficarem um dia ANTES do real. Provado com teste: parcela de despesa datada 01/07 gerava parcela 2 em 31/07 em vez de 01/08, empurrando a parcela pro mês errado e distorcendo o total mensal. Corrigido ancorando em 'T12:00:00' (meio-dia), mesmo padrão já usado nas recorrências
- app.js CORRECAO RAIZ: removido bloco morto de filtro global legado (per/openGlobalFilter/applyGlobalFilter/gfltFiltered) que inicializava window.GFLT ANTES do cfg-migrate.js, com nome de campo diferente ('per' em vez de 'modo'). Por causa do '||' na inicialização, a versão correta do cfg-migrate.js nunca chegava a aplicar — o app sempre rodava pelo caminho de cálculo 'customizado' em vez do caminho simples padrão, mesmo sem nenhum filtro ativo, desde a primeira renderização
- app.js: adicionado _dedupDesps() chamado em todo saveAll() — remove despesas duplicadas por ID antes de persistir, proteção defensiva contra duplicação por sync/import que também poderia inflar totais
- app.js: mantida _getActivePage() (usada por renderAll e cfg-migrate.js) ao limpar o bloco morto

### v1.7 — 2026-06-29
**Arquivos:** `app.js`, `cfg-migrate.js`, `index.html`
- index.html CORRECAO RAIZ scroll: na v1.7/1.8 foi inserido um </div> extra na linha 914 ao adicionar id='r-hl', fechando .hero prematuramente. Isso deslocou todos os elementos seguintes fora do .cnt (container de scroll), quebrando o scroll em TODAS as páginas do app em PC e celular
- index.html: estrutura HTML restaurada a partir da v1.6 — HTML balanceado com 434 abre/fecha divs. id='r-hl' adicionado corretamente sem nenhum div extra
- index.html: aba Drive removida de Config→Dados (agora 3 abas: Sync/Importar/CSV)
- index.html: card Backup Drive movido para dentro da aba Sync
- app.js: renderAll() re-renderiza a página visível além do Resumo — ações como salvar/editar/sync atualizam a tela aberta imediatamente sem precisar trocar de página
- app.js: nav transacoes não reseta o período quando GFLT já tem modo diferente de 'mes'
- cfg-migrate.js: _updateRHeroLabel() — label 'Total gasto no mês' agora dinâmico conforme período ativo (Todos os dados / Este mês / 7 dias / 30 dias / 90 dias / Este ano / Período selecionado)

### v1.6 — 2026-06-16
**Arquivos:** `app.js`, `index.html`
- app.js CORRECAO RAIZ: checkAutoBackup já existia e era chamada no boot, mas o threshold só tratava 'daily' vs qualquer-outra-coisa (sem distinguir weekly de monthly) — agora tem THRESHOLDS{daily,weekly,monthly} corretos com ~23h/6.5dias/28dias
- app.js backupToDrive: aceita parâmetro silent — quando chamado automaticamente pelo checkAutoBackup, não navega para a tela Drive nem mostra toast de erro se o usuário não estiver olhando, evitando navegação inesperada
- app.js checkAutoBackup: adicionados logs de diagnóstico no console mostrando frequência, último backup e threshold calculado — facilita verificar por que disparou ou não
- app.js saveDriveCfg: default trocado de 'weekly' para 'never' — não deve haver suposição de frequência sem o usuário escolher explicitamente
- app.js updateDriveStatus: título agora mostra a frequência configurada (Manual/Diário/Semanal/Mensal) e texto distingue 'nunca configurado' de 'configurado mas sem backup ainda'
- index.html: adicionada opção Mensal nos rádios de frequência de backup Drive — antes só existia Manual/Diário/Semanal
- index.html: nota explicativa informando que o backup automático roda sozinho ao abrir o app, sem precisar de ação manual nem URL adicional — usa a mesma URL do Apps Script já configurada em Sync

### v1.5 — 2026-06-16
**Arquivos:** `app.js`, `apps-script.gs`
- app.js: _parseData(raw) — trata qualquer formato de data que o Sheets retorne: ISO com T, Date serializado, DD/MM/YYYY, YYYY-MM-DD. Garante sempre YYYY-MM-DD internamente
- app.js: _parseValor(raw) — converte qualquer formato de valor para número: '1.234,56', '1,234.56', 'R$ 99,90', número puro
- app.js: _sanitizarDesps() — sanitiza datas e valores ruins nas despesas já salvas no localStorage. Chamada no boot
- app.js: fmtD corrigida — ignora timestamp ISO (T03:00:00.000Z) e extrai só YYYY-MM-DD para exibição
- app.js: loadDespsFromSheet usa _parseData e _parseValor — nunca mais importa data ISO ou valor string da planilha
- apps-script.gs: _numValor(), _parseDataGS(), _fmtDataGS() — funções auxiliares de normalização
- apps-script.gs: getRowsData normaliza todas as datas para YYYY-MM-DD e valores para número antes de retornar
- apps-script.gs: insertRows grava data como string YYYY-MM-DD e valor como número com formato #,##0.00
- apps-script.gs: fixValoresNaPlanilha() — corrige todos os valores e datas ruins já existentes na planilha. Chamar uma vez via GET ?action=fixValores

### v1.4 — 2026-06-15
**Arquivos:** `index.html`
- index.html: CORREÇÃO RAIZ — adicionado CSS faltante para .parc-card, .parc-hdr, .parc-cat-icon, .parc-hdr-info/name/sub/right/total/remain, .parc-chevron-icon e .parc-detail. Essas classes são geradas pelo renderParcs() redesenhado mas nunca tiveram estilo definido
- index.html: .parc-chevron-icon (SVG sem width/height) renderizava no tamanho padrão do navegador (300x150px) — essa era a 'figura grande' tomando a tela em Parcelamentos. Agora fixado em 16x16px
- index.html: .parc-hdr agora tem display:flex — sem isso os elementos (ícone, info, total, svg, botão) empilhavam como blocos de largura total
- index.html: .parc-detail agora colapsa por padrão (display:none) e expande via .parc-card.expanded — antes ficava sempre visível para todos os grupos
- index.html: adicionado @media(max-width:380px) para cards de parcelamento em telas pequenas

### v1.3 — 2026-06-13
**Arquivos:** `app.js`, `index.html`
- app.js showReceipt: imagem do comprovante limitada a max-height:55vh e max-width:100% com object-fit:contain — não toma mais a tela toda
- app.js renderCal: células do calendário recebem data-date para acesso correto. Dots de parcelas futuras com opacidade reduzida e borda para distinguir. Total do dia embutido na célula
- app.js renderCalDetail: transações futuras (parcelas) aparecem no detalhe do dia separadas com label 'Parcelas futuras'
- app.js renderCalPlus: removida duplicação do valor por dia — já embutido no renderCal. Filtros de acc/cat atualizam corretamente
- index.html: CSS calendário otimizado para mobile — células menores, @media 380px com fontes reduzidas, cal-day-val definido centralmente

### v1.2 — 2026-06-11
**Arquivos:** `app.js`
- app.js autoLoadOnOpen: dispositivo novo carrega AUTOMATICAMENTE sem modal bloqueante — exibe banner de progresso não-bloqueante. Modal era o motivo principal de não carregar no celular
- app.js autoLoadOnOpen: após load chama populateForm() e populateFlt() explicitamente para garantir filtros preenchidos
- app.js loadAllFromCloud: NÃO aborta mais quando AppData está vazio — continua para loadDespsFromSheet que reconstrói tudo das colunas da planilha. Era o segundo motivo de tela vazia
- app.js loadAllFromCloud: sempre chama populateForm() e populateFlt() após load para garantir selects preenchidos em qualquer dispositivo
- app.js loadDespsFromSheet: após importar, chama populateForm/populateFlt/populateRSels/populateAssinSelects/_populateCartAccSel para atualizar toda a UI

### v1.1 — 2026-06-11
**Arquivos:** `app.js`, `index.html`
- app.js onCart: cartão é completamente independente — não força conta, não força nada. Apenas sugere o tipo de pagamento (crédito/débito) conforme tipoUso do cartão
- app.js onPag: removida lógica que escondia/mostrava campo cartão baseado no pagamento. Cartão sempre visível e opcional
- app.js addDesp: removida obrigatoriedade de cartId e accId. Campos opcionais — mesma estrutura da planilha onde Cartão e Conta são colunas independentes
- index.html: formulário de lançamento reordenado — Pagamento primeiro (obrigatório *), depois Cartão e Conta lado a lado (ambos opcionais)

### v1.0 — 2026-06-10

Lançamento oficial. App consolidado com todas as correções de dados aplicadas.

- `_vivos(type)` — fonte única de verdade para exibição de entidades
- `loadDespsFromSheet` — reconstrói entidades a partir das colunas da planilha
- `loadAllFromCloud` — zera arrays antes de aplicar dados da nuvem
- `_limparDefaultsLegados()` — remove legados sem uso no boot e no sync
- `renderMetaAccs` — filtra estritamente por contas reais, limpa metaAccs inválidos
- Menu Contas & Categorias com conversões livres entre tipos
- Filtro lateral drawer com períodos e chips
