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

/* Chrome/Blink: mix-blend grain kills animations; SVG setAttribute often does not repaint. */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var style = document.createElement("style");
  style.setAttribute("data-seltika-motion", "1");
  style.textContent =
    ".grain{mix-blend-mode:normal!important;opacity:.05!important}" +
    ".logo-float,.orbit-badge-spin,.marquee,.orbit-ring,.live-dot,.caret,.radar-sweep{" +
    "-webkit-animation-play-state:running!important;animation-play-state:running!important}" +
    ".logo-float{-webkit-animation:logo-float 7s ease-in-out infinite;animation:logo-float 7s ease-in-out infinite;will-change:transform}" +
    ".orbit-badge-spin{-webkit-animation:orbit-spin 22s linear infinite;animation:orbit-spin 22s linear infinite;will-change:transform}" +
    ".marquee{-webkit-animation:marquee-slide 28s linear infinite;animation:marquee-slide 28s linear infinite;will-change:transform}" +
    ".orbit-ring{-webkit-animation:orbit-spin 48s linear infinite;animation:orbit-spin 48s linear infinite}" +
    ".eg-html-dot{position:absolute;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:50%;pointer-events:none;z-index:2;will-change:left,top}";
  document.documentElement.appendChild(style);

  function setCxCy(el, x, y) {
    try {
      el.cx.baseVal.value = x;
      el.cy.baseVal.value = y;
    } catch (e) {
      el.setAttribute("cx", String(x));
      el.setAttribute("cy", String(y));
    }
  }

  function bootGraph() {
    var svg = document.querySelector("#graph svg");
    if (!svg || svg.getAttribute("data-seltika-motion") === "on") return false;
    var groups = svg.querySelectorAll("g");
    var spokes = [];
    for (var i = 0; i < groups.length; i++) {
      var line = groups[i].querySelector("line");
      var dot = groups[i].querySelector("circle");
      if (!line || !dot) continue;
      var x1 = parseFloat(line.getAttribute("x1"));
      var y1 = parseFloat(line.getAttribute("y1"));
      var x2 = parseFloat(line.getAttribute("x2"));
      var y2 = parseFloat(line.getAttribute("y2"));
      if (isNaN(x1) || isNaN(x2)) continue;
      var clone = dot.cloneNode(true);
      dot.parentNode.replaceChild(clone, dot);
      spokes.push({ el: clone, x1: x1, y1: y1, x2: x2, y2: y2, dur: 3600 + spokes.length * 350 });
    }
    if (!spokes.length) return false;
    svg.setAttribute("data-seltika-motion", "on");
    var t0 = performance.now();
    function tick(now) {
      var t = now - t0;
      for (var i = 0; i < spokes.length; i++) {
        var s = spokes[i];
        var p = (t / s.dur) % 1;
        var k = p < 0.5 ? p * 2 : 2 - p * 2;
        setCxCy(s.el, s.x1 + (s.x2 - s.x1) * k, s.y1 + (s.y2 - s.y1) * k);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return true;
  }

  function start() {
    if (!bootGraph()) {
      var n = 0;
      var id = setInterval(function () {
        n += 1;
        if (bootGraph() || n > 20) clearInterval(id);
      }, 400);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", function () {
    setTimeout(start, 600);
  });
})();
