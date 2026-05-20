import { t, type Lang } from './i18n.js';
import { renderLayout } from './layout.js';

/**
 * Embedded OpenStreetMap + Leaflet preview. Pulls station data from the
 * bridge's own `/stations/search` endpoint via fetch from the browser.
 * Zero build step — Leaflet served from CDN.
 */
const SCRIPT = /* js */ `
  const MONTEVIDEO = [-34.9061, -56.1990];
  const COLORS = {
    'available': '#10b981',
    'charging':  '#3b82f6',
    'no-comm':   '#94a3b8',
    'unavailable': '#ef4444',
  };
  const STATUS_TEXT = {
    'Disponible': 'available',
    'Cargando': 'charging',
    'Sin Comunicación': 'no-comm',
    'No Disponible': 'unavailable',
    'Available': 'available',
    'Charging': 'charging',
    'NoComm': 'no-comm',
    'Unavailable': 'unavailable',
  };

  function normStatus(s) {
    if (s === 0 || s === '0') return 'available';
    if (s === 1 || s === '1') return 'charging';
    if (s === 2 || s === '2') return 'no-comm';
    if (s === 3 || s === '3') return 'unavailable';
    return STATUS_TEXT[s] ?? 'no-comm';
  }

  const map = L.map('map', { scrollWheelZoom: true }).setView(MONTEVIDEO, 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const layerGroup = L.layerGroup().addTo(map);
  let userMarker = null;

  function pinIcon(color) {
    return L.divIcon({
      className: 'pin',
      html: '<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="' + color + '" stroke="#0b0b10" stroke-width="1.5"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>',
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -32],
    });
  }

  function getFormFilters() {
    const get = (name) => Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map((c) => c.value);
    return {
      connectorTypes: get('connectorTypes'),
      statuses: get('statuses'),
      paymentTypes: get('paymentTypes'),
      cables: get('cables'),
      networks: get('networks'),
    };
  }

  function setSummary(text) { document.getElementById('summary').textContent = text; }
  function setLoading(on) { document.getElementById('btn-load').textContent = on ? 'Cargando…' : 'Aplicar filtros'; document.getElementById('btn-load').disabled = on; }

  async function load() {
    setLoading(true);
    setSummary('Consultando bridge…');
    const filters = getFormFilters();
    try {
      const t0 = performance.now();
      const r = await fetch('/stations/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(filters),
      });
      const elapsed = Math.round(performance.now() - t0);
      const json = await r.json();
      const data = (json && json.data) || [];
      layerGroup.clearLayers();
      let plotted = 0;
      const bounds = [];
      for (const s of data) {
        if (typeof s.lat !== 'number' || typeof s.lng !== 'number') continue;
        plotted += 1;
        const status = normStatus(s.statusDetails ?? s.status);
        const marker = L.marker([s.lat, s.lng], { icon: pinIcon(COLORS[status] || '#94a3b8') });
        const popup = '<strong>' + (s.name || 'Estación') + '</strong><br>' +
          '<span style="font-size:11px;color:#64748b">' + (s.chargeNetworkName || '') + ' · ' + status + '</span><br>' +
          '<span style="font-size:11px;color:#64748b">' + s.lat.toFixed(4) + ', ' + s.lng.toFixed(4) + '</span>';
        marker.bindPopup(popup);
        marker.addTo(layerGroup);
        bounds.push([s.lat, s.lng]);
      }
      if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      setSummary(plotted + ' estaciones · ' + elapsed + ' ms · filtros: ' +
        Object.entries(filters).filter(([_, v]) => v.length).map(([k, v]) => k + '=' + v.join(',')).join(' · '));
    } catch (e) {
      setSummary('Error: ' + (e && e.message ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) { alert('Geolocalización no disponible'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      map.setView(ll, 14);
      if (userMarker) userMarker.remove();
      userMarker = L.circleMarker(ll, { radius: 8, color: '#a78bfa', fillColor: '#a78bfa', fillOpacity: 0.7 }).addTo(map);
      userMarker.bindPopup('Tu ubicación').openPopup();
    }, (err) => alert('Error: ' + err.message), { enableHighAccuracy: true, timeout: 8000 });
  }

  // --- snippet panel ---
  function renderSnippet() {
    const lang = document.querySelector('input[name="lang"]:checked').value;
    const filters = getFormFilters();
    const code = SNIPPETS[lang](filters);
    document.getElementById('snippet-code').textContent = code;
  }
  const SNIPPETS = {
    ts: (f) => "import { UteMueveClient } from '@ute-mueve/sdk';\\n\\n// Modo directo (Node) — sin baseUrl. SDK maneja token + uniquekeyuser.\\nconst client = new UteMueveClient();\\nconst result = await client.stations.search(" + JSON.stringify(f, null, 2) + ");\\nconsole.log(result.data);",
    js: (f) => "import { UteMueveClient } from '@ute-mueve/sdk';\\n\\n// Modo directo (Node) — sin baseUrl. SDK maneja token + uniquekeyuser.\\nconst client = new UteMueveClient();\\nconst result = await client.stations.search(" + JSON.stringify(f, null, 2) + ");\\nconsole.log(result.data);",
    fetch: (f) => "const res = await fetch('https://ute-mueve.vercel.app/stations/search', {\\n  method: 'POST',\\n  headers: { 'content-type': 'application/json' },\\n  body: JSON.stringify(" + JSON.stringify(f, null, 2) + ")\\n});\\nconst { data } = await res.json();\\nconsole.log(data);",
    curl: (f) => "curl -X POST https://ute-mueve.vercel.app/stations/search \\\\\\n  -H 'content-type: application/json' \\\\\\n  -d '" + JSON.stringify(f) + "'",
    get: (f) => {
      const params = [];
      if (f.connectorTypes?.length) params.push('types=' + f.connectorTypes.join(','));
      if (f.statuses?.length) params.push('statuses=' + f.statuses.join(','));
      if (f.paymentTypes?.length) params.push('payments=' + f.paymentTypes.join(','));
      if (f.cables?.length) params.push('cables=' + f.cables.join(','));
      if (f.networks?.length) params.push('networks=' + f.networks.join(','));
      const qs = params.length ? '?' + encodeURI(params.join('&')) : '';
      return "curl 'https://ute-mueve.vercel.app/stations" + qs + "'";
    },
    python: (f) => "import httpx\\n\\nr = httpx.post(\\n    'https://ute-mueve.vercel.app/stations/search',\\n    json=" + JSON.stringify(f, null, 2).replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None') + ",\\n)\\nprint(r.json()['data'])",
  };

  document.getElementById('btn-copy').addEventListener('click', async () => {
    const txt = document.getElementById('snippet-code').textContent;
    try { await navigator.clipboard.writeText(txt); document.getElementById('btn-copy').textContent = 'Copiado!'; setTimeout(() => { document.getElementById('btn-copy').textContent = 'Copiar'; }, 1500); } catch {}
  });
  document.querySelectorAll('input[name="lang"]').forEach((r) => r.addEventListener('change', renderSnippet));

  document.getElementById('btn-load').addEventListener('click', () => { load(); renderSnippet(); });
  document.getElementById('btn-locate').addEventListener('click', locate);
  document.getElementById('btn-reset').addEventListener('click', () => {
    document.querySelectorAll('#filters input[type="checkbox"]').forEach((c) => { c.checked = c.dataset.default === 'true'; });
    load();
    renderSnippet();
  });
  document.querySelectorAll('#filters input[type="checkbox"]').forEach((c) => c.addEventListener('change', () => { load(); renderSnippet(); }));

  load();
  renderSnippet();
`;

