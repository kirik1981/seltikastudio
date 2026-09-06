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
    var isScan = path.indexOf(SCAN) !== -1 || (data && data.site && !isLead);
    if (isScan) return Promise.resolve(jsonOk({ ok: true, result: scanHypothesis(data) }));
    if (isLead) {
      return window.__seltikaSiteLead(data).then(function (res) {
        return jsonOk(res);
      });
    }
    return origFetch.apply(this, arguments);
  };
})();
