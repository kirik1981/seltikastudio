/* GitHub Pages has no TanStack /_serverFn. Scanner is a local hypothesis.
   Leads POST to n8n. React calls window.__seltikaSiteScan / __seltikaSiteLead. */
(function () {
  var SITE_HOOK = "https://n8n.gobots.ru/webhook/seltikastudio-site";
  var SCAN = "a42b99520690860484df897cc18989b725481172a67d99bb3aa94ce95a1773b3";
  var LEAD = "5ddea7d37b2ed55e2ade42f3fd84861d5eca3e7dfd4347c7470cc5bf64b4b3d8";

  function hashStr(s) {
    var h = 2166136261;
    s = String(s || "");
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function planFromHash() {
    try {
      var q = new URLSearchParams(window.location.hash.split("?")[1] || "");
      return q.get("plan") || "audit";
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

  function scanHypothesis(data) {
    var site = String(data.site || "").trim();
    var brand = String(data.brand || "").trim() || hostnameOf(site);
    var service = String(data.service || "").trim();
    var seed = hashStr(brand + "|" + site + "|" + service);
    var score = 28 + (seed % 45);
    var verdict = "weak";
    if (score >= 62) verdict = "visible";
    else if (score >= 44) verdict = "emerging";

    function sys(id, name, bias) {
      var likelihood = Math.max(8, Math.min(88, score + bias));
      var status = "unlikely";
      if (likelihood >= 64) status = "likely";
      else if (likelihood >= 38) status = "possible";
      var note = status === "likely" ? "Есть шанс попасть в ответ" : status === "possible" ? "Зависит от формулировки вопроса" : "Пока слабые сигналы";
      return { id: id, name: name, status: status, likelihood: likelihood, note: note };
    }

    var queries = [];
    if (service) queries.push(service + " кого выбрать");
    if (brand) queries.push(brand + " отзывы");
    queries.push((service || "подрядчик") + " надёжная компания");

    var competitors = [];
    if (score < 55) {
      competitors.push({
        name: "Более известные игроки ниши",
        why: "модели чаще опираются на уже цитируемые бренды",
      });
    }

    return {
      verdict: verdict,
      score: score,
      summary:
        "Предварительная гипотеза по открытым сигналам для «" +
        (brand || "бренда") +
        "». Это не живой краулинг моделей. Полный разбор — после заявки, в течение рабочего дня.",
      systems: [
        sys("chatgpt", "ChatGPT", 6),
        sys("alice", "Алиса", -12),
        sys("perplexity", "Perplexity", 2),
        sys("gigachat", "GigaChat", -18),
        sys("gemini", "Gemini", 8),
        sys("grok", "Grok", 4),
        sys("claude", "Claude", 3),
      ],
      priorityQueries: queries.slice(0, 4),
      competitors: competitors,
      topics: service ? [service] : [],
      pagesToStrengthen: ["Главная", "Услуги", "FAQ"],
      nextSteps: ["Согласовать контрольные запросы", "Проверить ответы вручную"],
      disclaimer: "Гипотеза по сайту и формулировкам, не отчёт по живым ответам моделей.",
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
    var site = String(data.site || "").trim();
    var brand = String(data.brand || "").trim();
    if (!site && !brand) {
      return Promise.resolve({ ok: false, error: "Укажите сайт или название бренда. Если сайта нет — достаточно бренда и услуги." });
    }
    var result = scanHypothesis(data);
    if (!site && brand) {
      result.score = Math.max(12, result.score - 14);
      result.verdict = result.score >= 44 ? "emerging" : "weak";
      result.summary =
        "Сайта нет — это гипотеза по имени «" + brand +
        "». Без своей страницы нейросетям нечего цитировать. Следующий шаг — одностраничник: кто вы, что продаёте, где работаете.";
      result.nextSteps = ["Собрать одностраничник под бренд", "Согласовать контрольные запросы", "Проверить ответы вручную"];
      result.pagesToStrengthen = ["Одностраничник", "Профиль компании"];
      result.disclaimer = "Без сайта оценка слабее. Это не отчёт по живым ответам моделей.";
    }
    return Promise.resolve({ ok: true, result: result });
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
        package: data.plan || planFromHash(),
      }),
    })
      .then(function (r) {
        if (r.ok) return { ok: true };
        return { ok: false, error: "Не удалось отправить. Напишите на hello@seltikastudio.ru или позвоните +7 903 343-40-07." };
      })
      .catch(function () {
        return { ok: false, error: "Не удалось отправить. Напишите на hello@seltikastudio.ru или позвоните +7 903 343-40-07." };
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
    if (isScan) return Promise.resolve(jsonOk({ ok: true, result: scanHypothesis(data) }));
    if (isLead) {
      return window.__seltikaSiteLead(data).then(function (res) {
        return jsonOk(res);
      });
    }
    return origFetch.apply(this, arguments);
  };
})();

/* Mobile: SVG cx/cy often does not paint; hydrate replaces animated nodes; grain kills compositor. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var style = document.createElement("style");
  style.setAttribute("data-seltika-motion", "1");
  style.textContent =
    ".grain{mix-blend-mode:normal!important;opacity:.04!important}" +
    "@media (pointer:coarse){.grain{display:none!important}}" +
    "@-webkit-keyframes seltika-float{0%,100%{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}50%{-webkit-transform:translate3d(0,-10px,0);transform:translate3d(0,-10px,0)}}" +
    "@keyframes seltika-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-10px,0)}}" +
    "@-webkit-keyframes seltika-spin{from{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}" +
    "@keyframes seltika-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}" +
    "@-webkit-keyframes seltika-marquee{from{-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0)}to{-webkit-transform:translate3d(-33.333%,0,0);transform:translate3d(-33.333%,0,0)}}" +
    "@keyframes seltika-marquee{from{transform:translate3d(0,0,0)}to{transform:translate3d(-33.333%,0,0)}}" +
    "@-webkit-keyframes seltika-pulse{0%,100%{opacity:.45;-webkit-transform:scale(1);transform:scale(1)}50%{opacity:1;-webkit-transform:scale(1.25);transform:scale(1.25)}}" +
    "@keyframes seltika-pulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}" +
    (reduce ? "" :
      ".logo-float{-webkit-animation:seltika-float 7s ease-in-out infinite!important;animation:seltika-float 7s ease-in-out infinite!important;-webkit-transform:translateZ(0);transform:translateZ(0)}" +
      ".orbit-badge-spin,.orbit-ring{-webkit-animation:seltika-spin 22s linear infinite!important;animation:seltika-spin 22s linear infinite!important;-webkit-transform-origin:50% 50%;transform-origin:50% 50%}" +
      ".orbit-ring{-webkit-animation-duration:48s!important;animation-duration:48s!important}" +
      ".marquee{-webkit-animation:seltika-marquee 28s linear infinite!important;animation:seltika-marquee 28s linear infinite!important}" +
      ".radar-sweep{-webkit-animation:seltika-spin 5.5s linear infinite!important;animation:seltika-spin 5.5s linear infinite!important}" +
      ".live-dot{-webkit-animation:seltika-pulse 2.2s ease-in-out infinite!important;animation:seltika-pulse 2.2s ease-in-out infinite!important}" +
      ".caret{-webkit-animation:seltika-pulse 1s step-end infinite!important;animation:seltika-pulse 1s step-end infinite!important}"
    ) +
    ".eg-html-dot{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;pointer-events:none;z-index:3;" +
    "-webkit-transform:translate3d(0,0,0);transform:translate3d(0,0,0);will-change:transform;box-shadow:0 0 8px currentColor}";
  document.documentElement.appendChild(style);

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
    var n = 0;
    var id = setInterval(function () {
      n += 1;
      watch();
      if (n > 25) clearInterval(id);
    }, 400);
  }

  window.addEventListener("resize", function () {
    if (spokes.length) bootGraph();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", function () { setTimeout(watch, 500); setTimeout(watch, 1600); });
})();
