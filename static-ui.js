/*! static-ui.js v5 — vanilla helpers after SPA hydration is disabled: menu, forms, package choice, cookie notice, motion */
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
        { href: '/#scanner', text: 'Что проверим' },
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
          links.push({ href: href, text: text, plan: a.getAttribute('data-plan') || '' });
        }
      });
    }
    // Messengers and phone: on mobile the header shows only the burger, so contacts live in the menu
    [
      { href: 'https://t.me/seltikastudiobot?start=audit', text: 'Telegram: @seltikastudiobot', ext: true },
      { href: 'https://wa.me/79033434007', text: 'WhatsApp', ext: true },
      { href: 'tel:+79033434007', text: '+7 903 343-40-07' }
    ].forEach(function (l) { if (!links.some(function (x) { return x.href === l.href; })) links.push(l); });
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
      if (l.ext) { a.target = '_blank'; a.rel = 'noopener'; }
      var dp = l.plan || (/[?&]plan=([a-z]+)/.exec(l.href || '') || [])[1];
      if (dp) a.setAttribute('data-plan', dp);
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

/* Forms without React: free question preview (no scores) + lead (POST to n8n via form-bridge) + package choice. */
(function () {
  var TG = 'https://t.me/seltikastudiobot?start=audit';
  var WA = 'https://wa.me/79033434007';
  var PLANS = { audit: 1, landing: 1, setup: 1, system: 1, monitor: 1 };
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
  function leadForms() { return [].slice.call(document.querySelectorAll('form')).filter(function (f) { return f.querySelector('[name="contact"]'); }); }

  /* ---- package (plan) choice: kept in a visible <select>, so it survives scrolling on mobile ---- */
  function setPlan(plan) {
    if (!PLANS[plan]) return;
    leadForms().forEach(function (f) { var s = f.querySelector('select[name="plan"]'); if (s) s.value = plan; });
  }
  function goLead(plan, prefill) {
    var lead = document.getElementById('lead');
    if (!lead) return false;
    if (plan) setPlan(plan);
    var f = leadForms()[0];
    if (f && prefill) {
      Object.keys(prefill).forEach(function (k) { var el = f.querySelector('[name="' + k + '"]'); if (el && !el.value && prefill[k]) el.value = prefill[k]; });
    }
    try { history.replaceState(null, '', location.pathname + location.search + '#lead'); } catch (e) {}
    lead.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = f && f.querySelector('input[name="name"]');
    if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 450);
    return true;
  }
  function planFromUrl() {
    var m = /[?&]plan=([a-z]+)/.exec(location.search) || /[?&]plan=([a-z]+)/.exec(location.hash);
    return m ? m[1] : '';
  }
  function initPlans() {
    var p = planFromUrl();
    if (p) setPlan(p);
    if (/^#lead\?/.test(location.hash) && document.getElementById('lead')) setTimeout(function () { goLead(p); }, 60);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-plan]');
      if (!a) return;
      var url; try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.pathname !== location.pathname || !document.getElementById('lead')) return; /* other page: ?plan= in the URL does the job */
      e.preventDefault();
      goLead(a.getAttribute('data-plan'));
    });
  }

  /* ---- free question preview: examples by template, no numbers about the visitor ---- */
  function onScan(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = data(form);
      if (!window.__seltikaSiteScan) { box(form, 'text-red-400').textContent = 'Сейчас не работает. Напишите нам в Telegram: t.me/seltikastudiobot'; return; }
      window.__seltikaSiteScan(d).then(function (res) {
        if (!res || !res.ok) { box(form, 'text-red-400').textContent = (res && res.error) || 'Укажите услугу или нишу.'; return; }
        var r = res.result, h = '';
        h += '<p class="font-display text-lg text-foreground">Примеры вопросов для аудита</p>';
        h += '<ol class="mt-3 space-y-2 text-sm">';
        r.questions.forEach(function (q, i) {
          h += '<li class="flex gap-3"><span class="font-mono text-xs text-faint tabular-nums mt-0.5">' + (i < 9 ? '0' : '') + (i + 1) + '</span><span><span class="text-foreground">«' + esc(q.q) + '»</span><span class="block text-xs text-faint">' + esc(q.tag) + '</span></span></li>';
        });
        h += '</ol>';
        h += '<p class="mt-5 font-display text-lg text-foreground">Что измерит AI-аудит</p><ul class="mt-2 space-y-1.5 text-sm text-muted">';
        r.measures.forEach(function (m) { h += '<li class="flex gap-2.5"><span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"></span><span>' + esc(m) + '</span></li>'; });
        h += '</ul>';
        h += '<p class="mt-4 text-xs leading-relaxed text-faint">' + esc(r.disclaimer) + '</p>';
        h += '<div class="mt-5 flex flex-col gap-3 sm:flex-row">' +
          '<a href="/?plan=audit#lead" data-plan="audit" data-scan-order class="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-fg hover:brightness-110">Заказать аудит</a>' +
          '<a href="' + TG + '" target="_blank" rel="noopener" class="inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-medium text-foreground shadow-[0_0_0_1px_rgb(255_255_255/0.16)] hover:shadow-[0_0_0_1px_rgb(255_255_255/0.32)]">Обсудить в Telegram</a></div>';
        var out = document.querySelector('[data-scan-out]') || box(form, '');
        out.innerHTML = h;
        var order = out.querySelector('[data-scan-order]');
        if (order) order.addEventListener('click', function (ev) {
          if (!document.getElementById('lead')) return;
          ev.preventDefault(); ev.stopPropagation();
          goLead('audit', { site: d.site || '', company: d.brand || '', task: d.service ? ('Аудит: ' + d.service + (d.city ? ', ' + d.city : '')) : '' });
        });
        if (out.getAttribute('data-scan-out') !== null && window.innerWidth < 1024) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function onLead(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = data(form);
      if (!('plan' in d)) { var p = planFromUrl(); if (p) d.plan = p; }
      delete d.consent;
      if (!window.__seltikaSiteLead) { box(form, 'text-red-400').textContent = 'Напишите в Telegram t.me/seltikastudiobot или позвоните +7 903 343-40-07.'; return; }
      busy(form, true, 'Отправляем…');
      window.__seltikaSiteLead(d).then(function (res) {
        busy(form, false);
        if (res && res.ok) {
          form.innerHTML = '<p class="font-display text-xl" tabindex="-1">Заявка принята</p>' +
            '<p class="mt-3 text-sm leading-relaxed text-muted">Ответим в течение рабочего дня: уточним задачу и предложим, с чего начать — аудит, настройку или продвижение.</p>' +
            '<p class="mt-3 text-sm leading-relaxed text-muted">Быстрее всего — в Telegram: бот пришлёт опросный лист, по нему посчитаем смету. Можно и в WhatsApp или по телефону.</p>' +
            '<p class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm"><a class="text-primary hover:underline" href="' + TG + '" target="_blank" rel="noopener">Telegram: @seltikastudiobot</a><a class="text-primary hover:underline" href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a><a class="text-primary hover:underline" href="tel:+79033434007">+7 903 343-40-07</a></p>';
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
    initPlans();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* Cookie notice: the site uses Yandex Metrica (with Webvisor). Shown once; dismissal kept in localStorage. */
(function () {
  var KEY = 'ss-cookie-notice-2026-10';
  function show() {
    try { if (localStorage.getItem(KEY)) return; } catch (e) {}
    if (document.getElementById('cookie-notice')) return;
    var el = document.createElement('div');
    el.id = 'cookie-notice';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Cookies');
    el.innerHTML = '<p>Сайт использует cookies и Яндекс Метрику с Вебвизором: считаем посещения и смотрим, как пользуются страницами. Имя и контакт из формы Метрика не записывает. <a href="/privacy/">Подробнее</a></p><button type="button">Понятно</button>';
    el.querySelector('button').addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      el.parentNode && el.parentNode.removeChild(el);
    });
    document.body.appendChild(el);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
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

  // Hero demo: example questions and how a system builds an answer. These are OUR explanations, not quotes of model answers.
  var DEMOS = [
    { id: 'chatgpt', name: 'ChatGPT', query: 'Кто внедряет 1С в Казани? Посоветуй 3–5 компаний', answer: 'Пример, не ответ модели: ChatGPT называет компании, у которых на сайте прямо сказано, что они делают, где и для кого, и это совпадает с отзывами и каталогами.' },
    { id: 'alice', name: 'Алиса', query: 'Какую компанию выбрать для внедрения 1С в Казани?', answer: 'Пример, не ответ модели: Алисе нужны одинаковые имя, город и описание на сайте и в справочниках. Если они расходятся, компанию часто не называют.' },
    { id: 'perplexity', name: 'Perplexity', query: 'Best 1C integrators in Kazan', answer: 'Пример, не ответ модели: Perplexity собирает ответ со страниц, которые прямо отвечают на вопрос, и показывает их как источники.' },
    { id: 'gigachat', name: 'GigaChat', query: 'Кто в Казани внедряет 1С для производства?', answer: 'Пример, не ответ модели: GigaChat опирается на русскоязычные источники, поэтому важны согласованные описание, город и факты о компании.' },
    { id: 'gemini', name: 'Gemini', query: 'Which companies implement 1C in Kazan?', answer: 'Пример, не ответ модели: Gemini берёт то, что можно процитировать. Если фактов нет в тексте страницы, компании в ответе не будет.' },
    { id: 'grok', name: 'Grok', query: 'Who is a reliable 1C partner in Kazan?', answer: 'Пример, не ответ модели: без фактов на сайте — услуги, отрасли, подтверждения — слоганы почти не попадают в ответ.' },
    { id: 'claude', name: 'Claude', query: 'Как выбрать подрядчика по внедрению 1С в Казани?', answer: 'Пример, не ответ модели: Claude чаще советует критерии выбора и называет компании, которые эти критерии явно закрывают на своих страницах.' }
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
      if (nameEl) nameEl.textContent = 'Пример вопроса · ' + d.name;
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
