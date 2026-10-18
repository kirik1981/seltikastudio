#!/usr/bin/env python3
"""Даты «Обновлено» перед выкладкой. Запуск из корня репо: python3 tools/stamp-dates.py [--dry]
Дата страницы = день последнего изменения её СОДЕРЖИМОГО:
  - если рабочая копия по содержимому отличается от HEAD → сегодня;
  - иначе — дата самого свежего коммита, где содержимое отличалось от родителя (git log --follow).
Технические правки не считаются (normalize): cache-bust ?v=N, блоки <header>/<footer> (общая навигация),
сами даты (data-freshness/<time>, dateModified), JSON-LD (общая разметка организации), скрипты, пробелы.
Правит: видимую дату, "dateModified" в JSON-LD и <lastmod> в sitemap.xml. datePublished не трогает. Ничего не пушит.
Дата не опускается ниже той, что стояла на странице до сегодняшнего дня (последний коммит до 00:00) —
так правки только JSON-LD/футера не «старят» страницу и не «молодят» её.
Ограничение: дата коммита (%cs), а не выкладки — запускать в день выкладки перед коммитом."""
import re, subprocess, datetime, sys
B = 'https://seltikastudio.ru'
DRY = '--dry' in sys.argv
def sh(*a): return subprocess.run(a, capture_output=True, text=True).stdout
def norm(s):
    s = re.sub(r'<script\b.*?</script>', '', s, flags=re.S)
    s = re.sub(r'<(header|footer)\b.*?</\1>', '', s, flags=re.S)
    s = re.sub(r'\?v=\d+', '', s)
    s = re.sub(r'data-freshness="[^"]*"', '', s)
    s = re.sub(r'<time datetime="[^"]*">[^<]*</time>', '', s)
    s = re.sub(r'"dateModified":"[^"]*"', '', s)
    return re.sub(r'\s+', ' ', s).strip()
def at(rev, f): return sh('git', 'show', f'{rev}:{f}')
today = datetime.date.today().isoformat()
def date_for(f):
    try: cur = open(f).read()
    except FileNotFoundError: return None
    head = at('HEAD', f)
    if not head or norm(cur) != norm(head): return today
    for line in sh('git', 'log', '--format=%H %cs', '--', f).split('\n'):
        if not line: continue
        h, d = line.split()
        if norm(at(h, f)) != norm(at(h + '^', f)): return d
    return today
def file_for(loc):
    p = loc[len(B):].strip('/')
    return (p + '/index.html') if p else 'index.html'
base = sh('git', 'rev-list', '-1', f'--before={today}T00:00', 'HEAD').strip()
def floor_for(f, loc):
    if not base: return ''
    old = at(base, f); ds = re.findall(r'data-freshness="(\d{4}-\d\d-\d\d)"|"dateModified":"(\d{4}-\d\d-\d\d)"', old)
    ds = [a or b for a, b in ds]
    if not ds:
        m = re.search(r'<loc>' + re.escape(loc) + r'</loc>\s*<lastmod>([^<]+)</lastmod>', at(base, 'sitemap.xml'))
        ds = [m.group(1)] if m else []
    return max(ds) if ds else ''
sm = open('sitemap.xml').read(); out = []
def fix_url(m):
    block = m.group(0); loc = re.search(r'<loc>([^<]+)</loc>', block).group(1); f = file_for(loc)
    d = date_for(f)
    if not d: return block
    d = max(d, floor_for(f, loc))
    s = open(f).read(); ru = f'{d[8:]}.{d[5:7]}.{d[:4]}'
    n = re.sub(r'data-freshness="\d{4}-\d\d-\d\d">Обновлено: <time datetime="\d{4}-\d\d-\d\d">[\d.]+</time>',
               f'data-freshness="{d}">Обновлено: <time datetime="{d}">{ru}</time>', s)
    n = re.sub(r'"dateModified":"\d{4}-\d\d-\d\d"', f'"dateModified":"{d}"', n)
    out.append(f'{f}: {d}' + (' (изменено)' if n != s else ''))
    if n != s and not DRY: open(f, 'w').write(n)
    return re.sub(r'<lastmod>[^<]*</lastmod>', f'<lastmod>{d}</lastmod>', block)
sm2 = re.sub(r'<url>.*?</url>', fix_url, sm, flags=re.S)
if sm2 != sm and not DRY: open('sitemap.xml', 'w').write(sm2)
print('\n'.join(out))
