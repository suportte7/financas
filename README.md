# Finanças Pessoais — v7.84

## Changelog v7.84
- ✅ **Filtro Unificado v7.84**: o botão ☰ no cabeçalho agora abre o mesmo painel da página Transações (períodos rápidos + chips multi-select de Contas, Pagamentos, Cartões, Categorias e Subcategorias) em **Resumo, Calendário, Parcelamentos, Análise, Orçamento, Relatório, Grade de Dados** e Transações. Os gráficos e listas atualizam reativamente ao aplicar o filtro.
- ✅ **Edição Estrutural Completa (CRUD)**: editar, ativar e desativar Contas, Cartões, Pagamentos, Categorias e Subcategorias direto nas abas de configuração. O formulário pré-carrega os dados e o botão muda para "Atualizar Registro".
- ✅ **Sistema de Metas Multi-contas**: a meta de economia agora considera o somatório dos saldos das contas marcadas no Perfil (1 ou várias). O indicador visual reflete o progresso sobre essa soma.
- ✅ **Persistência de URL via Backup**: `scriptUrl` é salva no `localStorage` e incluída em `importar_bak.json`. Em novos dispositivos, basta importar para pular a tela de configuração inicial.
- ✅ **Hierarquia de lançamento**: Conta → Cartão → Função (se dual) → Categoria → Subcategoria.
- ✅ **Versão dinâmica**: `APP_VERSION = "7.84"` no `app.js` atualiza automaticamente o `<title>` e o rodapé.
- ✅ **Apps Script**: `updateRowById` localiza por ID único (col. 12) e aplica mudanças sem perder o histórico vinculado.

## Como usar
1. Abra Apps Script da sua planilha → cole `apps-script.gs` → Implantar como Web App (Acesso: Qualquer pessoa).
2. Cole a URL gerada em **Sync** ou importe um backup que já a contenha.
3. Lance despesas, filtre tudo pelo botão ☰ e edite/ative/desative qualquer cadastro pelos ícones ✏️ / 🔘.
