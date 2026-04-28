# 💰 Finanças Pessoais v7.8

PWA de controle de despesas — offline, celular e PC.

---

## Versões

| Versão | O que mudou |
|--------|-------------|
| **v7.8** | Config unificada (Contas/Cartões/Pags/Cats em uma tela), Sync+Importar em uma tela, filtros multi-select em Transações, ativo/inativo por conta e cartão |
| v7.7 | Freeze celular corrigido, selects de lançar funcionando, meta de contas |
| v7.6 | Scroll ao trocar página, 6 temas novos, openSheetDirect corrigido |
| v7.5 | Sync lotes de 50, dividir parcelas, datagrid colunas configuráveis, parseMoeda |
| v7.4 | Migração de dados, calendário com totais, orçamento por conta/cartão/cat |
| v7.3 | Ícones PWA, favicon, boot corrigido |
| v7.2 | Importação .bak/.xlsx, meta de gastos, backup Drive |
| v7.1 | Assinaturas e recorrências |
| v7.0 | Perfil unificado, Planilha/Sync redesenhada, Relatório |

---

## Instalação (GitHub Pages)

1. Edite `config.js` — cole sua URL do Apps Script
2. Suba todos os arquivos no GitHub
3. **Settings → Pages → Branch: main → Save**
4. Celular: **⋮ → Adicionar à tela inicial**

---

## config.js — configurar uma vez só

```js
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/SEU_ID/exec';
```

Todos os dispositivos herdam essa URL. No 2º dispositivo o app detecta que está vazio e pergunta: **"Carregar dados da nuvem? Sim / Não"**.

---

## Menu do app

| Item | O que é |
|------|---------|
| **Resumo** | Visão geral do mês |
| **Lançar** | Nova despesa |
| **Transações** | Lista com filtros multi-select |
| **Calendário** | Despesas por dia |
| **Parcelamentos** | Parcelas e assinaturas |
| **Orçamento** | Metas por cat/conta/cartão |
| **Relatório** | Relatório exportável |
| **Grade de dados** | Tabela editável |
| **Configurações** | Contas, Cartões, Pagamentos, Categorias |
| **Sync & Importação** | Sync, Importar, Drive, CSV |
| **Perfil** | Dados pessoais, temas, PIN, meta mensal |

---

## Configurações (Contas, Cartões, Pagamentos, Categorias)

Tudo em uma tela com abas. Hierarquia correta:
- **Conta** é independente
- **Cartão** precisa de conta vinculada
- **Pagamento** é independente (Pix, Dinheiro) ou vinculado (Débito/Crédito)
- **Subcategoria** precisa de categoria pai

Cada conta e cartão tem **toggle ativo/inativo** — ao desativar, some dos selects de lançamento sem apagar os dados históricos.

---

## Filtros de Transações (multi-select)

Toque em **⊟** para abrir os filtros. Marque **uma ou mais** opções em cada grupo:
- Contas → Pagamentos → Cartões → Categorias → Subcategorias

Para limpar, toque em **Limpar tudo**.

---

## Sync Google Sheets

1. Planilha → **Extensões → Apps Script** → cole `apps-script.gs`
2. **Implantar → App da Web → Qualquer pessoa → Implantar**
3. Cole a URL no `config.js`

### Atualizar script
**Implantar → Gerenciar → ✏️ Editar → Nova versão → Implantar**

---

## Importar dados (.bak do app antigo)

O `importar_bak.json` já vem no zip (1.802 despesas 2025–2026).

**Sync & Importação → Importar → JSON → selecionar o arquivo → Confirmar**

Após importar, use a aba **Migração** para ajustar:
- Subcategorias → Cartões ou Contas
- Categorias pai → Contas

---

## Backup Drive

**Sync & Importação → Drive** — precisa do Apps Script configurado.  
Frequência: Manual / Diário / Semanal.

---

## Temas (11)
🌙 Escuro · ☀️ Claro · 🌊 Oceano · 🌿 Floresta · 🌅 Pôr do sol · 🌆 Crepúsculo · 🩶 Ardósia · ☕ Café · 🌸 Lavanda · 🍃 Menta · 🏖 Areia

---

## PIN padrão: **8888** — altere em Perfil → Segurança

## Compatibilidade
Android Chrome ✅ · iPhone Safari ✅ · PC Chrome/Edge ✅ · Firefox ✅