const STYLES = /* css */ `
  .map-shell { display: grid; grid-template-columns: 320px 1fr; gap: 16px; min-height: 70vh; }
  @media (max-width: 800px) { .map-shell { grid-template-columns: 1fr; } }
  .map-sidebar { background: var(--bg-elev); border: 1px solid var(--border); border-radius: 14px; padding: 16px; max-height: 75vh; overflow-y: auto; }
  .map-container { background: var(--bg-elev); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; min-height: 500px; }
  #map { width: 100%; height: 100%; min-height: 500px; }
  .filter-group { margin-bottom: 16px; }
  .filter-group h4 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--fg-muted); }
  .filter-group label { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 14px; cursor: pointer; user-select: none; }
  .filter-group input[type="checkbox"] { accent-color: var(--accent); }
  .map-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .map-actions button { flex: 1; min-width: 100px; background: var(--accent); color: #fff; border: none; padding: 8px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 500; }
  .map-actions button:hover { background: var(--accent-strong); }
  .map-actions button.ghost { background: transparent; color: var(--fg); border: 1px solid var(--border); }
  .map-actions button.ghost:hover { background: var(--bg-elev-2); }
  .map-actions button:disabled { opacity: 0.5; cursor: wait; }
  .map-summary { padding: 8px 12px; background: var(--bg-elev-2); border-radius: 8px; font-size: 12px; color: var(--fg-muted); margin-bottom: 12px; word-break: break-word; }
  .map-legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; color: var(--fg-muted); margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .map-legend .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; vertical-align: middle; }
  .snippet-shell { margin-top: 24px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .snippet-tabs { display: flex; flex-wrap: wrap; gap: 0; border-bottom: 1px solid var(--border); background: var(--bg-elev-2); }
  .snippet-tabs label { padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--fg-muted); border-bottom: 2px solid transparent; transition: all 120ms ease; user-select: none; }
  .snippet-tabs label:hover { color: var(--fg); }
  .snippet-tabs input[type="radio"] { display: none; }
  .snippet-tabs input[type="radio"]:checked + label { color: var(--accent); border-bottom-color: var(--accent); background: var(--bg-elev); }
  .snippet-body { position: relative; }
  .snippet-body pre { margin: 0; border-radius: 0; border: none; padding: 20px; }
  .snippet-copy { position: absolute; top: 12px; right: 12px; background: var(--bg-elev-2); border: 1px solid var(--border); color: var(--fg); padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; }
  .snippet-copy:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
  .snippet-footer { padding: 12px 20px; border-top: 1px solid var(--border); background: var(--bg-elev-2); font-size: 12px; color: var(--fg-muted); display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
  .snippet-footer a { color: var(--accent); }
  /* Leaflet tweaks for dark mode */
  .leaflet-container { background: #0b0b10; }
  @media (prefers-color-scheme: light) { .leaflet-container { background: #f1f5f9; } }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: var(--bg-elev); color: var(--fg); border: 1px solid var(--border); }
  .leaflet-popup-content { font-family: inherit; margin: 8px 12px; line-height: 1.4; }
`;

