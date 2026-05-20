import { renderLayout } from './layout.js';

interface EndpointRow {
  method: 'GET' | 'POST';
  path: string;
  tags: string[];
  summary: string;
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'GET', path: '/configuration/appversion', tags: ['Configuration'], summary: 'Versión mínima soportada de la app' },
  { method: 'POST', path: '/station/statusFiltered', tags: ['Stations'], summary: 'Estaciones por filtros de conector' },
  { method: 'POST', path: '/station/renewEnergy', tags: ['Stations'], summary: 'Energía renovable en un rango de fechas' },
  { method: 'GET', path: '/customer/card/{userId}', tags: ['Customer'], summary: 'Tarjetas registradas del cliente' },
  { method: 'POST', path: '/customer/card/register', tags: ['Customer', 'Writes'], summary: 'Registrar tarjeta (gated)' },
  { method: 'POST', path: '/customer/card/unregister', tags: ['Customer', 'Writes'], summary: 'Desregistrar tarjeta (gated)' },
  { method: 'GET', path: '/card/{userId}', tags: ['Cards'], summary: 'Lista de tarjetas UTE del cliente' },
  { method: 'POST', path: '/card/accounts', tags: ['Accounts'], summary: 'Buscar cuenta por CI o documento' },
  { method: 'GET', path: '/network/{userId}', tags: ['Networks'], summary: 'Redes habilitadas del cliente' },
  { method: 'GET', path: '/remotecharge/user/{userId}', tags: ['Remote Charge'], summary: 'Historial de cargas del cliente' },
  { method: 'GET', path: '/remotecharge/transaction/{transactionId}', tags: ['Remote Charge'], summary: 'Detalle de una transacción de carga' },
  { method: 'POST', path: '/remotecharge/connector/status', tags: ['Remote Charge'], summary: 'Estado de un conector en vivo' },
  { method: 'POST', path: '/remotecharge/start', tags: ['Remote Charge', 'Writes'], summary: 'Iniciar carga remota (gated)' },
  { method: 'POST', path: '/remotecharge/stop', tags: ['Remote Charge', 'Writes'], summary: 'Detener carga remota (gated)' },
  { method: 'POST', path: '/notification/register', tags: ['Notifications', 'Writes'], summary: 'Registrar token FCM (gated)' },
];

