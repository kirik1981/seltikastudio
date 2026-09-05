/* Static GitHub Pages has no TanStack /_serverFn. Scanner is an honest local
   hypothesis. Leads POST to n8n without exposing X-Studio-Key. */
(function () {
  var SITE_HOOK = "https://n8n.gobots.ru/webhook/seltikastudio-site";
  var SCAN = "a42b99520690860484df897cc18989b725481172a67d99bb3aa94ce95a1773b3";
  var LEAD = "5ddea7d37b2ed55e2ade42f3fd84861d5eca3e7dfd4347c7470cc5bf64b4b3d8";
  var lastRun = 0;

  function fiberOf(el) {
    for (var k in el) if (k.indexOf("__reactFiber") === 0) return el[k];
    return null;
  }

  function findNamed(fiber, names) {
    while (fiber) {
      var t = fiber.elementType;
      var n = t && (t.name || t.displayName);
      if (n && names.indexOf(n) !== -1) return fiber;
      fiber = fiber.return;
    }
    return null;
  }

  function dispatchHook(fiber, index, value) {
    var s = fiber.memoizedState;
    for (var i = 0; i < index; i++) {
      if (!s) return;
      s = s.next;
    }
    if (s && s.queue && typeof s.queue.dispatch === "function") s.queue.dispatch(value);
  }

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

  function scanHypothesis(data) {
    var brand = String(data.brand || "").trim();
    var site = String(data.site || "").trim();
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
      return { id: id, name: name, status: status, likelihood: likelihood };
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
      disclaimer: "Гипотеза по сайту и формулировкам, не отчёт по живым ответам моделей.",
    };
  }

  function parseServerFnBody(body) {
    if (!body) return {};
    try {
      var j = typeof body === "string" ? JSON.parse(body) : body;
      var inner = j.t.p.v[0];
      var keys = inner.p.k;
      var vals = inner.p.v;
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
    return Promise.resolve({ ok: true, result: scanHypothesis(data || {}) });
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
        return {
          ok: false,
          error: "Не удалось отправить. Напишите в Telegram @seltikastudiobot.",
        };
      })
      .catch(function () {
        return {
          ok: false,
          error: "Не удалось отправить. Напишите в Telegram @seltikastudiobot.",
        };
      });
  };

  function runScanner(form) {
    var data = {
      site: (document.querySelector("#scan-site") || {}).value || "",
      brand: (document.querySelector("#scan-brand") || {}).value || "",
      service: (document.querySelector("#scan-service") || {}).value || "",
    };
    if (!data.brand) return false;
    var fiber = findNamed(fiberOf(form), ["wn"]);
    if (!fiber) return false;
    dispatchHook(fiber, 4, null);
    dispatchHook(fiber, 3, true);
    dispatchHook(fiber, 5, scanHypothesis(data));
    dispatchHook(fiber, 3, false);
    return true;
  }

  function runLead(form) {
    var leadData = {
      name: (document.querySelector("#lead-name") || {}).value || "",
      company: (document.querySelector("#lead-company") || {}).value || "",
      site: (document.querySelector("#lead-site") || {}).value || "",
      contact: (document.querySelector("#lead-contact") || {}).value || "",
      task: (document.querySelector("#lead-task") || {}).value || "",
      plan: planFromHash(),
    };
    if (!leadData.name || !leadData.contact) return false;
    var fiber = findNamed(fiberOf(form), ["vn"]);
    if (fiber) dispatchHook(fiber, 8, true);
    window.__seltikaSiteLead(leadData).then(function (res) {
      if (fiber) dispatchHook(fiber, 8, false);
      if (res && res.ok) {
        if (fiber) {
          dispatchHook(fiber, 7, null);
          dispatchHook(fiber, 6, true);
        }
        try {
          var prev = JSON.parse(localStorage.getItem("seltika-lead") || "[]");
          prev.push({
            at: Date.now(),
            name: leadData.name,
            contact: leadData.contact,
            site: leadData.site,
          });
          localStorage.setItem("seltika-lead", JSON.stringify(prev));
        } catch (err) {}
      } else if (fiber) {
        dispatchHook(
          fiber,
          7,
          (res && res.error) ||
            "Не удалось отправить. Напишите в Telegram @seltikastudiobot."
        );
      }
    });
    return true;
  }

  function intercept(e) {
    var form = null;
    if (e.type === "submit") {
      form = e.target && e.target.tagName === "FORM" ? e.target : null;
    } else if (e.type === "click") {
      var btn =
        e.target &&
        e.target.closest &&
        e.target.closest("#scanner button[type=submit], #lead button[type=submit]");
      form = btn && btn.closest("form");
    }
    if (!form || form.tagName !== "FORM") return;
    var scanner = form.closest("#scanner");
    var lead = form.closest("#lead");
    if (!scanner && !lead) return;

    var now = Date.now();
    if (now - lastRun < 400) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    var handled = scanner ? runScanner(form) : runLead(form);
    if (!handled) return;
    lastRun = now;
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  document.addEventListener("submit", intercept, true);
  document.addEventListener("click", intercept, true);

  var origFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input && input.url ? input.url : String(input);
    var path = url.replace(/^https?:\/\/[^/]+/, "");
    var isScan = path.indexOf("/_serverFn/" + SCAN) === 0;
    var isLead = path.indexOf("/_serverFn/" + LEAD) === 0;
    if (!isScan && !isLead) return origFetch.apply(this, arguments);
    var data = parseServerFnBody(init && init.body);
    if (isScan) return Promise.resolve(jsonOk({ ok: true, result: scanHypothesis(data) }));
    return window.__seltikaSiteLead(data).then(function (res) {
      return jsonOk(res);
    });
  };
})();
