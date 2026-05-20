import { renderLayout } from './layout.js';

interface EndpointRow {
  method: 'GET' | 'POST';
  path: string;
  tags: string[];
  summary: string;
}

const ENDPOINTS: EndpointRow[] = [
  { method: 'GET', path: '/configuration/appversion', tags: ['Configuration'], summary: 'Versión mínima soportada de la app' },
  { method: 'POST', path: '/stations/search', tags: ['Stations'], summary: 'Búsqueda ergonómica con enums (CCS2, available, PUBLIC...)' },
  { method: 'GET', path: '/stations?types=CCS2&statuses=available', tags: ['Stations'], summary: 'Búsqueda via query string (URL compartible)' },
  { method: 'GET', path: '/stations/available', tags: ['Stations'], summary: 'Atajo: todas las estaciones disponibles ahora' },
  { method: 'POST', path: '/station/statusFiltered', tags: ['Stations', 'Advanced'], summary: 'Body UTE verbatim (power-user)' },
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
    title: 'Referencia de la API',
    desc: 'Explorá los endpoints con ejemplos reales saneados, esquemas Zod y "Probar" inline. Renderizado con Scalar.',
  },
  {
    href: '/openapi.json',
    icon: '🧬',
    title: 'Especificación OpenAPI 3.1',
    desc: 'JSON generado en vivo a partir de los esquemas Zod. Listo para generadores de código.',
  },
  {
    href: '/status',
    icon: '🩺',
    title: 'Verificación de estado',
    desc: 'Hace un ida-y-vuelta real contra UTE (token + GET configuration). Devuelve OK, latencia y backend de caché.',
  },
  {
    href: '/health',
    icon: '💓',
    title: 'Salud',
    desc: 'Liveness simple, sin tocar upstream. Útil para health-checks de Vercel o balanceadores.',
  },
  {
    href: '/security',
    icon: '🛡️',
    title: 'Informe de seguridad',
    desc: '12 hallazgos del análisis estático del APK, incluyendo el IDOR crítico F-05.',
    danger: true,
  },
  {
    href: '/security/vr-001',
    icon: '🚨',
    title: 'VR-001 — IDOR Crítico',
    desc: 'Reporte formal de divulgación: con token anónimo y 8 dígitos de cédula uruguaya se exponen PII y datos parciales de tarjeta de crédito.',
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
  baseUrl: 'https://ute-mueve.vercel.app',
});

// Todas las estaciones disponibles ahora
const open = await client.stations.available();

// Filtros ergonómicos
const ccs2 = await client.stations.search({
  connectorTypes: ['CCS2', 'CHAdeMO'],
  statuses: ['available'],
  networks: ['PUBLIC'],
});

// A 5 km de Plaza Independencia (Haversine client-side)
const nearby = await client.stations.near({
  lat: -34.9061, lng: -56.1990, radiusMeters: 5000,
});

// Solo red Taxi
const taxi = await client.stations.byNetwork('TAXI');

// Energía renovable de mayo 2026
const renewable = await client.stations.renewableEnergy({
  start: new Date('2026-05-01'),
  end: new Date('2026-05-31'),
});

// Endpoints con clave de cliente (CI o Firebase UID)
const cards = await client.customer.cards('<CI o UID>');
const accounts = await client.accounts.byCI('12345672');`;

const CURL_EXAMPLE = String.raw`# Round-trip vivo a UTE
curl https://ute-mueve.vercel.app/status

# Búsqueda ergonómica
curl -X POST https://ute-mueve.vercel.app/stations/search \
  -H 'content-type: application/json' \
  -d '{"connectorTypes":["CCS2","CHAdeMO"],"statuses":["available"],"networks":["PUBLIC"]}'

# Búsqueda via GET (URL compartible)
curl 'https://ute-mueve.vercel.app/stations?types=CCS2,CHAdeMO&statuses=available&networks=PUBLIC'

