---
version: alpha
name: "SELTIKA STUDIO"
description: "GEO/AEO-агентство, которое проверяет, называют ли вашу компанию ChatGPT, Алиса, Perplexity, GigaChat, Gemini, Grok, Claude и DeepSeek, и правит сайт и внешние источники."
colors:
  night: "#070A0F"
  card: "#101722"
  panel: "#161E2B"
  cloud: "#F2F5F7"
  blue: "#22B8FF"
  orange: "#FF8A24"
  slate: "#8C98A8"
  background: "{colors.night}"
  text: "{colors.cloud}"
  accent: "{colors.blue}"
  surface: "{colors.card}"
  muted: "{colors.slate}"
typography:
  display:
    fontFamily: Onest
    fontWeight: 700
  body:
    fontFamily: Manrope
    fontWeight: 400
rounded:
  md: 4px
  button: 8px
spacing:
  page: 1024px
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.night}"
    rounded: "{rounded.button}"
    height: 36px
    padding: 0 16px
---

## Overview

SELTIKA STUDIO: GEO/AEO-агентство, которое проверяет, называют ли вашу компанию ChatGPT, Алиса, Perplexity, GigaChat, Gemini, Grok, Claude и DeepSeek, и правит сайт и внешние источники.

Тёмный, технический фон с холодным голубым акцентом и редким оранжевым для сигналов. Тексты спокойные и точные, с числами, шагами и чёткими границами того, что студия делает и чего не обещает. Заголовки в Onest, текст в Manrope, цифры и метки в IBM Plex Mono.

Voice and logo use are in BRAND.md, with the files in assets/.

## Colors

- **night** `#070A0F`, the background
- **card** `#101722`, cards and panels
- **panel** `#161E2B`
- **cloud** `#F2F5F7`, text
- **blue** `#22B8FF`, the accent
- **orange** `#FF8A24`
- **slate** `#8C98A8`, quiet text

## Typography

- **Display:** Onest 700, for headlines.
- **Body:** Manrope 400, for everything else.

- Onest is free on Google Fonts: https://fonts.google.com/specimen/Onest
- Manrope is free on Google Fonts: https://fonts.google.com/specimen/Manrope

## Layout

- Corners: 4px on cards and panels.
- Buttons: 8px corners, 36px tall, 16px either side of the label, filled with blue.
- Pages: content width 1024px.
