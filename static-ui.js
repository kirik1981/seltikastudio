/*! static-ui.js v3 — vanilla helpers after SPA hydration is disabled: menu, forms, motion */
(function () {
  function getNavLinks() {
    var desktop = document.querySelector('nav[aria-label="Основное"]');
    var links = [];
    if (desktop) {
      desktop.querySelectorAll('a[href]').forEach(function (a) {
        links.push({ href: a.getAttribute('href'), text: (a.textContent || '').trim() });
      });
    }
    if (!links.length) {
      links = [
        { href: '/#scanner', text: 'Проверка' },
        { href: '/#work', text: 'Как работаем' },
        { href: '/geo/', text: 'GEO' },
        { href: '/#pricing', text: 'Стоимость' },
        { href: '/ai-visibility/', text: 'AI-видимость' },
        { href: '/geo-aeo-agentstvo-rossiya/', text: 'GEO/AEO РФ' },
        { href: '/studio/', text: 'О студии' },
        { href: '/faq/', text: 'FAQ' }
      ];
    }
    // CTA duplicates often sit next to the toggle — add lead if present in header
    var header = document.querySelector('header');
    if (header) {
      header.querySelectorAll('a[href*="#scanner"], a[href*="#lead"]').forEach(function (a) {
        var href = a.getAttribute('href');
        var text = (a.textContent || '').trim();
        if (!text) return;
        if (!links.some(function (l) { return l.href === href && l.text === text; })) {
          links.push({ href: href, text: text });
        }
      });
    }
    return links;
  }

  function ensurePanel(btn) {
    var panel = document.getElementById('mobile-nav');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'mobile-nav';
    panel.className = 'border-t border-border bg-background px-5 py-5 lg:hidden';
    panel.hidden = true;
    var nav = document.createElement('nav');
    nav.className = 'flex flex-col gap-1';
    nav.setAttribute('aria-label', 'Мобильное меню');
    getNavLinks().forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.className = 'rounded-md px-3 py-3 text-base text-foreground hover:bg-muted/40';
      a.textContent = l.text;
      a.addEventListener('click', function () { closeMenu(btn, panel); });
      nav.appendChild(a);
    });
    panel.appendChild(nav);
    var header = btn.closest('header') || document.body;
    header.appendChild(panel);
    return panel;
  }

  function openMenu(btn, panel) {
    panel.hidden = false;
    document.body.style.overflow = 'hidden';
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Закрыть меню');
  }
  function closeMenu(btn, panel) {
    panel.hidden = true;
    document.body.style.overflow = '';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Открыть меню');
  }

  function initMenu() {
    var btn = document.querySelector('button[aria-controls="mobile-nav"]');
    if (!btn) return;
    var panel = ensurePanel(btn);
    closeMenu(btn, panel);
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-expanded') === 'true') closeMenu(btn, panel);
      else openMenu(btn, panel);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { closeMenu(btn, panel); btn.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && btn.getAttribute('aria-expanded') === 'true') closeMenu(btn, panel);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMenu);
  else initMenu();
})();

