import { renderLayout } from './layout.js';
import { t, type Lang } from './i18n.js';

interface EndpointRow {
  method: 'GET' | 'POST';
  path: string;
  tags: string[];
  summary: { es: string; en: string };
}

const ENDPOINTS: EndpointRow[] = [
  {
    method: 'GET', path: '/configuration/appversion', tags: ['Configuration'],
    summary: { es: 'Versión mínima soportada de la app', en: 'Minimum supported app version' },
  },
  {
    method: 'POST', path: '/stations/search', tags: ['Stations'],
    summary: { es: 'Búsqueda ergonómica con enums (CCS2, available, PUBLIC…)', en: 'Friendly search with enums (CCS2, available, PUBLIC…)' },
  },
  {
    method: 'GET', path: '/stations?types=CCS2&statuses=available', tags: ['Stations'],
    summary: { es: 'Búsqueda via query string (URL compartible)', en: 'Search via query string (shareable URL)' },
  },
  {
    method: 'GET', path: '/stations/available', tags: ['Stations'],
    summary: { es: 'Atajo: todas las estaciones disponibles ahora', en: 'Shortcut: all stations available right now' },
  },
  {
    method: 'POST', path: '/station/statusFiltered', tags: ['Stations', 'Advanced'],
    summary: { es: 'Body UTE verbatim (power-user)', en: 'Verbatim UTE body (power-user)' },
  },
  {
    method: 'POST', path: '/station/renewEnergy', tags: ['Stations'],
    summary: { es: 'Energía renovable en un rango de fechas', en: 'Renewable energy in a date range' },
  },
  {
    method: 'GET', path: '/customer/card/{userId}', tags: ['Customer'],
    summary: { es: 'Tarjetas registradas del cliente', en: 'Registered customer cards' },
  },
  {
    method: 'POST', path: '/customer/card/register', tags: ['Customer', 'Writes'],
    summary: { es: 'Registrar tarjeta (gated)', en: 'Register a card (gated)' },
  },
  {
    method: 'POST', path: '/customer/card/unregister', tags: ['Customer', 'Writes'],
    summary: { es: 'Desregistrar tarjeta (gated)', en: 'Unregister a card (gated)' },
  },
  {
    method: 'GET', path: '/card/{userId}', tags: ['Cards'],
    summary: { es: 'Lista de tarjetas UTE del cliente', en: "Customer's UTE-issued cards" },
  },
  {
    method: 'POST', path: '/card/accounts', tags: ['Accounts'],
    summary: { es: 'Buscar cuenta por CI o documento', en: 'Look up an account by CI or document' },
  },
  {
    method: 'GET', path: '/network/{userId}', tags: ['Networks'],
    summary: { es: 'Redes habilitadas del cliente', en: 'Networks enabled for the customer' },
  },
  {
    method: 'GET', path: '/remotecharge/user/{userId}', tags: ['Remote Charge'],
    summary: { es: 'Historial de cargas del cliente', en: 'Customer charge history' },
  },
  {
    method: 'GET', path: '/remotecharge/transaction/{transactionId}', tags: ['Remote Charge'],
    summary: { es: 'Detalle de una transacción de carga', en: 'Detail of a charge transaction' },
  },
  {
    method: 'POST', path: '/remotecharge/connector/status', tags: ['Remote Charge'],
    summary: { es: 'Estado de un conector en vivo', en: 'Live connector status' },
  },
  {
    method: 'POST', path: '/remotecharge/start', tags: ['Remote Charge', 'Writes'],
    summary: { es: 'Iniciar carga remota (gated)', en: 'Start a remote charge (gated)' },
  },
  {
    method: 'POST', path: '/remotecharge/stop', tags: ['Remote Charge', 'Writes'],
    summary: { es: 'Detener carga remota (gated)', en: 'Stop a remote charge (gated)' },
  },
  {
    method: 'POST', path: '/notification/register', tags: ['Notifications', 'Writes'],
    summary: { es: 'Registrar token FCM (gated)', en: 'Register FCM token (gated)' },
  },
];

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function withLang(href: string, lang: Lang): string {
  if (lang === 'es' || href.startsWith('http')) return href;
  return href + (href.includes('?') ? '&' : '?') + 'lang=' + lang;
}

function renderEndpointRows(lang: Lang): string {
  return ENDPOINTS.map(
    (e) =>
      `<tr>
        <td><span class="method ${e.method.toLowerCase()}">${e.method}</span></td>
        <td class="endpoint-path">${escape(e.path)}</td>
        <td>${escape(e.summary[lang])}</td>
        <td>${e.tags.map((tg) => `<span class="tag${tg === 'Writes' ? ' write' : ''}">${escape(tg)}</span>`).join(' ')}</td>
      </tr>`,
  ).join('\n');
}

