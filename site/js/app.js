/* PURSUE UAP Video Map — renders site/data/records.json onto a Leaflet map. */
(async function () {
  // Theme-dependent colors; <html data-theme> is stamped by index.html before paint.
  const THEME = {
    dark:  { tiles: "dark_all",  bubble: "#4a94ef", ring: "#0f1115" },
    light: { tiles: "light_all", bubble: "#2f6fd0", ring: "#ffffff" },
  };
  const currentTheme = () =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark";
  const tileURL = (name) =>
    `https://{s}.basemaps.cartocdn.com/${THEME[name].tiles}/{z}/{x}/{y}{r}.png`;

  const data = await fetch("data/records.json", { cache: "no-store" }).then((r) => r.json());
  const { locations, records } = data;

  // ---------- map ----------
  const map = L.map("map", {
    zoomControl: true,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
  }).setView([28, 15], 2);
  const tiles = L.tileLayer(tileURL(currentTheme()), {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 12,
    noWrap: true,
    bounds: [[-90, -180], [90, 180]],
  }).addTo(map);

  // Never allow zooming out past "one world fills the viewport width",
  // so the map can't show duplicate world copies or gray bands.
  function fitMinZoom() {
    const minZoom = Math.ceil(Math.log2(map.getSize().x / 256));
    map.setMinZoom(minZoom);
    if (map.getZoom() < minZoom) map.setZoom(minZoom);
  }
  map.on("resize", fitMinZoom);
  fitMinZoom();

  const bubbleLayer = L.layerGroup().addTo(map);

  // Dashed precision circle: shown while hovering a bubble, and pinned
  // while that bubble's panel is open (so touch devices get it on tap).
  let precisionCircle = null;
  let pinnedLoc = null;

  function showCircle(loc) {
    clearCircle();
    precisionCircle = L.circle([loc.lat, loc.lng], {
      radius: loc.radius_km * 1000,
      color: THEME[currentTheme()].bubble,
      weight: 1.5,
      dashArray: "6 6",
      fill: false,
      interactive: false,
    }).addTo(map);
  }

  function clearCircle() {
    if (precisionCircle) { map.removeLayer(precisionCircle); precisionCircle = null; }
  }

  // ---------- filter state ----------
  const state = { agency: "", release: "", yearMin: null, yearMax: null, undated: true };

  const years = records.map((r) => r.year).filter(Boolean);
  const YEAR_LO = Math.min(...years);
  const YEAR_HI = Math.max(...years);
  state.yearMin = YEAR_LO;
  state.yearMax = YEAR_HI;

  function matches(rec) {
    if (state.agency && rec.agency !== state.agency) return false;
    if (state.release && rec.release !== state.release) return false;
    if (rec.year == null) return state.undated;
    return rec.year >= state.yearMin && rec.year <= state.yearMax;
  }

  // ---------- controls ----------
  const $ = (id) => document.getElementById(id);

  const agencies = [...new Set(records.map((r) => r.agency))].sort();
  for (const a of agencies) $("agency-select").add(new Option(a, a));

  const releases = [...new Set(records.map((r) => r.release))].sort(
    (a, b) => new Date(a) - new Date(b)
  );
  for (const rel of releases) $("release-select").add(new Option(`Release ${rel}`, rel));

  for (let y = YEAR_LO; y <= YEAR_HI; y++) {
    $("year-min").add(new Option(y, y));
    $("year-max").add(new Option(y, y));
  }
  $("year-min").value = YEAR_LO;
  $("year-max").value = YEAR_HI;

  $("agency-select").addEventListener("change", (e) => { state.agency = e.target.value; render(); });
  $("release-select").addEventListener("change", (e) => { state.release = e.target.value; render(); });
  $("year-min").addEventListener("change", (e) => { state.yearMin = +e.target.value; render(); });
  $("year-max").addEventListener("change", (e) => { state.yearMax = +e.target.value; render(); });
  $("undated").addEventListener("change", (e) => { state.undated = e.target.checked; render(); });

  // ---------- side panel ----------
  const panel = $("panel");
  $("panel-close").addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

  function closePanel() {
    panel.hidden = true;
    pinnedLoc = null;
    clearCircle();
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function recDetailHTML(rec) {
    let media = "";
    const links = [];
    if (rec.type === "VID" && rec.dvids_id) {
      media = `<div class="embed-box"><iframe loading="lazy" src="https://www.dvidshub.net/video/embed/${rec.dvids_id}" allowfullscreen title="DVIDS video player"></iframe></div>`;
      links.push(`<a href="https://www.dvidshub.net/video/${rec.dvids_id}" target="_blank" rel="noopener">View on DVIDS ↗</a>`);
    } else if (rec.type === "IMG" && (rec.thumb || rec.img_link)) {
      media = `<img class="rec-photo" loading="lazy" src="${rec.thumb || rec.img_link}" alt="${escapeHTML(rec.title)}">`;
      if (rec.img_link) links.push(`<a href="${rec.img_link}" target="_blank" rel="noopener">Full-size image ↗</a>`);
    }
    links.push(`<a href="https://www.war.gov/UFO/" target="_blank" rel="noopener">PURSUE record ↗</a>`);
    return `${media}<div class="blurb">${escapeHTML(rec.blurb || "No description provided.")}</div><div class="rec-links">${links.join("")}</div>`;
  }

  function openPanel(title, sub, recs) {
    $("panel-title").textContent = title;
    $("panel-sub").textContent = sub;
    const body = $("panel-body");
    body.innerHTML = "";
    for (const rec of recs) {
      const div = document.createElement("div");
      div.className = "rec";
      div.innerHTML = `
        <div class="rec-head">
          <span class="badge ${rec.type}">${rec.type === "VID" ? "VIDEO" : "IMAGE"}</span>
          <span class="rec-title">${escapeHTML(rec.title)}</span>
        </div>
        <div class="rec-meta">${rec.agency} · ${rec.date_raw || "date unknown"} · released ${rec.release}${rec.location_raw ? " · “" + escapeHTML(rec.location_raw) + "”" : ""}</div>
        <div class="rec-detail"></div>`;
      div.addEventListener("click", (e) => {
        if (e.target.closest("a, iframe, .rec-detail")) return;
        const wasOpen = div.classList.contains("open");
        body.querySelectorAll(".rec.open").forEach((el) => {
          el.classList.remove("open");
          el.querySelector(".rec-detail").innerHTML = ""; // unload iframe
        });
        if (!wasOpen) {
          div.classList.add("open");
          div.querySelector(".rec-detail").innerHTML = recDetailHTML(rec);
        }
      });
      body.appendChild(div);
    }
    panel.hidden = false;
  }

  // ---------- bubbles ----------
  function render() {
    bubbleLayer.clearLayers();
    pinnedLoc = null;
    clearCircle();

    const byLoc = new Map();
    let shown = 0;
    for (const rec of records) {
      if (!matches(rec)) continue;
      shown++;
      if (rec.location == null || rec.loc_kind === "offworld") continue;
      if (!byLoc.has(rec.location)) byLoc.set(rec.location, []);
      byLoc.get(rec.location).push(rec);
    }

    for (const [locKey, recs] of byLoc) {
      const loc = locations[locKey];
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 6 + 3.2 * Math.sqrt(recs.length),
        color: THEME[currentTheme()].ring,
        weight: 2,
        fillColor: THEME[currentTheme()].bubble,
        fillOpacity: 0.85,
      }).addTo(bubbleLayer);

      marker.bindTooltip(
        `<strong>${escapeHTML(loc.label)}</strong><br>${recs.length} record${recs.length > 1 ? "s" : ""} · ±${loc.radius_km} km`,
        { className: "loc-tip", direction: "top", offset: [0, -6] }
      );

      marker.on("mouseover", () => { if (!pinnedLoc) showCircle(loc); });
      marker.on("mouseout", () => { if (!pinnedLoc) clearCircle(); });

      marker.on("click", () => {
        pinnedLoc = loc;
        showCircle(loc);
        openPanel(
          loc.label,
          `${recs.length} record${recs.length > 1 ? "s" : ""} · location precision: ±${loc.radius_km} km`,
          recs.sort((a, b) => (b.year || 0) - (a.year || 0))
        );
      });
    }

    // shelf + counter
    const off = records.filter((r) => matches(r) && r.loc_kind === "offworld");
    const un = records.filter((r) => matches(r) && r.location == null);
    $("offworld-count").textContent = off.length;
    $("unmapped-count").textContent = un.length;
    $("rail-count").innerHTML =
      `<b>${shown}</b> records · <b>${shown - off.length - un.length}</b> mapped<br><b>${byLoc.size}</b> locations shown`;

    $("offworld-btn").onclick = () =>
      openPanel("Off-world records", `${off.length} records observed beyond Earth's surface`,
        off.sort((a, b) => (b.year || 0) - (a.year || 0)));
    $("unmapped-btn").onclick = () =>
      openPanel("Records without a usable location", `${un.length} records with no location stated`,
        un.sort((a, b) => (b.year || 0) - (a.year || 0)));
  }

  // ---------- theme toggle ----------
  const themeBtn = $("theme-toggle");

  function syncThemeBtn() {
    const dark = currentTheme() === "dark";
    themeBtn.textContent = dark ? "☀" : "☾";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  themeBtn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    const T = THEME[next];
    tiles.setUrl(tileURL(next));
    bubbleLayer.eachLayer((m) => m.setStyle({ color: T.ring, fillColor: T.bubble }));
    if (precisionCircle) precisionCircle.setStyle({ color: T.bubble });
    syncThemeBtn();
  });
  syncThemeBtn();

  render();
})();
