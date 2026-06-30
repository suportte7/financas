#!/usr/bin/env python3
"""
bump_version.py — Finanças v2
==============================
Fonte única de verdade para versão do projeto.
OBRIGATÓRIO executar antes de gerar qualquer ZIP ou publicar qualquer mudança.

USO:
  python3 bump_version.py --changes "descrição 1" "descrição 2" ...
  python3 bump_version.py --set 2.6 --changes "descrição 1" "descrição 2" ...

REGRAS (aplicadas automaticamente):
  1. --changes é OBRIGATÓRIO — sem ele o script aborta com erro
  2. Cada mudança deve descrever QUE arquivo foi alterado e O QUE mudou
  3. version.json é atualizado com data de hoje e lista de mudanças
  4. A versão é propagada para: app.js, index.html, apps-script.gs,
     manifest.json, sw.js, config.js, README.md
  5. README.md recebe entrada nova no histórico automaticamente
"""

import json, re, sys, os
from datetime import date

DIR = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(DIR, path), encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(os.path.join(DIR, path), 'w', encoding='utf-8') as f:
        f.write(content)

def bump(v):
    parts = v.split('.')
    parts[-1] = str(int(parts[-1]) + 1)
    return '.'.join(parts)

def detect_files(changes):
    """Detecta quais arquivos foram mencionados nas mudanças."""
    known = ['app.js','cfg-migrate.js','index.html','apps-script.gs',
             'sw.js','manifest.json','config.js','bump_version.py','build.sh']
    found = set()
    text = ' '.join(changes).lower()
    for f in known:
        if f.replace('.','').replace('-','') in text.replace('.','').replace('-',''):
            found.add(f)
    return sorted(found) if found else ['app.js']

def build_readme_entry(ver, today, changes, files):
    lines = [f'### v{ver} — {today}']
    if files:
        lines.append(f'**Arquivos:** `{"`, `".join(files)}`')
    for c in changes:
        lines.append(f'- {c}')
    return '\n'.join(lines)

