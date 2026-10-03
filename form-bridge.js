/* GitHub Pages has no TanStack /_serverFn. The free check shows example questions only (no scores).
   Leads POST to n8n. React calls window.__seltikaSiteScan / __seltikaSiteLead. */
(function () {
  var SITE_HOOK = "https://n8n.gobots.ru/webhook/seltikastudio-site";
  var SCAN = "a42b99520690860484df897cc18989b725481172a67d99bb3aa94ce95a1773b3";
  var LEAD = "5ddea7d37b2ed55e2ade42f3fd84861d5eca3e7dfd4347c7470cc5bf64b4b3d8";

  function planFromHash() {
    try {
      var q = new URLSearchParams(window.location.hash.split("?")[1] || "");
      var s = new URLSearchParams(window.location.search || "");
      return q.get("plan") || s.get("plan") || "audit";
    } catch (e) {
      return "audit";
    }
  }

  function hostnameOf(site) {
    try {
      var u = new URL(site.indexOf("http") === 0 ? site : "https://" + site);
      return u.hostname.replace(/^www\./, "");
    } catch (e) {
      return String(site || "").replace(/^https?:\/\//, "").split("/")[0];
    }
  }

  /* Free preview: example questions by template + what the paid audit measures.
     No scores, no percentages, no calls to models. */
  function questionPreview(data) {
    var site = String(data.site || "").trim();
    var brand = String(data.brand || "").trim() || (site ? hostnameOf(site) : "");
    var service = String(data.service || "").trim().replace(/[«»"]/g, "");
    var city = String(data.city || "").trim();
    var loc = city ? (/^(в|во|на)\s/i.test(city) ? " " + city : " (" + city + ")") : "";
    var q = [];
    var LIST = "подборки «лучшие/топ»: на какие рейтинги опирается ответ";
    var REC = "кого советуют вместо вас";
    var DESC = "описывают ли вас верно";
    q.push({ q: "Лучшие компании: " + service + loc + " — кого выбрать?", tag: LIST });
    q.push({ q: "Топ-5 компаний: " + service + loc, tag: LIST });
    q.push({ q: "Рейтинг: " + service + loc + ". Кому можно доверять?", tag: LIST });
    q.push({ q: "Посоветуй надёжную компанию: " + service + loc, tag: REC });
    q.push({ q: "К кому обратиться: " + service + loc + "? Нужны 3–5 вариантов", tag: REC });
    q.push({ q: service.charAt(0).toUpperCase() + service.slice(1) + loc + ": какие есть варианты и чем они отличаются?", tag: REC });
    q.push({ q: "Сколько стоят услуги: " + service + loc + "? От чего зависит цена?", tag: "кого называют, когда спрашивают про цену" });
    q.push({ q: "Как выбрать компанию: " + service + "? На что смотреть, чтобы не ошибиться", tag: "чьи критерии и примеры попадают в ответ" });
    if (brand) {
      q.push({ q: "Что известно о компании " + brand + "? Чем она занимается?", tag: DESC });
      q.push({ q: brand + " или другие: кого выбрать для задачи «" + service + "»?", tag: DESC + " и с кем сравнивают" });
    } else {
      q.push({ q: "Кто специализируется на этом: " + service + loc + "?", tag: REC });
    }
    return {
      questions: q,
      measures: [
        "10 вопросов × 7 систем × 3 прогона, каждый прогон в новом диалоге: ChatGPT, Алиса, Perplexity, GigaChat, Gemini, Grok, Claude",
        "Подборки «лучшие/топ»: на какие рейтинги и каталоги опираются ответы и есть ли вы в них",
        "До 3 конкурентов, которых нейросети называют вместо вас",
        "Тип проблемы по каждому вопросу: не упоминают / описывают неверно / советуют конкурентов / нет доступа ботов",
        "Отчёт и план следующих шагов"
      ],
      disclaimer: "Это примеры по шаблону, а не ответы нейросетей: в модели ничего не отправляли и оценок не ставим. В аудите вопросы берём из анкеты — так, как их задают ваши клиенты."
    };
  }

  function parseServerFnBody(body) {
    if (!body) return {};
    try {
      var raw = typeof body === "string" ? body : String(body);
      var j = JSON.parse(raw);
      if (j && j.data && typeof j.data === "object") return j.data;
      var inner = j.t && j.t.p && j.t.p.v && j.t.p.v[0];
      if (!inner || !inner.p) return {};
      var keys = inner.p.k || [];
      var vals = inner.p.v || [];
      var out = {};
      for (var i = 0; i < keys.length; i++) {
        var v = vals[i];
        out[keys[i]] = v && typeof v === "object" && "s" in v ? v.s : v;
      }
      return out;
    } catch (e) {
      return {};
    }
  }

  function jsonOk(obj) {
    return new Response(JSON.stringify(obj), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  window.__seltikaSiteScan = function (data) {
    data = data || {};
    if (!String(data.service || "").trim()) {
      return Promise.resolve({ ok: false, error: "Укажите услугу или нишу — например, «внедрение 1С» или «стоматология»." });
    }
    return Promise.resolve({ ok: true, result: questionPreview(data) });
  };

  window.__seltikaSiteLead = function (data) {
    data = data || {};
    return fetch(SITE_HOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "seltikastudio.ru",
        action: "lead.upsert",
        name: data.name || "",
        brand: data.company || data.brand || data.name || "",
        company: data.company || "",
        site: data.site || "",
        contact: data.contact || "",
        task: data.task || "",
        niche: data.task || "",
        package: ("plan" in data) ? String(data.plan || "") : planFromHash(),
      }),
    })
      .then(function (r) {
        if (r.ok) return { ok: true };
        return { ok: false, error: "Не удалось отправить. Напишите в Telegram @seltikastudiobot, в WhatsApp +7 903 343-40-07 или позвоните." };
      })
      .catch(function () {
        return { ok: false, error: "Не удалось отправить. Напишите в Telegram @seltikastudiobot, в WhatsApp +7 903 343-40-07 или позвоните." };
      });
  };

  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input && input.url ? input.url : String(input);
    var path = url.replace(/^https?:\/\/[^/]+/, "");
    if (path.indexOf("/_serverFn/") !== 0) return origFetch.apply(this, arguments);
    var data = parseServerFnBody(init && init.body);
    var isLead =
      path.indexOf(LEAD) !== -1 ||
      (data && (data.contact || data.name) && data.site !== undefined);
    var isScan = path.indexOf(SCAN) !== -1 || (data && (data.site || data.brand || data.service) && !isLead);
    if (isScan) return Promise.resolve(jsonOk({ ok: true, result: questionPreview(data) }));
    if (isLead) {
      return window.__seltikaSiteLead(data).then(function (res) {
        return jsonOk(res);
      });
    }
    return origFetch.apply(this, arguments);
  };
})();

/* Mobile WebKit: mismatched transform lists, 3D child context, blur, and IO miss. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.setAttribute("data-seltika-motion", "1");
  style.textContent =
    ".grain{mix-blend-mode:normal!important;opacity:.04!important}" +
    "@media (pointer:coarse){" +
      ".grain{display:none!important}" +
      ".reveal{filter:none!important}" +
      ".logo-stage{-webkit-perspective:none!important;perspective:none!important}" +
      ".logo-float img,.logo-cutout{-webkit-transform:none!important;transform:none!important}" +
      ".logo-bloom{filter:blur(18px)!important}" +
    "}" +
    ".reveal[data-seltika-on=\"1\"],.reveal.is-on{opacity:1!important;filter:none!important;-webkit-transform:none!important;transform:none!important}" +
    "@-webkit-keyframes seltika-float{0%,100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}50%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}}" +
    "@keyframes seltika-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-10px,0)}}" +
    "@-webkit-keyframes seltika-spin{from{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}" +
    "@keyframes seltika-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}" +
    "@-webkit-keyframes seltika-marquee{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{-webkit-transform:translate3d(-33.333%,0,0);transform:translate3d(-33.333%,0,0)}}" +
    "@keyframes seltika-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-33.333%,0,0)}}" +
    "@-webkit-keyframes seltika-pulse{0%,100%{opacity:.45;-webkit-transform:scale(1);transform:scale(1)}50%{opacity:1;-webkit-transform:scale(1.25);transform:scale(1.25)}}" +
    "@keyframes seltika-pulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}" +
    (reduce ? "" :
      ".logo-float,.orbit,.orbit-rev,.orbit-badge-spin,.orbit-ring,.marquee,.radar-sweep,.live-dot,.caret{" +
        "-webkit-animation-play-state:running!important;animation-play-state:running!important}" +
      ".logo-float{-webkit-animation:seltika-float 7s ease-in-out infinite!important;animation:seltika-float 7s ease-in-out infinite!important;-webkit-transform:translateZ(0);transform:translateZ(0)}" +
      ".orbit{-webkit-animation:seltika-spin 28s linear infinite!important;animation:seltika-spin 28s linear infinite!important}" +
      ".orbit-rev{-webkit-animation:seltika-spin 36s linear infinite reverse!important;animation:seltika-spin 36s linear infinite reverse!important}" +
      ".orbit-badge-spin,.orbit-ring{-webkit-animation:seltika-spin 22s linear infinite!important;animation:seltika-spin 22s linear infinite!important;-webkit-transform-origin:50% 50%;transform-origin:50% 50%}" +
      ".orbit-ring{-webkit-animation-duration:48s!important;animation-duration:48s!important}" +
      ".marquee{-webkit-animation:seltika-marquee 28s linear infinite!important;animation:seltika-marquee 28s linear infinite!important}" +
      ".radar-sweep{-webkit-animation:seltika-spin 5.5s linear infinite!important;animation:seltika-spin 5.5s linear infinite!important}" +
      ".live-dot{-webkit-animation:seltika-pulse 2.2s ease-in-out infinite!important;animation:seltika-pulse 2.2s ease-in-out infinite!important}" +
      ".caret{-webkit-animation:seltika-pulse 1s step-end infinite!important;animation:seltika-pulse 1s step-end infinite!important}"
    ) +
    ".eg-html-dot{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;pointer-events:none;z-index:3;" +
    "-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);will-change:transform;box-shadow:0 0 8px currentColor}";
  (document.head || document.documentElement).appendChild(style);

  function markReveal(force) {
    if (window.__seltikaRevealIO) return; /* static-ui.js runs IntersectionObserver scroll reveal */
    var nodes = document.querySelectorAll(".reveal");
    var h = window.innerHeight || 800;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!force && el.getAttribute("data-seltika-on") === "1") continue;
      var r = el.getBoundingClientRect();
      if (force || (r.top < h + 120 && r.bottom > -80)) {
        el.setAttribute("data-seltika-on", "1");
        if (el.className.indexOf("is-on") === -1) el.className += " is-on";
      }
    }
  }

  function kickAnims() {
    if (reduce) return;
    var sels = [".logo-float", ".orbit", ".orbit-rev", ".orbit-ring", ".orbit-badge-spin", ".marquee", ".radar-sweep", ".live-dot", ".caret"];
    for (var s = 0; s < sels.length; s++) {
      var list = document.querySelectorAll(sels[s]);
      for (var i = 0; i < list.length; i++) {
        list[i].style.webkitAnimationPlayState = "running";
        list[i].style.animationPlayState = "running";
      }
    }
  }

  function onScrollReveal() {
    markReveal(false);
  }

  window.addEventListener("scroll", onScrollReveal, { passive: true });
  window.addEventListener("touchstart", function () { kickAnims(); markReveal(false); }, { passive: true });
  window.addEventListener("pageshow", function () { kickAnims(); markReveal(false); });

  var rafId = 0;
  var spokes = [];
  var hostEl = null;
  var svgEl = null;

  function map(x, y) {
    if (!svgEl || !hostEl) return { x: 0, y: 0 };
    var vb = svgEl.viewBox.baseVal;
    var sr = svgEl.getBoundingClientRect();
    var hr = hostEl.getBoundingClientRect();
    var w = vb && vb.width ? vb.width : 640;
    var h = vb && vb.height ? vb.height : 400;
    return {
      x: ((x - (vb && vb.x ? vb.x : 0)) / w) * sr.width + (sr.left - hr.left),
      y: ((y - (vb && vb.y ? vb.y : 0)) / h) * sr.height + (sr.top - hr.top)
    };
  }

  function clearDots(host) {
    var old = host.querySelectorAll(".eg-html-dot");
    for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
  }

  function tick(now) {
    for (var i = 0; i < spokes.length; i++) {
      var s = spokes[i];
      if (!s.el || !s.el.isConnected) continue;
      var p = (now / s.dur) % 1;
      var k = p < 0.5 ? p * 2 : 2 - p * 2;
      var pt = map(s.x1 + (s.x2 - s.x1) * k, s.y1 + (s.y2 - s.y1) * k);
      s.el.style.webkitTransform = "translate3d(" + pt.x + "px," + pt.y + "px,0)";
      s.el.style.transform = "translate3d(" + pt.x + "px," + pt.y + "px,0)";
    }
    rafId = requestAnimationFrame(tick);
  }

  function bootGraph() {
    var section = document.getElementById("graph");
    if (!section) return false;
    var svg = section.querySelector("svg");
    if (!svg) return false;
    var panel = svg.parentNode;
    if (!panel) return false;
    if (panel.getAttribute("data-seltika-dots") === "on" && panel.querySelector(".eg-html-dot")) return true;

    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    clearDots(panel);
    var cs = window.getComputedStyle(panel);
    if (cs.position === "static") panel.style.position = "relative";

    var groups = svg.querySelectorAll("g");
    spokes = [];
    for (var i = 0; i < groups.length; i++) {
      var line = groups[i].querySelector("line");
      var circle = groups[i].querySelector("circle");
      if (!line || !circle) continue;
      var x1 = parseFloat(line.getAttribute("x1"));
      var y1 = parseFloat(line.getAttribute("y1"));
      var x2 = parseFloat(line.getAttribute("x2"));
      var y2 = parseFloat(line.getAttribute("y2"));
      if (isNaN(x1) || isNaN(x2)) continue;
      circle.style.opacity = "0";
      var dot = document.createElement("div");
      dot.className = "eg-html-dot";
      var fill = circle.getAttribute("fill") || "#22B8FF";
      dot.style.background = fill;
      dot.style.color = fill;
      panel.appendChild(dot);
      spokes.push({ el: dot, x1: x1, y1: y1, x2: x2, y2: y2, dur: 2800 + spokes.length * 400 });
    }
    if (!spokes.length) return false;
    hostEl = panel;
    svgEl = svg;
    panel.setAttribute("data-seltika-dots", "on");
    svg.setAttribute("data-seltika-motion", "on");
    rafId = requestAnimationFrame(tick);
    return true;
  }

  function watch() {
    bootGraph();
    var section = document.getElementById("graph");
    if (!section || section._seltikaObs) return;
    section._seltikaObs = new MutationObserver(function () {
      var panel = section.querySelector(".panel") || (section.querySelector("svg") && section.querySelector("svg").parentNode);
      if (!panel) return;
      if (!panel.querySelector(".eg-html-dot")) {
        panel.removeAttribute("data-seltika-dots");
        bootGraph();
      }
    });
    section._seltikaObs.observe(section, { childList: true, subtree: true });
  }

  function start() {
    watch();
    kickAnims();
    markReveal(false);
    var n = 0;
    var id = setInterval(function () {
      n += 1;
      watch();
      kickAnims();
      markReveal(false);
      if (n === 6) markReveal(true);
      if (n > 25) clearInterval(id);
    }, 400);
  }

  window.addEventListener("resize", function () {
    if (spokes.length) bootGraph();
    markReveal(false);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", function () {
    setTimeout(function () { watch(); kickAnims(); markReveal(false); }, 500);
    setTimeout(function () { watch(); kickAnims(); markReveal(true); }, 1600);
  });
})();
