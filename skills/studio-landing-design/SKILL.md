---
name: studio-landing-design
description: Адаптированная система для лендингов и маркетинговых страниц SELTIKA STUDIO (GEO/AEO). Строгий светлый editorial-стиль, белый фон, акценты cyan/orange/steel, Manrope + IBM Plex Mono. Конверсионная структура + правила против AI-слопа. Используй при создании/правке страниц сайта, одностраничников для клиентов, КП-визуала.
---

# SELTIKA STUDIO — Landing / Page Design System

Светлый editorial. Белый фон — канон. Никакого тёмного фона на клиентских материалах Studio, если Кирилл явно не попросил.

## Brand Tokens
- Background: #FFFFFF only (канон 2026-09-06)
- Text / Ink: #1C1B19
- Steel: #2F4A5C
- Accent cyan: #22B8FF
- Accent orange: #FF8A24
- Hairline: #D8D2C8 or lighter
- Fonts: Manrope (основной), IBM Plex Mono (цифры, код, подписи). Никаких Inter, Roboto, Arial, Open Sans.
- Никаких фоновых градиентов. Текст может иметь лёгкий gradient только в hero (белый → серый), если уместно.
- Nested radius: inner = outer − gap.

## Structure (обязательно)
1. Above the fold: чёткий outcome + для кого + primary CTA + один proof.
2. Mid: проблема → решение, 3–5 benefits (bold benefit + detail), how it works (3 шага), social proof / матрица видимости.
3. Bottom: FAQ (из реальных вопросов), risk reversal, final CTA (тот же, что сверху).
4. Tagline-reveal секция (крупный текст, words fade in on scroll).

## Conversion
- Один primary CTA. Verb + benefit.
- Benefit-first, конкретика.
- Не выдумывать цифры, кейсы, проценты из исследований.
- Сравнение = 2 карточки (SEO/агентства vs мы).
- Кабинет ~1900₽ не упоминать.

## Motion & States
- Easing: cubic-bezier(0.22,1,0.36,1) или близкий.
- Animate only transform + opacity.
- Scroll reveals: rise 32px + fade, IntersectionObserver.
- Все interactive: hover, active, focus, loading, empty, error.
- prefers-reduced-motion уважать.

## Ship
- Семантический HTML, alt на картинках, meta + og, favicon.
- Footer: privacy + terms.
- Real copy, sentence case, no filler words ("revolutionize", "supercharge").

Используй вместе с каноном FACTS.md и правилами дизайнера. При конфликте — канон Кирилла побеждает.