const FILTER_GROUPS: Array<{
  name: string;
  label: string;
  options: Array<{ value: string; label: string; default?: boolean }>;
}> = [
  {
    name: 'connectorTypes',
    label: 'Tipo de conector',
    options: [
      { value: 'Tipo 2', label: 'Tipo 2 (AC)', default: true },
      { value: 'CCS2', label: 'CCS2 (DC)', default: true },
      { value: 'CHAdeMO', label: 'CHAdeMO (DC)', default: true },
      { value: 'GB/T', label: 'GB/T (DC)', default: true },
    ],
  },
  {
    name: 'statuses',
    label: 'Estado',
    options: [
      { value: 'available', label: 'Disponible', default: true },
      { value: 'charging', label: 'Cargando', default: false },
      { value: 'no-comm', label: 'Sin comunicación', default: false },
      { value: 'unavailable', label: 'No disponible', default: false },
    ],
  },
  {
    name: 'networks',
    label: 'Red',
    options: [
      { value: 'PUBLIC', label: 'Pública', default: true },
      { value: 'TAXI', label: 'Taxi', default: false },
      { value: 'DMC', label: 'DMC', default: false },
      { value: 'ONE', label: 'eOne', default: false },
    ],
  },
  {
    name: 'paymentTypes',
    label: 'Método de pago',
    options: [
      { value: 'app', label: 'App', default: true },
      { value: 'rfid', label: 'Tarjeta RFID', default: true },
    ],
  },
  {
    name: 'cables',
    label: 'Cable',
    options: [
      { value: 'with', label: 'Con cable', default: true },
      { value: 'without', label: 'Sin cable', default: true },
    ],
  },
];

function renderFilterGroups(): string {
  return FILTER_GROUPS.map(
    (g) => `
    <div class="filter-group">
      <h4>${g.label}</h4>
      ${g.options
        .map(
          (o) =>
            `<label><input type="checkbox" name="${g.name}" value="${o.value}" data-default="${o.default ? 'true' : 'false'}"${o.default ? ' checked' : ''} /> ${o.label}</label>`,
        )
        .join('')}
    </div>`,
  ).join('');
}