function rows(pairs: ReadonlyArray<readonly [string, string]>): string {
  return pairs.map(([k, v]) => `<tr><td><code>${escape(k)}</code></td><td>${escape(v)}</td></tr>`).join('');
}

export function renderDashboard(lang: Lang): string {
  const s = t(lang);

  const QUICK_CARDS = [
    { href: '/map', icon: '🗺️', ...s.cards.map },
    { href: '/docs', icon: '📚', ...s.cards.docs },
    { href: '/openapi.json', icon: '🧬', ...s.cards.openapi },
    { href: '/status', icon: '🩺', ...s.cards.status },
    { href: '/health', icon: '💓', ...s.cards.health },
    { href: '/security', icon: '🛡️', ...s.cards.security, danger: true },
    { href: '/security/vr-001', icon: '🚨', ...s.cards.vr, danger: true },
  ];

  const quickCardsHtml = QUICK_CARDS.map(
    (c) => `
      <a class="card link" href="${escapeAttr(withLang(c.href, lang))}">
        <div class="icon${c.danger ? ' danger' : ''}">${c.icon}</div>
        <h3>${escape(c.title)}</h3>
        <p class="desc">${escape(c.desc)}</p>
      </a>`,
  ).join('');

  const sdkExample = String.raw`import { UteMueveClient } from '@ute-mueve/sdk';

${lang === 'es' ? '// Modo directo (Node.js) — SDK habla con UTE directamente,\n// maneja el JWT anónimo y el uniquekeyuser por vos.' : '// Direct mode (Node.js) — SDK talks to UTE directly,\n// handles the anonymous JWT and uniquekeyuser for you.'}
const client = new UteMueveClient();

${lang === 'es' ? '// Browser? Usá el bridge para evitar CORS:' : '// Browser? Use the bridge to bypass CORS:'}
//   const client = new UteMueveClient({ baseUrl: 'https://ute-mueve.vercel.app' });

${lang === 'es' ? '// Todas las estaciones disponibles ahora' : '// All stations available right now'}
const open = await client.stations.available();

${lang === 'es' ? '// Filtros ergonómicos' : '// Friendly filters'}
const ccs2 = await client.stations.search({
  connectorTypes: ['CCS2', 'CHAdeMO'],
  statuses: ['available'],
  networks: ['PUBLIC'],
});

${lang === 'es' ? '// A 5 km de Plaza Independencia (Haversine client-side)' : '// Within 5 km of Plaza Independencia (Haversine client-side)'}
const nearby = await client.stations.near({
  lat: -34.9061, lng: -56.1990, radiusMeters: 5000,
});`;

  const curlExample = String.raw`# ${lang === 'es' ? 'Round-trip vivo a UTE' : 'Live round-trip to UTE'}
curl https://ute-mueve.vercel.app/status

# ${lang === 'es' ? 'Búsqueda ergonómica' : 'Friendly search'}
curl -X POST https://ute-mueve.vercel.app/stations/search \
  -H 'content-type: application/json' \
  -d '{"connectorTypes":["CCS2","CHAdeMO"],"statuses":["available"],"networks":["PUBLIC"]}'

# ${lang === 'es' ? 'Búsqueda via GET (URL compartible)' : 'Search via GET (shareable URL)'}
curl 'https://ute-mueve.vercel.app/stations?types=CCS2,CHAdeMO&statuses=available&networks=PUBLIC'

# ${lang === 'es' ? 'Lookup por CI uruguaya' : 'Lookup by Uruguayan CI'}
curl -X POST https://ute-mueve.vercel.app/card/accounts \
  -H 'content-type: application/json' \
  -d '{"docType":"CI","docNumber":"12345672","onlyUte":false}'`;

  const body = `
  <section class="hero">
    <div class="pill"><span class="dot"></span>${s.hero.online}</div>
    <h2>${s.hero.title}</h2>
    <p>${s.hero.intro}</p>
    <div class="pill danger" style="margin-top: 16px;">
      <span class="dot"></span>${s.hero.warning} <a href="${escapeAttr(withLang('/security/vr-001', lang))}">${s.hero.vrLink}</a>
    </div>
  </section>

  <section>
    <h2>${s.sections.quickAccess}</h2>
    <div class="grid cols-3">${quickCardsHtml}</div>
  </section>

  <section>
    <h2>${s.sections.filterParams}</h2>
    <p style="color: var(--fg-muted); margin-bottom: 16px;">${s.sections.filterParamsIntro}</p>
    <div class="grid cols-2">
      <div class="card">
        <h3>${s.filterGroups.types}</h3>
        <p class="desc" style="margin-bottom: 12px;">${s.filterDescs.types}</p>
        <table class="endpoint-table"><tbody>${rows(s.filterTypeRows)}</tbody></table>
      </div>
      <div class="card">
        <h3>${s.filterGroups.statuses}</h3>
        <p class="desc" style="margin-bottom: 12px;">${s.filterDescs.statuses}</p>
        <table class="endpoint-table"><tbody>${rows(s.filterStatusRows)}</tbody></table>
      </div>
      <div class="card">
        <h3>${s.filterGroups.payments}</h3>
        <p class="desc" style="margin-bottom: 12px;">${s.filterDescs.payments}</p>
        <table class="endpoint-table"><tbody>${rows(s.filterPaymentRows)}</tbody></table>
      </div>
      <div class="card">
        <h3>${s.filterGroups.cables}</h3>
        <p class="desc" style="margin-bottom: 12px;">${s.filterDescs.cables}</p>
        <table class="endpoint-table"><tbody>${rows(s.filterCableRows)}</tbody></table>
      </div>
      <div class="card">
        <h3>${s.filterGroups.networks}</h3>
        <p class="desc" style="margin-bottom: 12px;">${s.filterDescs.networks}</p>
        <table class="endpoint-table"><tbody>${rows(s.filterNetworkRows)}</tbody></table>
      </div>
      <div class="card">
        <h3>${s.filterGroups.powers}</h3>
        <p class="desc" style="margin-bottom: 12px;">${s.filterDescs.powers}</p>
        <table class="endpoint-table"><tbody>${rows(s.filterPowerRows)}</tbody></table>
      </div>
    </div>
    <p style="color: var(--fg-muted); font-size: 13px; margin-top: 16px;">${s.sections.filterParamsDefaults}</p>
  </section>

  <section>
    <h2>${s.sections.endpoints} <span class="count">${s.sections.endpointsCount(ENDPOINTS.length)}</span></h2>
    <div style="overflow-x: auto;">
      <table class="endpoint-table">
        <thead>
          <tr><th>${lang === 'es' ? 'Método' : 'Method'}</th><th>${lang === 'es' ? 'Ruta' : 'Path'}</th><th>${lang === 'es' ? 'Descripción' : 'Description'}</th><th>Tags</th></tr>
        </thead>
        <tbody>${renderEndpointRows(lang)}</tbody>
      </table>
    </div>
    <p style="color: var(--fg-muted); font-size: 13px; margin-top: 12px;">${s.sections.writesNote}</p>
  </section>

  <section>
    <h2>${s.sections.typescriptUse}</h2>
    <div class="grid cols-2">
      <div class="card">
        <h3>SDK <code>@ute-mueve/sdk</code></h3>
        <p class="desc" style="margin-bottom: 12px;">${lang === 'es' ? 'Cliente isomorfo, cero dependencias en runtime, ESM + CJS.' : 'Isomorphic client, zero runtime dependencies, ESM + CJS.'}</p>
        <pre><code>${escape(sdkExample)}</code></pre>
      </div>
      <div class="card">
        <h3>cURL</h3>
        <p class="desc" style="margin-bottom: 12px;">${lang === 'es' ? 'El bridge inyecta el token; el cliente sólo manda JSON.' : 'The bridge injects the token; the client only sends JSON.'}</p>
        <pre><code>${escape(curlExample)}</code></pre>
      </div>
    </div>
  </section>

  <section>
    <h2>${s.sections.securityNotice}</h2>
    <div class="alert">
      <h3>${s.alert.title}</h3>
      <p>${s.alert.body(escapeAttr(withLang('/security/vr-001', lang)), escapeAttr(withLang('/security', lang)))}</p>
    </div>
  </section>

  <section>
    <h2>${s.sections.moreResources}</h2>
    <div class="grid cols-3">
      <a class="card link" href="https://github.com/eduair94/ute-mueve" target="_blank" rel="noopener">
        <div class="icon">⌥</div>
        <h3>${s.cards.github.title}</h3>
        <p class="desc">${s.cards.github.desc}</p>
      </a>
      <a class="card link" href="https://www.npmjs.com/package/@ute-mueve/sdk" target="_blank" rel="noopener">
        <div class="icon">📦</div>
        <h3>${s.cards.sdk.title}</h3>
        <p class="desc">${s.cards.sdk.desc}</p>
      </a>
      <a class="card link" href="https://www.npmjs.com/package/@ute-mueve/types" target="_blank" rel="noopener">
        <div class="icon">🧩</div>
        <h3>${s.cards.types.title}</h3>
        <p class="desc">${s.cards.types.desc}</p>
      </a>
    </div>
  </section>
  `;

  return renderLayout({
    title: lang === 'es' ? 'Puente UTE Mueve — Dashboard' : 'UTE Mueve Bridge — Dashboard',
    description: lang === 'es'
      ? 'Puente no oficial a la API de UTE Mueve. Docs interactivas, OpenAPI 3.1, reportes de seguridad.'
      : 'Unofficial bridge to the UTE Mueve API. Interactive docs, OpenAPI 3.1, security reports.',
    active: 'home',
    lang,
    body,
  });
}