const QUICK_CARDS = [
  {
    href: '/docs',
    icon: '📚',
    title: 'API Reference (Scalar)',
    desc: 'Explorá los 15 endpoints con ejemplos reales sanitizados, esquemas Zod y "Try it" inline.',
  },
  {
    href: '/openapi.json',
    icon: '🧬',
    title: 'OpenAPI 3.1',
    desc: 'Spec JSON generada en tiempo real desde los esquemas Zod. Apto para code-gen.',
  },
  {
    href: '/status',
    icon: '🩺',
    title: 'Status check',
    desc: 'Hace un round-trip real a UTE (token + GET configuration). Devuelve OK + latencia + cache backend.',
  },
  {
    href: '/health',
    icon: '💓',
    title: 'Health',
    desc: 'Liveness simple, sin tocar upstream. Usar para health checks de Vercel/load balancer.',
  },
  {
    href: '/security',
    icon: '🛡️',
    title: 'Reporte de seguridad',
    desc: '12 hallazgos del análisis estático del APK, incluyendo el IDOR crítico F-05.',
    danger: true,
  },
  {
    href: '/security/vr-001',
    icon: '🚨',
    title: 'VR-001 — IDOR Crítico',
    desc: 'Reporte formal de divulgación: con anonymous token + 8 dígitos de CI uruguaya se expone PII + datos de tarjeta de crédito.',
    danger: true,
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

function renderEndpointRows(): string {
  return ENDPOINTS.map(
    (e) =>
      `<tr>
        <td><span class="method ${e.method.toLowerCase()}">${e.method}</span></td>
        <td class="endpoint-path">${escape(e.path)}</td>
        <td>${escape(e.summary)}</td>
        <td>${e.tags.map((t) => `<span class="tag${t === 'Writes' ? ' write' : ''}">${escape(t)}</span>`).join(' ')}</td>
      </tr>`,
  ).join('\n');
}

function renderQuickCards(): string {
  return QUICK_CARDS.map(
    (c) => `
      <a class="card link" href="${escapeAttr(c.href)}">
        <div class="icon${c.danger ? ' danger' : ''}">${c.icon}</div>
        <h3>${escape(c.title)}</h3>
        <p class="desc">${escape(c.desc)}</p>
      </a>`,
  ).join('');
}

const SDK_EXAMPLE = String.raw`import { UteMueveClient } from '@ute-mueve/sdk';

const client = new UteMueveClient({
  baseUrl: 'https://tu-bridge.vercel.app',
});

// Estaciones disponibles con conectores CCS2/CHAdeMO en redes públicas
const stations = await client.stations.filtered({
  connectorTypes: ['CCS2', 'CHAdeMO'],
  statuses: ['available'],
  networks: ['PUBLIC'],
});

// Métricas de energía renovable de mayo 2026
const renewable = await client.stations.renewableEnergy({
  start: new Date('2026-05-01'),
  end: new Date('2026-05-31'),
});

// Endpoints con clave de cliente (CI o Firebase UID)
const cards = await client.customer.cards('<CI o UID>');
const accounts = await client.accounts.byCI('12345672');`;

const CURL_EXAMPLE = String.raw`# Status (round-trip a UTE)
curl https://tu-bridge.vercel.app/status

# Estaciones filtradas
curl -X POST https://tu-bridge.vercel.app/station/statusFiltered \
  -H 'content-type: application/json' \
  -d '{"connectorTypes":[{"id":2,"internalCode":"","text":"CCS2","selected":true,"icon":""}],
       "connectorStatuses":[{"id":1,"internalCode":"","text":"Disponible","selected":true,"icon":""}],
       "connectorPaymentTypes":[{"id":2,"internalCode":"","text":"App","selected":true,"icon":""}],
       "connectorPowers":[{"id":1,"internalCode":"","text":"0","selected":true,"icon":""}],
       "connectorCables":[{"id":2,"internalCode":"","text":"Sin cable","selected":true,"icon":""}],
       "connectorNetworks":[{"id":1,"internalCode":"PUBLIC","text":"Pública","selected":true,"icon":""}]}'`;

export function renderDashboard(): string {
  const body = `
  <section class="hero">
    <div class="pill"><span class="dot"></span>v0.1.0 · Bridge en línea</div>
    <h2>Acceso unificado a la API de UTE Mueve</h2>
    <p>
      Esta es la dashboard del puente público a <code>movilidadelectrica.ute.com.uy/api/v2</code>.
      Gestiona el ciclo de vida del JWT anónimo internamente, valida las cédulas uruguayas con el dígito verificador y expone una superficie REST tipada con docs interactivas.
    </p>
    <div class="pill danger" style="margin-top: 16px;">
      <span class="dot"></span>Lectura previa obligatoria · IDOR crítico documentado en <a href="/security/vr-001">VR-001</a>
    </div>
  </section>

  <section>
    <h2>Acceso rápido</h2>
    <div class="grid cols-3">${renderQuickCards()}</div>
  </section>

  <section>
    <h2>Endpoints disponibles <span class="count">${ENDPOINTS.length} rutas</span></h2>
    <div style="overflow-x: auto;">
      <table class="endpoint-table">
        <thead>
          <tr>
            <th>Método</th>
            <th>Ruta</th>
            <th>Descripción</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          ${renderEndpointRows()}
        </tbody>
      </table>
    </div>
    <p style="color: var(--fg-muted); font-size: 13px; margin-top: 12px;">
      Los endpoints con tag <span class="tag write">Writes</span> requieren <code>ENABLE_WRITE_ENDPOINTS=true</code> en el deployment. Por defecto devuelven <code>503 WRITES_DISABLED</code>.
    </p>
  </section>

  <section>
    <h2>Usar desde TypeScript</h2>
    <div class="grid cols-2">
      <div class="card">
        <h3>SDK <code>@ute-mueve/sdk</code></h3>
        <p class="desc" style="margin-bottom: 12px;">Cliente isomorfo, cero dependencias en runtime, ESM + CJS.</p>
        <pre><code>${escape(SDK_EXAMPLE)}</code></pre>
      </div>
      <div class="card">
        <h3>cURL</h3>
        <p class="desc" style="margin-bottom: 12px;">El bridge inyecta el token; el cliente sólo manda JSON.</p>
        <pre><code>${escape(CURL_EXAMPLE)}</code></pre>
      </div>
    </div>
  </section>

  <section>
    <h2>Aviso de seguridad</h2>
    <div class="alert">
      <h3>⚠️ IDOR crítico en la API upstream</h3>
      <p>
        El JWT anónimo de UTE no está atado a un usuario. Un atacante con conexión a internet y una cédula uruguaya válida puede leer nombre, apellido, BIN + últimos 4 dígitos de la tarjeta de crédito vinculada, mes/año de vencimiento, marca y <code>payerCardId</code> de Mercado Pago.
        Detalle completo: <a href="/security/vr-001"><strong>Reporte VR-001</strong></a>.
        Aviso técnico ampliado: <a href="/security">SEGURIDAD.md</a>.
      </p>
    </div>
  </section>

  <section>
    <h2>Más recursos</h2>
    <div class="grid cols-3">
      <a class="card link" href="https://github.com/eduair94/ute-mueve">
        <div class="icon">⌥</div>
        <h3>Repositorio</h3>
        <p class="desc">Código fuente, plan de implementación, design docs.</p>
      </a>
      <a class="card link" href="https://www.npmjs.com/package/@ute-mueve/sdk">
        <div class="icon">📦</div>
        <h3>SDK en npm</h3>
        <p class="desc">@ute-mueve/sdk · TypeScript isomorfo.</p>
      </a>
      <a class="card link" href="/openapi.json">
        <div class="icon">🧬</div>
        <h3>OpenAPI JSON</h3>
        <p class="desc">Esquemas Zod traducidos a OpenAPI 3.1.</p>
      </a>
    </div>
  </section>
  `;

  return renderLayout({
    title: 'UTE Mueve Bridge — Dashboard',
    description:
      'Puente no oficial a la API de UTE Mueve. Docs interactivas, OpenAPI 3.1, reportes de seguridad.',
    active: 'home',
    body,
  });
}