/* Forms without React: scanner (local hypothesis) + lead (POST to n8n via form-bridge). */
(function () {
  var LABELS = { weak: 'Слабая видимость', emerging: 'Появляется точечно', visible: 'Уже заметен', strong: 'Устойчивое присутствие' };
  var STATUS = { likely: 'вероятно', possible: 'возможно', unlikely: 'маловероятно' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function data(form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = String(v); }); return o; }
  function box(form, cls) {
    var el = form.querySelector('[data-static-msg]');
    if (!el) { el = document.createElement('div'); el.setAttribute('data-static-msg', ''); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); form.appendChild(el); }
    el.className = 'mt-4 text-sm leading-relaxed ' + (cls || '');
    return el;
  }
  function busy(form, on, text) {
    var b = form.querySelector('button[type="submit"]'); if (!b) return;
    if (on) { b.dataset.label = b.innerHTML; b.disabled = true; b.textContent = text; }
    else if (b.dataset.label) { b.disabled = false; b.innerHTML = b.dataset.label; }
  }
  function onScan(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = data(form);
      if (!d.site.trim() && !d.brand.trim()) { box(form, 'text-red-400').textContent = 'Укажите сайт или название бренда'; return; }
      if (!window.__seltikaSiteScan) { box(form, 'text-red-400').textContent = 'Проверка временно недоступна.'; return; }
      busy(form, true, 'Проверяем…');
      window.__seltikaSiteScan(d).then(function (res) {
        busy(form, false);
        if (!res || !res.ok) { box(form, 'text-red-400').textContent = (res && res.error) || 'Не удалось выполнить проверку.'; return; }
        var r = res.result, h = '';
        var C = 2 * Math.PI * 28, sc = Math.max(0, Math.min(100, Number(r.score) || 0));
        h += '<div class="flex items-center gap-4"><div class="relative size-16 shrink-0" aria-label="Индекс ' + sc + ' из 100">' +
          '<svg viewBox="0 0 64 64" class="score-ring size-16" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="none" stroke="rgb(255 255 255 / 0.08)" stroke-width="4"></circle>' +
          '<circle data-ring="' + sc + '" cx="32" cy="32" r="28" fill="none" stroke="#22B8FF" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '" style="transition:stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)"></circle></svg>' +
          '<span class="absolute inset-0 flex items-center justify-center font-display text-sm tabular-nums">' + sc + '</span></div>';
        h += '<p class="font-display text-xl">' + esc(LABELS[r.verdict] || r.verdict) + ' · ' + esc(r.score) + '/100</p></div>';
        h += '<p class="mt-2 text-muted">' + esc(r.summary) + '</p><ul class="mt-3 space-y-1">';
        (r.systems || []).forEach(function (s) { h += '<li>' + esc(s.name) + ': ' + esc(STATUS[s.status] || s.status) + ' (' + esc(s.likelihood) + '%) — ' + esc(s.note) + '</li>'; });
        h += '</ul>';
        if (r.priorityQueries && r.priorityQueries.length) h += '<p class="mt-3">Контрольные запросы: ' + r.priorityQueries.map(esc).join('; ') + '</p>';
        h += '<p class="mt-3 text-xs text-muted">' + esc(r.disclaimer) + '</p>';
        h += '<p class="mt-3"><a class="text-primary hover:underline" href="/#lead">Заказать AI-аудит →</a></p>';
        var out = box(form, ''); out.innerHTML = h;
        var ring = out.querySelector('[data-ring]');
        if (ring) requestAnimationFrame(function () { requestAnimationFrame(function () { ring.setAttribute('stroke-dashoffset', (C - sc / 100 * C).toFixed(2)); }); });
      });
    });
  }
  function onLead(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = data(form);
      if (!d.plan) { var m = /[?&]plan=([^&]+)/.exec(location.hash); if (m) d.plan = decodeURIComponent(m[1]); }
      if (!window.__seltikaSiteLead) { box(form, 'text-red-400').textContent = 'Напишите на hello@seltikastudio.ru или позвоните +7 903 343-40-07.'; return; }
      busy(form, true, 'Отправляем…');
      window.__seltikaSiteLead(d).then(function (res) {
        busy(form, false);
        if (res && res.ok) {
          form.innerHTML = '<p class="font-display text-xl" tabindex="-1">Заявка принята</p>' +
            '<p class="mt-3 text-sm leading-relaxed text-muted">Ответим в течение рабочего дня: уточним задачу и предложим, с чего начать — аудит, настройку или продвижение.</p>' +
            '<p class="mt-4 text-sm"><a class="text-primary hover:underline" href="tel:+79033434007">+7 903 343-40-07</a> · <a class="text-primary hover:underline" href="mailto:hello@seltikastudio.ru">hello@seltikastudio.ru</a></p>';
          var p = form.querySelector('p'); if (p) p.focus();
        } else {
          box(form, 'text-red-400').textContent = (res && res.error) || 'Не удалось отправить.';
        }
      });
    });
  }
  function init() {
    document.querySelectorAll('form').forEach(function (f) {
      if (f.querySelector('#scan-site,[name="service"]') && !f.querySelector('[name="contact"]')) onScan(f);
      else if (f.querySelector('[name="contact"]')) onLead(f);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Motion without React: scroll reveal, sticky header state + progress bar, hero engine switcher with typing demo,
   pointer spotlight / logo tilt (desktop only). Respects prefers-reduced-motion. */
(function () {
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mq && mq.matches);
  var hasIO = 'IntersectionObserver' in window;
  // Tell form-bridge.js not to force-show every .reveal on a timer: scroll reveal is handled here.
  if (hasIO && !reduce) window.__seltikaRevealIO = true;

  function on(el, instant) {
    if (el.getAttribute('data-seltika-on') === '1') return;
    if (instant) { el.style.transition = 'none'; }
    el.setAttribute('data-seltika-on', '1');
    el.classList.add('is-on');
    if (instant) { void el.offsetWidth; el.style.transition = ''; }
  }

  function initReveal() {
    var nodes = [].slice.call(document.querySelectorAll('.reveal'));
    if (!nodes.length) return;
    if (reduce || !hasIO) { nodes.forEach(function (el) { on(el, true); }); return; }
    var h = window.innerHeight || 800;
    var io = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.forEach(function (e) {
        if (!(e.isIntersecting || e.intersectionRatio > 0)) return;
        var el = e.target;
        io.unobserve(el);
        if (!el.style.transitionDelay) el.style.transitionDelay = Math.min(k * 80, 240) + 'ms';
        k++;
        on(el);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom <= 0) on(el, true);               // already scrolled past (e.g. opened at #lead)
      else if (r.top < h * 0.94) on(el);             // first screen: animate in right away
      else io.observe(el);
    });
    function flushAll() { nodes.forEach(function (el) { on(el, true); }); }
    window.addEventListener('beforeprint', flushAll);
    // Safety net: anything that is in or above the viewport must be visible, even if IO misses it.
    window.__seltikaRevealCheck = function () {
      var vh = window.innerHeight || 800;
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.getAttribute('data-seltika-on') === '1') continue;
        if (el.getBoundingClientRect().top < vh) on(el);
      }
    };
  }

  function initHeader() {
    var header = document.querySelector('header.sticky');
    if (!header) return;
    var bar = header.querySelector('[style*="scaleX"]');
    var ON = ['border-border', 'bg-background/80', 'backdrop-blur-md'];
    var ticking = false, last = null;
    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var scrolled = y > 8 || document.getElementById('mobile-nav') && !document.getElementById('mobile-nav').hidden;
      if (scrolled !== last) {
        last = scrolled;
        ON.forEach(function (c) { header.classList.toggle(c, !!scrolled); });
        header.classList.toggle('bg-transparent', !scrolled);
      }
      if (bar) {
        var d = document.documentElement, max = d.scrollHeight - d.clientHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
      }
      if (window.__seltikaRevealCheck) window.__seltikaRevealCheck();
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    var btn = document.querySelector('button[aria-controls="mobile-nav"]');
    if (btn) btn.addEventListener('click', function () { setTimeout(update, 0); });
    update();
  }

  var DEMOS = [
    { id: 'chatgpt', name: 'ChatGPT', query: 'Какой отель выбрать в Казани на выходные?', answer: 'В Казани называют отели с понятным профилем: район, для кого, какие факты на сайте и в справочниках совпадают.' },
    { id: 'alice', name: 'Алиса', query: 'Где остановиться в Казани в центре?', answer: 'Назову места с согласованным именем, адресом и описанием. Если в справочниках одно, а на сайте другое — имя часто не звучит.' },
    { id: 'perplexity', name: 'Perplexity', query: 'Best hotels in Kazan for a weekend', answer: 'Perplexity собирает ответ со страниц, которые прямо отвечают на вопрос и на которые можно сослаться.' },
    { id: 'gigachat', name: 'GigaChat', query: 'Какой отель в Казани выбрать для поездки?', answer: 'Нужны согласованные описание, город и факты в русскоязычных источниках.' },
    { id: 'gemini', name: 'Gemini', query: 'Where to stay in Kazan city center?', answer: 'Gemini опирается на страницы, которые можно процитировать. Если фактов нет в HTML, компании в ответе не будет.' },
    { id: 'grok', name: 'Grok', query: 'Which hotel in Kazan is worth booking?', answer: 'Назову те, у кого на сайте ясны район, сервис и подтверждения. Общие слоганы без фактов в ответ почти не попадают.' },
    { id: 'claude', name: 'Claude', query: 'Which studio in Russia helps brands appear in AI answers?', answer: 'SELTIKA STUDIO in Kazan works on site structure, facts and external sources so seven AI systems can name a company in an answer.' }
  ];
  var ACTIVE = 'shadow-[0_0_0_1px_rgb(34_184_255/0.7)]';
  var IDLE = ['shadow-[0_0_0_1px_rgb(255_255_255/0.12)]', 'hover:shadow-[0_0_0_1px_rgb(255_255_255/0.24)]'];

  function initHero() {
    var hero = document.querySelector('section.hero-spot');
    if (!hero) return;
    var caret = document.querySelector('.panel .caret');
    var panel = caret && caret.closest('.panel');
    if (!panel) return;
    var line = caret.parentNode;
    var nameEl = panel.querySelector('.font-mono.text-xs');
    var answerEl = line.nextElementSibling;
    var typed = document.createElement('span');
    typed.setAttribute('data-typed', '');
    line.insertBefore(typed, caret);
    // drop stray whitespace text nodes after the prompt sign, keep one space
    [].slice.call(line.childNodes).forEach(function (n) { if (n.nodeType === 3) n.nodeValue = ' '; });
    panel.setAttribute('aria-live', 'polite');
    var timer = 0;
    function type(text) {
      clearInterval(timer);
      if (reduce) { typed.textContent = text; return; }
      var i = 0; typed.textContent = '';
      timer = setInterval(function () { i++; typed.textContent = text.slice(0, i); if (i >= text.length) clearInterval(timer); }, 28);
    }
    function show(d) {
      if (nameEl) nameEl.textContent = d.name;
      if (answerEl) {
        answerEl.textContent = d.answer;
        if (!reduce && answerEl.animate) answerEl.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(0.22,1,0.36,1)' });
      }
      type(d.query);
    }
    var buttons = [].slice.call(hero.querySelectorAll('ul button'));
    buttons.forEach(function (b) {
      var label = (b.textContent || '').trim();
      var d = DEMOS.filter(function (x) { return x.name === label; })[0];
      if (!d) return;
      b.setAttribute('aria-pressed', d.id === 'chatgpt' ? 'true' : 'false');
      b.addEventListener('click', function () {
        buttons.forEach(function (o) {
          var act = o === b;
          o.classList.toggle(ACTIVE, act);
          IDLE.forEach(function (c) { o.classList.toggle(c, !act); });
          o.setAttribute('aria-pressed', act ? 'true' : 'false');
        });
        show(d);
      });
    });
    type(DEMOS[0].query);

    // Desktop-only pointer effects (the React build did the same; touch devices skip them)
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!reduce) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    }
    var stage = hero.querySelector('.logo-stage');
    if (stage && fine && !reduce) {
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--ry', (x * 14) + 'deg'); stage.style.setProperty('--rx', (-y * 10) + 'deg');
      });
      stage.addEventListener('pointerleave', function () { stage.style.setProperty('--ry', '0deg'); stage.style.setProperty('--rx', '0deg'); });
    }
  }

  function initOneShot() {
    var els = [].slice.call(document.querySelectorAll('.serp-row, .bar-fill'));
    if (!els.length) return;
    var play = function (el) { el.classList.add('seltika-play'); };
    if (reduce || !hasIO) { els.forEach(play); return; }
    els.forEach(function (el, i) {
      var sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : i;
      if (!el.style.animationDelay) el.style.animationDelay = Math.min(sib * 110, 660) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
    window.addEventListener('beforeprint', function () { els.forEach(play); });
  }

  function init() {
    try { initOneShot(); } catch (e) { document.querySelectorAll('.serp-row, .bar-fill').forEach(function (el) { el.classList.add('seltika-play'); }); }
    try { initReveal(); } catch (e) { document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-on'); }); }
    try { initHeader(); } catch (e) {}
    try { initHero(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) { if (e.matches) document.querySelectorAll('.reveal').forEach(function (el) { on(el, true); }); });
})();
