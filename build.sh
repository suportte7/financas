#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# build.sh — ÚNICO jeito válido de gerar o ZIP do projeto
#
# REGRA ABSOLUTA: nunca usar `zip` diretamente. Sempre este script.
# Ele garante bump de versão + documentação + ZIP com nome correto.
#
# USO:
#   bash build.sh --changes "arquivo: o que mudou"
#   bash build.sh --set 2.7 --changes "arquivo: o que mudou"
#
# EXEMPLOS:
#   bash build.sh --changes \
#     "app.js: corrigido loadDespsFromSheet" \
#     "cfg-migrate.js: adicionado opsConvert"
# ─────────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ── 1. Bump obrigatório (aborta se --changes omitido) ─────────────
python3 bump_version.py "$@"

# ── 2. Ler versão gerada ──────────────────────────────────────────
VER=$(python3 -c "import json; print(json.load(open('version.json'))['version'])")
ZIP_NAME="financas-v${VER//./_}.zip"
OUT_DIR="$(dirname "$DIR")"
ZIP_PATH="$OUT_DIR/$ZIP_NAME"

# ── 3. Remover ZIP anterior da mesma versão se existir ───────────
rm -f "$ZIP_PATH"

# ── 4. Gerar ZIP ──────────────────────────────────────────────────
echo ""
echo "📦 Gerando $ZIP_NAME..."
cd "$OUT_DIR"
zip -r "$ZIP_NAME" "$(basename "$DIR")/" \
  -x "$(basename "$DIR")/*.bak*"              \
  -x "$(basename "$DIR")/__pycache__/*"       \
  -x "$(basename "$DIR")/.git/*"              \
  -x "$(basename "$DIR")/.cache/*"            \
  -x "$(basename "$DIR")/importar_bak.json"   \
  -x "*/__MACOSX/*"                           \
  -x "*/.DS_Store"                            \
  -q

SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "✅ $ZIP_NAME gerado ($SIZE)"
echo ""

# ── 5. Imprimir resumo ────────────────────────────────────────────
python3 - << PYEOF
import json
vf = json.load(open('$(basename "$DIR")/version.json'))
e = vf['changelog'][0]
print(f"📋 v{e['version']} · {e['date']}")
print(f"   Arquivos: {', '.join(e.get('files', []))}")
for c in e['changes']:
    print(f"   · {c[:90]}{'...' if len(c)>90 else ''}")
PYEOF