# Lookup por CI uruguaya
curl -X POST https://ute-mueve.vercel.app/card/accounts \
  -H 'content-type: application/json' \
  -d '{"docType":"CI","docNumber":"12345672","onlyUte":false}'`;

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
    <h2>Parámetros de búsqueda de estaciones</h2>
    <p style="color: var(--fg-muted); margin-bottom: 16px;">
      Todos los parámetros son opcionales y aceptan arrays. Sin parámetros, la búsqueda devuelve todas las estaciones disponibles. La columna <strong>Valor</strong> muestra los códigos que acepta el SDK y los endpoints <code>/stations/search</code> y <code>GET /stations?...</code>. Las traducciones a las cadenas verbosas de UTE (<em>Disponible</em>, <em>Tarjeta RFID</em>, etc.) las maneja el bridge internamente.
    </p>
    <div class="grid cols-2">
      <div class="card">
        <h3>connectorTypes — tipo de conector físico</h3>
        <p class="desc" style="margin-bottom: 12px;">Norma del enchufe del cargador. El vehículo determina cuál podés usar.</p>
        <table class="endpoint-table">
          <tbody>
            <tr><td><code>"Tipo 2"</code></td><td>AC trifásico europeo (Mennekes). Carga lenta/media en casa o estaciones públicas AC.</td></tr>
            <tr><td><code>"CCS2"</code></td><td>DC rápido combinado europeo. El estándar dominante para autos modernos en Uruguay.</td></tr>
            <tr><td><code>"CHAdeMO"</code></td><td>DC rápido japonés (Nissan Leaf, etc.). Compatibilidad limitada.</td></tr>
            <tr><td><code>"GB/T"</code></td><td>DC rápido chino. Presente sobre todo en flotas asiáticas (BYD, etc.).</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>statuses — estado del conector ahora mismo</h3>
        <p class="desc" style="margin-bottom: 12px;">Estado reportado por la estación. Por defecto la búsqueda usa <code>['available']</code>.</p>
        <table class="endpoint-table">
          <tbody>
            <tr><td><code>"available"</code></td><td>Disponible: libre para iniciar una carga.</td></tr>
            <tr><td><code>"charging"</code></td><td>Cargando: actualmente en uso.</td></tr>
            <tr><td><code>"no-comm"</code></td><td>Sin Comunicación: la estación no reporta al servidor.</td></tr>
            <tr><td><code>"unavailable"</code></td><td>No Disponible: fuera de servicio.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>paymentTypes — métodos de pago aceptados</h3>
        <p class="desc" style="margin-bottom: 12px;">Cómo se autentica el inicio de carga en la estación.</p>
        <table class="endpoint-table">
          <tbody>
            <tr><td><code>"rfid"</code></td><td>Tarjeta RFID UTE (tarjeta física aproximada al lector).</td></tr>
            <tr><td><code>"app"</code></td><td>App móvil (UTE Mueve / código QR / carga remota).</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>cables — provisión de cable</h3>
        <p class="desc" style="margin-bottom: 12px;">Indica si la estación trae su propio cable o si hay que llevarlo.</p>
        <table class="endpoint-table">
          <tbody>
            <tr><td><code>"with"</code></td><td>Con cable: la estación lo provee (más rápido enchufar).</td></tr>
            <tr><td><code>"without"</code></td><td>Sin cable: hay que conectar uno propio (típico Tipo 2 AC).</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>networks — operador de la red de carga</h3>
        <p class="desc" style="margin-bottom: 12px;">Operador o "red" a la que pertenece la estación. La tarifa y la app varían por red.</p>
        <table class="endpoint-table">
          <tbody>
            <tr><td><code>"PUBLIC"</code></td><td>Pública: red propia de UTE, accesible para todos.</td></tr>
            <tr><td><code>"TAXI"</code></td><td>Taxi: red dedicada a la flota de taxis eléctricos.</td></tr>
            <tr><td><code>"DMC"</code></td><td>DMC: operador externo (EMSP). Roaming.</td></tr>
            <tr><td><code>"ONE"</code></td><td>eOne: operador externo (EMSP). Roaming.</td></tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>powers — potencia en kW</h3>
        <p class="desc" style="margin-bottom: 12px;">Filtra por potencia del cargador. Pasá un array de números.</p>
        <table class="endpoint-table">
          <tbody>
            <tr><td><code>[0]</code></td><td>Cualquier potencia (default si no se especifica).</td></tr>
            <tr><td><code>[60]</code></td><td>Solo cargadores rápidos de 60 kW.</td></tr>
            <tr><td><code>[22, 50, 60]</code></td><td>Cualquiera entre 22, 50 o 60 kW.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <p style="color: var(--fg-muted); font-size: 13px; margin-top: 16px;">
      <strong>Defaults sin parámetros</strong>: todas las categorías marcadas excepto <code>statuses</code>, que se restringe a <code>['available']</code>. Esto replica el comportamiento "Mostrar disponibles" de la app UTE Mueve.
    </p>
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
      Los endpoints con etiqueta <span class="tag write">Writes</span> requieren <code>ENABLE_WRITE_ENDPOINTS=true</code> en el deployment. Por defecto devuelven <code>503 WRITES_DISABLED</code>.
    </p>
  </section>

  <section>
    <h2>Uso desde TypeScript</h2>
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
        <p class="desc">Código fuente, plan de implementación y documentos de diseño.</p>
      </a>
      <a class="card link" href="https://www.npmjs.com/package/@ute-mueve/sdk">
        <div class="icon">📦</div>
        <h3>SDK en npm</h3>
        <p class="desc">@ute-mueve/sdk · cliente TypeScript isomorfo.</p>
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