export function renderMap(lang: Lang): string {
  const s = t(lang);
  const langSnippet = lang === 'es' ? '/* es */' : '/* en */';
  void langSnippet;
  const body = `
    <section style="padding-top: 24px;">
      <h2 style="margin: 0 0 8px;">${s.map.title}</h2>
      <p style="color: var(--fg-muted); margin: 0 0 16px;">${s.map.intro}</p>
    </section>

    <section>
      <div class="map-shell">
        <aside class="map-sidebar">
          <div class="map-actions">
            <button id="btn-load">${s.map.apply}</button>
            <button id="btn-locate" class="ghost">${s.map.locate}</button>
            <button id="btn-reset" class="ghost">${s.map.reset}</button>
          </div>
          <div id="summary" class="map-summary">${s.map.loading}</div>
          <form id="filters" onsubmit="event.preventDefault();">
            ${renderFilterGroups()}
          </form>
          <div class="map-legend">
            <span><span class="dot" style="background:#10b981"></span>${s.map.legendAvailable}</span>
            <span><span class="dot" style="background:#3b82f6"></span>${s.map.legendCharging}</span>
            <span><span class="dot" style="background:#94a3b8"></span>${s.map.legendNoComm}</span>
            <span><span class="dot" style="background:#ef4444"></span>${s.map.legendUnavailable}</span>
          </div>
        </aside>
        <div class="map-container">
          <div id="map"></div>
        </div>
      </div>
    </section>

    <section>
      <h2 style="margin: 0 0 8px;">${s.map.snippetTitle}</h2>
      <p style="color: var(--fg-muted); margin: 0 0 16px;">${s.map.snippetIntro}</p>
      <div class="snippet-shell">
        <div class="snippet-tabs">
          <input type="radio" name="lang" value="ts" id="lang-ts" checked />
          <label for="lang-ts">TypeScript (SDK)</label>
          <input type="radio" name="lang" value="js" id="lang-js" />
          <label for="lang-js">JavaScript (SDK)</label>
          <input type="radio" name="lang" value="fetch" id="lang-fetch" />
          <label for="lang-fetch">fetch</label>
          <input type="radio" name="lang" value="curl" id="lang-curl" />
          <label for="lang-curl">cURL (POST)</label>
          <input type="radio" name="lang" value="get" id="lang-get" />
          <label for="lang-get">cURL (GET)</label>
          <input type="radio" name="lang" value="python" id="lang-python" />
          <label for="lang-python">Python (httpx)</label>
        </div>
        <div class="snippet-body">
          <button class="snippet-copy" id="btn-copy">${lang === 'es' ? 'Copiar' : 'Copy'}</button>
          <pre><code id="snippet-code">…</code></pre>
        </div>
        <div class="snippet-footer">
          <span>📦 <a href="https://www.npmjs.com/package/@ute-mueve/sdk" target="_blank" rel="noopener">${s.map.npmLink}</a></span>
          <span>⌥ <a href="https://github.com/eduair94/ute-mueve" target="_blank" rel="noopener">${s.map.githubLink}</a></span>
          <span>📚 <a href="/docs${lang === 'en' ? '?lang=en' : ''}">${s.map.apiRefLink}</a></span>
        </div>
      </div>
    </section>
  `;

  const head = `
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin="" defer></script>
    <style>${STYLES}</style>
  `;

  const tailScript = `<script>window.addEventListener('load', () => { ${SCRIPT.replace("'Cargando…'", lang === 'es' ? "'Cargando…'" : "'Loading…'").replace("'Aplicar filtros'", lang === 'es' ? "'Aplicar filtros'" : "'Apply filters'").replace("'Copiado!'", lang === 'es' ? "'Copiado!'" : "'Copied!'").replace("'Copiar'", lang === 'es' ? "'Copiar'" : "'Copy'").replace("'Consultando bridge…'", lang === 'es' ? "'Consultando bridge…'" : "'Querying bridge…'").replace(/estaciones · /g, lang === 'es' ? 'estaciones · ' : 'stations · ').replace(/filtros: /g, lang === 'es' ? 'filtros: ' : 'filters: ').replace(/'Tu ubicación'/g, lang === 'es' ? "'Tu ubicación'" : "'Your location'").replace(/'Geolocalización no disponible'/g, lang === 'es' ? "'Geolocalización no disponible'" : "'Geolocation unavailable'")} });</script>`;

  const html = renderLayout({
    title: lang === 'es' ? 'Mapa de estaciones — Puente UTE Mueve' : 'Stations map — UTE Mueve Bridge',
    description: lang === 'es'
      ? 'Mapa interactivo de estaciones de carga UTE con filtros en vivo.'
      : 'Interactive map of UTE charging stations with live filters.',
    active: 'map',
    lang,
    body,
  });
  return html
    .replace('</head>', `${head}</head>`)
    .replace('</body>', `${tailScript}</body>`);
}
