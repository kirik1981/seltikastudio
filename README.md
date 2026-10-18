# seltikastudio.ru (GitHub Pages, ветка gh-pages)

## Перед каждым пушем
1. `python3 tools/stamp-dates.py` — проставляет «Обновлено», `dateModified` (JSON-LD) и `<lastmod>` (sitemap.xml)
   по каждой странице: сегодня, если страница изменена в этом коммите, иначе дата её последнего коммита.
2. `git add -A && git commit` → `git push origin gh-pages` (только fast-forward, без force) — по «да» Кирилла.
3. Новая страница — сначала добавить её `<loc>` в sitemap.xml, потом запустить скрипт.

## Новости (/novosti/)
- Пишем ЧТО изменилось и польза для клиента. НЕ пишем КАК: без приёмов, настроек, названий файлов
  (robots, llms, JSON-LD и т. п.), промптов, маршрутов/провайдеров, списков вопросов.
- Каждую новость дублируем коротким постом в Telegram-канале @seltikastudio со ссылкой на страницу новости (публикация — по «да» Кирилла).
- Новая новость: страница /novosti/<slug>/ (BlogPosting, автор #founder), карточка в /novosti/ и в Blog.blogPost JSON-LD, строки в sitemap.xml и llms.txt (+ .well-known/llms.txt, llms-full.txt).
