/* ==========================================================
   Au Feu Du Plaisir — interactions
   Données : config.js (infos pratiques) · i18n.js (textes + menu)
   ========================================================== */
(function () {
  const LANGS = ["el", "fr", "en"];
  const LOCALE = { el: "el-GR", fr: "fr-FR", en: "en-GB" };
  let lang = "el";
  let activeCat = MENU[0].cat;

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
  const t = (key) => (I18N[lang] && I18N[lang][key]) ?? I18N.fr[key] ?? "";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Outils date / heure ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const toHHMM = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const weekday = (dayIndex, style = "long") =>
    new Intl.DateTimeFormat(LOCALE[lang], { weekday: style }).format(new Date(2024, 0, 7 + dayIndex)); // 7 janv. 2024 = dimanche
  const longDate = (d) => new Intl.DateTimeFormat(LOCALE[lang], { weekday: "long", day: "numeric", month: "long" }).format(d);

  /* ---------- Langue ---------- */
  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem("lang");
      if (LANGS.includes(saved)) return saved;
    } catch (e) { /* stockage indisponible */ }
    const nav = (navigator.language || "el").slice(0, 2);
    return LANGS.includes(nav) ? nav : "el";
  }

  function setLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.title = t(document.body.dataset.titleKey || "meta.title");
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem("lang", lang); } catch (e) { /* ignore */ }
    renderMenu();
    renderDaily();
    renderAgenda();
    renderHours();
    renderToday();
    renderOrder();
    renderCatering();
    renderTeam();
    refreshBookingFields();
  }

  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* ---------- Menu ---------- */
  const price = (p) => p == null ? t("menu.ask")
    : new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency: "EUR", minimumFractionDigits: p % 1 ? 2 : 0 }).format(p);
  const originChip = (o) => o ? `<span class="origin"><span class="flag flag--sm flag--${o}"></span>${t("origin." + o)}</span>` : "";

  function renderMenu() {
    const tabs = $("#menuTabs");
    if (!tabs) return;
    tabs.innerHTML = MENU.map((c) =>
      `<button type="button" role="tab" aria-selected="${c.cat === activeCat}" data-cat="${c.cat}">${t("cat." + c.cat)}</button>`
    ).join("");
    $$("button", tabs).forEach((b) => b.addEventListener("click", () => { activeCat = b.dataset.cat; renderMenu(); }));

    const cat = MENU.find((c) => c.cat === activeCat);
    $("#menuList").innerHTML = cat.items.map((it) => `
      <article class="dish">
        <div class="dish__top">
          <h3 class="dish__name">${it.name}</h3>
          <span class="dish__dots" aria-hidden="true"></span>
          <span class="dish__price">${price(it.price)}</span>
        </div>
        ${it.origin || it.tags.length ? `<div class="dish__meta">${originChip(it.origin)}${it.tags.map((tg) => `<span class="tag${tg === "veg" ? " tag--veg" : ""}">${t("tag." + tg)}</span>`).join("")}</div>` : ""}
        <p class="dish__desc">${it.d[lang]}</p>
      </article>`).join("");
  }

  /* ---------- Plat du jour ---------- */
  function renderDaily() {
    const today = new Date().getDay();
    const dish = CONFIG.daily[today];
    const box = $("#heroDaily");
    if (!box) return;
    box.hidden = !dish;
    if (!dish) return;
    box.innerHTML = `
      <p class="hero__daily-label"><span>${t("daily.label")}</span><span>${weekday(today)}</span></p>
      <h3>${dish.name}</h3>
      <p>${dish.d[lang]}</p>
      <div class="hero__daily-foot">${originChip(dish.origin)}<span class="hero__daily-price">${price(dish.price)}</span></div>`;
  }

  /* ---------- Horaires du jour (barre du haut) ---------- */
  function renderToday() {
    const day = new Date().getDay();
    const { restaurant: r, night: n } = CONFIG.hours;
    const parts = [];
    if (r.days.includes(day)) parts.push(`${r.open} – ${r.close}`);
    if (n.days.includes(day)) parts.push(`${t("contact.night")} ${n.open} – ${n.close}`);
    $("#todayHours").textContent = parts.length ? `${t("top.today")} · ${parts.join(" · ")}` : t("top.closed");
  }

  /* ---------- Agenda des soirées ---------- */
  function renderAgenda() {
    const todayISO = isoDate(new Date());
    const upcoming = CONFIG.events.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
    const box = $("#agenda");
    if (!box) return;
    if (!upcoming.length) {
      box.innerHTML = `<p class="agenda__empty"><a href="${CONFIG.instagram}" target="_blank" rel="noopener">${t("nights.empty")}</a></p>`;
      return;
    }
    box.innerHTML = upcoming.map((e) => {
      const d = parseISO(e.date);
      const month = new Intl.DateTimeFormat(LOCALE[lang], { month: "short" }).format(d);
      return `<div class="event">
        <div class="event__date">${weekday(d.getDay(), "short")}<strong>${d.getDate()}</strong>${month}</div>
        <div><h4>${esc(e.title[lang] || e.title.fr)}</h4><p>${esc((e.desc && (e.desc[lang] || e.desc.fr)) || "")}</p></div>
        <span class="event__time">${esc(e.time || "")}</span>
      </div>`;
    }).join("");
  }

  /* ---------- Horaires (générés depuis config.js) ---------- */
  const WEEK = [1, 2, 3, 4, 5, 6, 0]; // lundi → dimanche
  function dayRanges(days) {
    const runs = [];
    WEEK.forEach((d) => {
      if (!days.includes(d)) return;
      const last = runs[runs.length - 1];
      if (last && WEEK.indexOf(d) === WEEK.indexOf(last[last.length - 1]) + 1) last.push(d);
      else runs.push([d]);
    });
    return runs.map((r) => r.length > 2 ? `${weekday(r[0])} – ${weekday(r[r.length - 1])}` : r.map((d) => weekday(d)).join(", ")).join(", ");
  }
  function renderHours() {
    const { restaurant: r, night: n } = CONFIG.hours;
    const closed = WEEK.filter((d) => !r.days.includes(d) && !n.days.includes(d));
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    let html = `
      <tr><th colspan="2">${t("contact.kitchen")}</th></tr>
      <tr><td>${cap(dayRanges(r.days))}</td><td>${r.open} – ${r.close}</td></tr>
      <tr><th colspan="2">${t("contact.night")}</th></tr>
      <tr><td>${cap(dayRanges(n.days))}</td><td>${n.open} – ${n.close}</td></tr>`;
    if (closed.length) html += `<tr class="hours__closed"><td>${cap(dayRanges(closed))}</td><td>${t("days.closed")}</td></tr>`;
    $$(".js-hours").forEach((el) => { el.innerHTML = html; });
  }

  /* ---------- Commande à emporter / livraison ---------- */
  function renderCatering() {
    if (!$("#caterWa")) return;
    $("#caterWa").href = `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(t("cater.waText"))}`;
    $("#caterMail").href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(t("cater.mailSubject"))}&body=${encodeURIComponent(t("cater.waText"))}`;
  }

  function renderOrder() {
    if (!$("#orderWa")) return;
    $("#orderWa").href = `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(t("order.waText"))}`;
    const list = CONFIG.delivery.filter((p) => p.url);
    $("#platforms").hidden = !list.length;
    $("#platformList").innerHTML = list.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join("");
  }

  /* ---------- Équipe (page equipe.html, données dans config.js) ---------- */
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  function renderTeam() {
    const grid = $("#teamGrid");
    if (!grid) return;
    const f = CONFIG.team.founder;
    $("#founderName").textContent = f.name;
    $("#founderRole").textContent = f.role[lang];
    $("#founderBio").textContent = f.bio[lang];
    grid.innerHTML = CONFIG.team.members.map((m) => {
      const avatar = m.photo
        ? `<img class="member__photo" src="${esc(m.photo)}" alt="${esc(m.name || "")}" loading="lazy" width="96" height="96">`
        : `<span class="member__photo member__photo--empty" aria-hidden="true">${m.name ? esc(initials(m.name))
            : '<svg class="i" width="34" height="34"><use href="#i-user"/></svg>'}</span>`;
      return `<article class="member glass">
        ${avatar}
        <p class="member__role">${esc(m.role[lang])}</p>
        <h3 class="member__name">${esc(m.name || t("team.tbd"))}</h3>
        <p class="member__bio">${esc(m.bio[lang])}</p>
        ${m.langs ? `<p class="member__langs"><svg class="i" width="16" height="16" aria-hidden="true"><use href="#i-globe"/></svg>${esc(m.langs)}</p>` : ""}
      </article>`;
    }).join("");
    if (typeof observeShine === "function") observeShine();
    $("#joinMail").href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(t("team.joinSubject") + " — Au Feu Du Plaisir")}`;
  }

  /* ---------- Header au scroll + menu mobile ---------- */
  const burger = $("#burger"), nav = $("#nav");
  const closeNav = () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", closeNav));

  /* Lien actif selon la section visible */
  const links = $$('.nav a[href^="#"]:not(.btn)');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + (e.target.dataset.nav || e.target.id)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* ---------- Reflet de lumière sur les cartes (écrans tactiles : à l'apparition) ---------- */
  const shine = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("en-vue"); shine.unobserve(e.target); } });
  }, { threshold: 0.6 });
  const observeShine = () => $$(".member, .value, .ocard, .nlist li, .offers li").forEach((el) => shine.observe(el));
  observeShine();

  /* ---------- Photos : masque l'étiquette quand l'image existe ---------- */
  $$(".photo").forEach((el) => {
    const m = /url\(['"]?([^'")]+)/.exec(el.style.backgroundImage);
    if (!m) return;
    const img = new Image();
    img.onload = () => el.classList.add("has-img");
    img.src = m[1];
  });

  /* ==========================================================
     OUTIL DE RÉSERVATION EN LIGNE
     ========================================================== */
  const form = $("#bookingForm");
  let refreshBookingFields = () => {};
  if (form) {
    const F = form.elements;
    const okBox = $("#bookingOk");
    const submitBtn = $("#submitBtn");
    const useApi = Boolean(CONFIG.web3formsKey);
    const bookingType = () => form.querySelector('input[name="type"]:checked').value;

    F.date.min = isoDate(new Date());

    /* Jours d'ouverture et créneaux selon le type */
    function scheduleFor(type) {
      const { restaurant: r, night: n } = CONFIG.hours;
      if (type === "night") return [n];
      if (type === "event") return [r, n];
      return [r];
    }

    function slotsFor(type, dateStr) {
      const d = parseISO(dateStr);
      const day = d.getDay();
      const step = CONFIG.slotMinutes;
      const out = [];
      scheduleFor(type).forEach((s) => {
        if (!s.days.includes(day)) return;
        const start = toMin(s.open);
        let end = toMin(s.close);
        if (end <= start) end += 24 * 60;           // ouverture après minuit (club)
        const lastSlot = end - (s === CONFIG.hours.night ? 120 : 60); // dernière réservation possible
        for (let m = start; m <= lastSlot; m += step) out.push(m);
      });
      const slots = [...new Set(out)].sort((a, b) => a - b);
      // Aujourd'hui : on retire les créneaux déjà passés (+30 min de marge)
      if (dateStr !== isoDate(new Date())) return slots;
      const now = new Date();
      return slots.filter((m) => m >= now.getHours() * 60 + now.getMinutes() + 30);
    }

    let guestsType = null;
    function fillGuests() {
      const type = bookingType();
      const prev = type === guestsType ? F.guests.value : "";
      guestsType = type;
      const opts = type === "event"
        ? [10, 15, 20, 30, 40, 50, "50+"]
        : [...Array(CONFIG.maxGuests).keys()].map((i) => i + 1);
      F.guests.innerHTML = opts.map((v) => `<option value="${v}">${v}</option>`).join("");
      F.guests.value = opts.map(String).includes(prev) ? prev : (type === "event" ? "20" : "2");
    }

    function fillTimes() {
      const type = bookingType();
      const closedMsg = $("#closedMsg");
      const prev = F.time.value;
      if (!F.date.value) {
        F.time.innerHTML = `<option value="">${t("form.noSlot")}</option>`;
        F.time.disabled = true;
        closedMsg.hidden = true;
        return;
      }
      const slots = slotsFor(type, F.date.value);
      closedMsg.hidden = slots.length > 0;
      F.time.disabled = !slots.length;
      F.time.innerHTML = slots.length
        ? slots.map((m) => `<option value="${toHHMM(m)}">${toHHMM(m)}</option>`).join("")
        : `<option value="">—</option>`;
      if (slots.map(toHHMM).includes(prev)) F.time.value = prev;
    }

    refreshBookingFields = function () {
      fillGuests();
      fillTimes();
      $("#msgLabel").textContent = t(bookingType() === "event" ? "form.msgEvent" : "form.msg");
      submitBtn.textContent = t(useApi ? "form.submit" : "form.sendWa");
    };

    $$('input[name="type"]', form).forEach((r) => r.addEventListener("change", refreshBookingFields));
    F.date.addEventListener("change", fillTimes);

    /* Liens "Réserver pour une soirée" / "Demander un devis" → présélection du type */
    $$("[data-book-type]").forEach((a) => a.addEventListener("click", () => {
      const radio = form.querySelector(`input[name="type"][value="${a.dataset.bookType}"]`);
      radio.checked = true;
      refreshBookingFields();
    }));

    function collect() {
      const data = Object.fromEntries(new FormData(form));
      return {
        type: t("type." + data.type),
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || "—",
        date: longDate(parseISO(data.date)),
        time: data.time,
        guests: data.guests,
        msg: data.msg.trim() || "—"
      };
    }
    const message = (d) => t("form.body").replace(/\{(\w+)\}/g, (_, k) => d[k]);
    const waLink = (d) => `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(message(d))}`;

    function showSuccess(d) {
      const rows = [["form.type", d.type], ["form.date", d.date], ["form.time", d.time], ["form.guests", d.guests], ["form.name", d.name]];
      $("#recap").innerHTML = rows.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join("");
      form.hidden = true;
      okBox.hidden = false;
      okBox.focus();
    }

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      $(".form__fallback", form)?.remove();

      const required = $$("[required]", form);
      required.forEach((f) => (f.type === "checkbox" ? f.closest("label") : f).classList.toggle("is-invalid", !f.checkValidity()));
      const invalid = required.find((f) => !f.checkValidity());
      $("#formError").hidden = !invalid;
      if (invalid) { invalid.focus(); return; }

      const d = collect();
      if (F.botcheck.checked) { showSuccess(d); return; } // robot : on ignore silencieusement

      if (!useApi) {
        window.open(waLink(d), "_blank", "noopener");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = t("form.sending");
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: CONFIG.web3formsKey,
            subject: `${t("form.subject")} — ${d.type} — ${d.date} ${d.time} (${d.guests})`,
            from_name: "Au Feu Du Plaisir — site web",
            replyto: d.email !== "—" ? d.email : undefined,
            Type: d.type, Nom: d.name, Telephone: d.phone, Email: d.email,
            Date: d.date, Heure: d.time, Personnes: d.guests, Message: d.msg, Langue: lang.toUpperCase()
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        showSuccess(d);
      } catch (err) {
        const p = document.createElement("p");
        p.className = "form__fallback";
        p.innerHTML = `${t("form.fail")} <a href="${waLink(d)}" target="_blank" rel="noopener">WhatsApp →</a>`;
        $(".form__actions", form).after(p);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = t("form.submit");
      }
    });

    form.addEventListener("input", (e) => (e.target.type === "checkbox" ? e.target.closest("label") : e.target).classList.remove("is-invalid"));

    $("#againBtn").addEventListener("click", () => {
      form.reset();
      okBox.hidden = true;
      form.hidden = false;
      refreshBookingFields();
    });
  }

  /* ---------- Carte Google (chargée au clic, RGPD) ---------- */
  $("#loadMap")?.addEventListener("click", () => {
    $("#map").innerHTML = '<iframe title="Google Maps — Au Feu Du Plaisir" loading="lazy" referrerpolicy="no-referrer-when-downgrade" ' +
      'src="https://maps.google.com/maps?q=Agiou%20Meletiou%2073%2C%2011251%20Athens&z=16&output=embed"></iframe>';
  });

  $("#year").textContent = new Date().getFullYear();

  setLang(detectLang());
})();
