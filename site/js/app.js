/* PURSUE UAP Map — renders site/data/records.json onto a Leaflet map. */
(async function () {
  const KIND_COLOR = { point: "#3987e5", region: "#199e70", aor: "#9085e9" };

  const data = await fetch("data/records.json", { cache: "no-store" }).then((r) => r.json());
  const { locations, records } = data;

  // ---------- map ----------
  const map = L.map("map", {
    zoomControl: true,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
  }).setView([28, 15], 2);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
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
  let precisionCircle = null;

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

  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- bubbles ----------
  function render() {
    bubbleLayer.clearLayers();
    if (precisionCircle) { map.removeLayer(precisionCircle); precisionCircle = null; }

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
      const color = KIND_COLOR[loc.kind];
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 6 + 3.2 * Math.sqrt(recs.length),
        color: "#1a1a19",
        weight: 2,
        fillColor: color,
        fillOpacity: 0.85,
      }).addTo(bubbleLayer);

      marker.bindTooltip(
        `<strong>${escapeHTML(loc.label)}</strong><br>${recs.length} record${recs.length > 1 ? "s" : ""} · ±${loc.radius_km} km`,
        { className: "loc-tip", direction: "top", offset: [0, -6] }
      );

      marker.on("click", () => {
        if (precisionCircle) map.removeLayer(precisionCircle);
        precisionCircle = L.circle([loc.lat, loc.lng], {
          radius: loc.radius_km * 1000,
          color: color,
          weight: 1.5,
          dashArray: "6 6",
          fill: false,
          interactive: false,
        }).addTo(map);
      });
    }

    // shelf + counter
    const off = records.filter((r) => matches(r) && r.loc_kind === "offworld");
    const un = records.filter((r) => matches(r) && r.location == null);
    $("offworld-count").textContent = off.length;
    $("unmapped-count").textContent = un.length;
    $("count-pill").textContent = `${shown} of ${records.length} records`;
  }

  render();
})();
