/*! static-ui.js — tiny helpers after SPA hydration is disabled */
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
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Закрыть меню');
  }
  function closeMenu(btn, panel) {
    panel.hidden = true;
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
        h += '<p class="font-display text-xl">' + esc(LABELS[r.verdict] || r.verdict) + ' · ' + esc(r.score) + '/100</p>';
        h += '<p class="mt-2 text-muted">' + esc(r.summary) + '</p><ul class="mt-3 space-y-1">';
        (r.systems || []).forEach(function (s) { h += '<li>' + esc(s.name) + ': ' + esc(STATUS[s.status] || s.status) + ' (' + esc(s.likelihood) + '%) — ' + esc(s.note) + '</li>'; });
        h += '</ul>';
        if (r.priorityQueries && r.priorityQueries.length) h += '<p class="mt-3">Контрольные запросы: ' + r.priorityQueries.map(esc).join('; ') + '</p>';
        h += '<p class="mt-3 text-xs text-muted">' + esc(r.disclaimer) + '</p>';
        h += '<p class="mt-3"><a class="text-primary hover:underline" href="/#lead">Получить полный разбор →</a></p>';
        box(form, '').innerHTML = h;
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
            '<p class="mt-3 text-sm leading-relaxed text-muted">Свяжемся по телефону, уточним 3–5 приоритетных запросов и покажем, где ваш бренд уже виден нейросетям, а где его заменяют конкуренты.</p>' +
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
