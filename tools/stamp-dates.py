#!/usr/bin/env python3
"""Даты «Обновлено» перед выкладкой. Запуск из корня репо: python3 tools/stamp-dates.py
Для каждой страницы из sitemap.xml дата = сегодня, если файл изменён относительно HEAD (рабочее дерево/индекс),
иначе — дата последнего коммита, менявшего файл (git log). Правит: видимую дату (data-freshness + <time>),
"dateModified" в JSON-LD страницы и <lastmod> в sitemap.xml. datePublished не трогает. Только локально, ничего не пушит."""
import re, subprocess, datetime, sys
B = 'https://seltikastudio.ru'
def sh(*a): return subprocess.run(a, capture_output=True, text=True).stdout.strip()
today = datetime.date.today().isoformat()
dirty = set(sh('git', 'diff', '--name-only', 'HEAD').split('\n')) | set(sh('git', 'ls-files', '--others', '--exclude-standard').split('\n'))
sm = open('sitemap.xml').read()
def file_for(loc):
    p = loc[len(B):].strip('/')
    return (p + '/index.html') if p else 'index.html'
def date_for(f):
    if f in dirty: return today
    d = sh('git', 'log', '-1', '--format=%cs', '--', f)
    return d or today
changed = []
def fix_url(m):
    block = m.group(0); loc = re.search(r'<loc>([^<]+)</loc>', block).group(1); f = file_for(loc)
    try: s = open(f).read()
    except FileNotFoundError: return block
    d = date_for(f); ru = f'{d[8:]}.{d[5:7]}.{d[:4]}'
    n = re.sub(r'data-freshness="\d{4}-\d\d-\d\d">Обновлено: <time datetime="\d{4}-\d\d-\d\d">[\d.]+</time>',
               f'data-freshness="{d}">Обновлено: <time datetime="{d}">{ru}</time>', s)
    n = re.sub(r'"dateModified":"\d{4}-\d\d-\d\d"', f'"dateModified":"{d}"', n)
    if n != s: open(f, 'w').write(n); changed.append(f'{f} -> {d}')
    return re.sub(r'<lastmod>[^<]*</lastmod>', f'<lastmod>{d}</lastmod>', block)
sm2 = re.sub(r'<url>.*?</url>', fix_url, sm, flags=re.S)
if sm2 != sm: open('sitemap.xml', 'w').write(sm2)
print('\n'.join(changed) or 'no page dates changed')