def main():
    # ── Verificar consistência: versão nos arquivos == version.json ──
    vf_check = json.load(open(os.path.join(DIR, 'version.json'), encoding='utf-8'))
    cur_ver = vf_check['version']
    try:
        js_check = open(os.path.join(DIR, 'app.js'), encoding='utf-8').read()
        m = re.search(r"VERSAO_ATUAL\s*=\s*'([\d.]+)'", js_check)
        js_ver = m.group(1) if m else None
        if js_ver and js_ver != cur_ver:
            print(f'\n⚠️  ATENÇÃO: app.js está em v{js_ver} mas version.json diz v{cur_ver}.')
            print('   Isso indica que alguém editou o código sem passar pelo build.sh.')
            print('   O bump vai corrigir automaticamente. Continuando...\n')
    except Exception:
        pass

    # ── Validação: --changes é obrigatório ───────────────────────
    if '--changes' not in sys.argv:
        print('\n❌ ERRO: --changes é obrigatório.')
        print('   Toda alteração DEVE ser documentada antes de gerar o ZIP.')
        print('\n   Uso:')
        print('   python3 bump_version.py --changes "app.js: descrição da mudança" ...')
        print('\n   Exemplo:')
        print('   python3 bump_version.py --changes \\')
        print('     "app.js: corrigido loadDespsFromSheet para ler colunas da planilha" \\')
        print('     "cfg-migrate.js: adicionado botão ⚙ com conversão entre tipos"')
        sys.exit(1)

    idx = sys.argv.index('--changes')
    changes = sys.argv[idx + 1:]
    if not changes:
        print('\n❌ ERRO: --changes precisa de pelo menos uma descrição.')
        sys.exit(1)

    # ── Ler versão atual ─────────────────────────────────────────
    vf = json.load(open(os.path.join(DIR, 'version.json'), encoding='utf-8'))
    old_ver = vf['version']

    # ── Determinar nova versão ───────────────────────────────────
    if '--set' in sys.argv:
        idx_s = sys.argv.index('--set')
        new_ver = sys.argv[idx_s + 1]
    else:
        new_ver = bump(old_ver)

    today = date.today().isoformat()
    files = detect_files(changes)

    print(f'\n📦 Versão: {old_ver} → {new_ver}  ({today})')
    print(f'   Arquivos detectados: {", ".join(files)}')
    print(f'   Mudanças: {len(changes)}')
    for c in changes:
        print(f'   · {c}')
    print()

    # ── 1. version.json ──────────────────────────────────────────
    vf['version'] = new_ver
    vf['date'] = today
    # Evitar entrada duplicada
    if not vf['changelog'] or vf['changelog'][0]['version'] != new_ver:
        vf['changelog'].insert(0, {
            'version': new_ver,
            'date': today,
            'files': files,
            'changes': changes
        })
    else:
        # Versão já existe — acumular mudanças
        vf['changelog'][0]['changes'].extend(changes)
        vf['changelog'][0]['files'] = sorted(set(vf['changelog'][0]['files'] + files))
        vf['changelog'][0]['date'] = today
    write('version.json', json.dumps(vf, ensure_ascii=False, indent=2))
    print('  ✅ version.json')

    # ── 2. app.js ────────────────────────────────────────────────
    js = read('app.js')
    js = re.sub(r"APP_VER\s*=\s*'V[\d.]+'", f"APP_VER = 'V{new_ver}'", js)
    js = re.sub(r"VERSAO_ATUAL\s*=\s*'[\d.]+'", f"VERSAO_ATUAL = '{new_ver}'", js)
    js = re.sub(r"APP_VERSION\s*=\s*'[\d.]+'", f"APP_VERSION = '{new_ver}'", js)
    write('app.js', js)
    print('  ✅ app.js')

    # ── 3. index.html ────────────────────────────────────────────
    html = read('index.html')
    html = re.sub(r'Finanças Pessoais v[\d.]+', f'Finanças Pessoais v{new_ver}', html)
    html = re.sub(r'(color:var\(--txt3\)\">)[Vv][\d.]+(<)', rf'\g<1>v{new_ver}\g<2>', html)
    write('index.html', html)
    print('  ✅ index.html')

    # ── 4. apps-script.gs ────────────────────────────────────────
    gs = read('apps-script.gs')
    gs = re.sub(r"v:'[\d.]+'", f"v:'{new_ver}'", gs)
    gs = re.sub(r"v: '[\d.]+'", f"v: '{new_ver}'", gs)
    gs = re.sub(r"Finanças v[\d.]+", f"Finanças v{new_ver}", gs)
    gs = re.sub(r"FINANÇAS PESSOAIS v[\d.]+", f"FINANÇAS PESSOAIS v{new_ver}", gs)
    write('apps-script.gs', gs)
    print('  ✅ apps-script.gs')

    # ── 5. manifest.json ─────────────────────────────────────────
    mf = json.load(open(os.path.join(DIR, 'manifest.json'), encoding='utf-8'))
    mf['version'] = new_ver + '.0'
    mf['description'] = f'Finanças Pessoais v{new_ver}'
    write('manifest.json', json.dumps(mf, ensure_ascii=False, indent=2))
    print('  ✅ manifest.json')

    # ── 6. sw.js ─────────────────────────────────────────────────
    sw = read('sw.js')
    sw = re.sub(r"const CACHE='fin-v[\w.]+'", f"const CACHE='fin-v{new_ver.replace('.','_')}'", sw)
    write('sw.js', sw)
    print('  ✅ sw.js')

    # ── 7. config.js ─────────────────────────────────────────────
    cfg = read('config.js')
    cfg = re.sub(r"FINANÇAS PESSOAIS v[\d.]+ —", f"FINANÇAS PESSOAIS v{new_ver} —", cfg)
    write('config.js', cfg)
    print('  ✅ config.js')

    # ── 8. README.md — atualizar título + inserir no histórico ───
    readme = read('README.md')
    readme = re.sub(r'# 💰 Finanças Pessoais v[\d.]+', f'# 💰 Finanças Pessoais v{new_ver}', readme)
    readme = re.sub(r'\*Desenvolvido para uso pessoal · .*\*', f'*Desenvolvido para uso pessoal · atualizado {today}*', readme)

    # Inserir entrada no histórico se ainda não existe
    marker = '## Histórico de versões\n'
    entry = build_readme_entry(new_ver, today, changes, files)
    if f'### v{new_ver}' not in readme and marker in readme:
        readme = readme.replace(marker, marker + '\n' + entry + '\n', 1)
    elif f'### v{new_ver}' in readme:
        # Substituir entrada existente
        readme = re.sub(
            rf'### v{re.escape(new_ver)} — .*?(?=### v|\Z)',
            entry + '\n\n',
            readme, flags=re.DOTALL
        )
    write('README.md', readme)
    print('  ✅ README.md')

    print(f'\n🎉 v{new_ver} registrada com sucesso!')
    print(f'   Próximo passo: python3 build.sh  (ou  bash build.sh)')
    return new_ver

if __name__ == '__main__':
    main()
