---
name: studio-design-to-motion
description: Адаптация design-to-motion под SELTIKA STUDIO. Pixel-exact анимация статичного дизайна (карточки, матрицы, графики, hero) в seamless loop. Для промо, сайта, X. Сохраняет светлый editorial и токены бренда.
---

# Design to Motion — Studio Edition

Не redesign. Exact frame → empty state → smooth load → каждый элемент проигрывает свою историю → seamless loop.

## Brand Constraints
- Белый / light фон. Акценты только cyan #22B8FF, orange #FF8A24, steel #2F4A5C.
- Manrope / IBM Plex Mono.
- Никаких тёмных фонов и ярких SaaS-эффектов.
- Hairline-карточки, чистые SVG-графики.

## Core Rules (сокращённо из оригинала)
- Layout: app frame (static surfaces) или separate cards.
- Empty start. Rise + blur to sharp, staggered.
- Stories: charts animate, lists receive items, numbers count, text types — start and end on exact design.
- Cycle ~12s for showcase (build 0–2.4s, stories, dissolve).
- Export: MP4 60fps CRF 14–15, loop GIF 960px, always 800×500 GIF.
- Animate only transform, opacity, filter, clip-path. Respect reduced motion.

## Studio Use Cases
- Матрицы движков × запросов
- Графики видимости (до/после)
- Карточки пакетов
- Hero с логотипом / слоганом

Полные параметры (rise distances, easing --e / --e2 / --io, stagger, ffmpeg recipes) — в оригинальном design-to-motion skill. Здесь только бренд-ограничения и приоритеты.

Используй для анимации готовых макетов Studio. Не меняй реальные данные и не выдумывай метрики.
