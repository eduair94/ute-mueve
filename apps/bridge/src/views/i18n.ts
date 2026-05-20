/**
 * Minimal i18n. Two languages: `es` (default) and `en`.
 * Pick via `?lang=en` query param. Bridge routes that render HTML inspect
 * the query, pass the `Lang` to layout/dashboard/map, and serve markdown
 * files in the matching language.
 */
export type Lang = 'es' | 'en';

export function pickLang(url: URL | string): Lang {
  try {
    const u = typeof url === 'string' ? new URL(url, 'http://localhost') : url;
    const q = u.searchParams.get('lang');
    if (q === 'en' || q === 'es') return q;
  } catch {
    // fall through
  }
  return 'es';
}

interface Strings {
  nav: { home: string; map: string; api: string; openapi: string; security: string; vr: string; status: string };
  brand: { name: string; sub: string };
  footer: { notAffiliated: string; license: string; rePrefix: string };
  hero: { online: string; title: string; intro: string; warning: string; vrLink: string };
  sections: {
    quickAccess: string;
    filterParams: string;
    filterParamsIntro: string;
    filterParamsDefaults: string;
    endpoints: string;
    endpointsCount: (n: number) => string;
    writesNote: string;
    typescriptUse: string;
    securityNotice: string;
    moreResources: string;
  };
  filterGroups: { types: string; statuses: string; payments: string; cables: string; networks: string; powers: string };
  filterDescs: {
    types: string;
    statuses: string;
    payments: string;
    cables: string;
    networks: string;
    powers: string;
  };
  filterTypeRows: Array<[string, string]>;
  filterStatusRows: Array<[string, string]>;
  filterPaymentRows: Array<[string, string]>;
  filterCableRows: Array<[string, string]>;
  filterNetworkRows: Array<[string, string]>;
  filterPowerRows: Array<[string, string]>;
  alert: { title: string; body: (vrHref: string, secHref: string) => string };
  map: {
    title: string;
    intro: string;
    apply: string;
    locate: string;
    reset: string;
    loading: string;
    legendAvailable: string;
    legendCharging: string;
    legendNoComm: string;
    legendUnavailable: string;
    snippetTitle: string;
    snippetIntro: string;
    npmLink: string;
    githubLink: string;
    apiRefLink: string;
  };
  cards: {
    map: { title: string; desc: string };
    docs: { title: string; desc: string };
    openapi: { title: string; desc: string };
    status: { title: string; desc: string };
    health: { title: string; desc: string };
    security: { title: string; desc: string };
    vr: { title: string; desc: string };
    github: { title: string; desc: string };
    sdk: { title: string; desc: string };
    types: { title: string; desc: string };
  };
}

const ES: Strings = {
  nav: { home: 'Inicio', map: 'Mapa', api: 'API', openapi: 'OpenAPI', security: 'Seguridad', vr: 'VR-001', status: 'Estado' },
  brand: { name: 'Puente UTE Mueve', sub: 'Puente no oficial · v0.1.0' },
  footer: {
    notAffiliated: 'Este proyecto <strong>no está afiliado</strong> a UTE.',
    license: 'Código fuente y bibliotecas bajo licencia MIT',
    rePrefix: 'Reverse-engineering responsable — leé',
  },
  hero: {
    online: 'v0.1.0 · Bridge en línea',
    title: 'Acceso unificado a la API de UTE Mueve',
    intro:
      'Esta es la dashboard del puente público a <code>movilidadelectrica.ute.com.uy/api/v2</code>. Gestiona el ciclo de vida del JWT anónimo internamente, valida las cédulas uruguayas con el dígito verificador y expone una superficie REST tipada con docs interactivas.',
    warning: 'Lectura previa obligatoria · IDOR crítico documentado en',
    vrLink: 'VR-001',
  },
  sections: {
    quickAccess: 'Acceso rápido',
    filterParams: 'Parámetros de búsqueda de estaciones',
    filterParamsIntro:
      'Todos los parámetros son opcionales y aceptan arrays. Sin parámetros, la búsqueda devuelve todas las estaciones disponibles. La columna <strong>Valor</strong> muestra los códigos que acepta el SDK y los endpoints <code>/stations/search</code> y <code>GET /stations?...</code>. Las traducciones a las cadenas verbosas de UTE las maneja el bridge internamente.',
    filterParamsDefaults:
      '<strong>Defaults sin parámetros</strong>: todas las categorías marcadas excepto <code>statuses</code>, que se restringe a <code>[\'available\']</code>. Esto replica el comportamiento "Mostrar disponibles" de la app UTE Mueve.',
    endpoints: 'Endpoints disponibles',
    endpointsCount: (n) => `${n} rutas`,
    writesNote:
      'Los endpoints con etiqueta <span class="tag write">Writes</span> requieren <code>ENABLE_WRITE_ENDPOINTS=true</code> en el deployment. Por defecto devuelven <code>503 WRITES_DISABLED</code>.',
    typescriptUse: 'Uso desde TypeScript',
    securityNotice: 'Aviso de seguridad',
    moreResources: 'Más recursos',
  },
  filterGroups: {
    types: 'connectorTypes — tipo de conector físico',
    statuses: 'statuses — estado del conector ahora mismo',
    payments: 'paymentTypes — métodos de pago aceptados',
    cables: 'cables — provisión de cable',
    networks: 'networks — operador de la red de carga',
    powers: 'powers — potencia en kW',
  },
  filterDescs: {
    types: 'Norma del enchufe del cargador. El vehículo determina cuál podés usar.',
    statuses: 'Estado reportado por la estación. Por defecto la búsqueda usa <code>[\'available\']</code>.',
    payments: 'Cómo se autentica el inicio de carga en la estación.',
    cables: 'Indica si la estación trae su propio cable o si hay que llevarlo.',
    networks: 'Operador o "red" a la que pertenece la estación. La tarifa y la app varían por red.',
    powers: 'Filtra por potencia del cargador. Pasá un array de números.',
  },
  filterTypeRows: [
    ['"Tipo 2"', 'AC trifásico europeo (Mennekes). Carga lenta/media en casa o estaciones públicas AC.'],
    ['"CCS2"', 'DC rápido combinado europeo. El estándar dominante para autos modernos en Uruguay.'],
    ['"CHAdeMO"', 'DC rápido japonés (Nissan Leaf, etc.). Compatibilidad limitada.'],
    ['"GB/T"', 'DC rápido chino. Presente sobre todo en flotas asiáticas (BYD, etc.).'],
  ],
  filterStatusRows: [
    ['"available"', 'Disponible: libre para iniciar una carga.'],
    ['"charging"', 'Cargando: actualmente en uso.'],
    ['"no-comm"', 'Sin Comunicación: la estación no reporta al servidor.'],
    ['"unavailable"', 'No Disponible: fuera de servicio.'],
  ],
  filterPaymentRows: [
    ['"rfid"', 'Tarjeta RFID UTE (tarjeta física aproximada al lector).'],
    ['"app"', 'App móvil (UTE Mueve / código QR / carga remota).'],
  ],
  filterCableRows: [
    ['"with"', 'Con cable: la estación lo provee (más rápido enchufar).'],
    ['"without"', 'Sin cable: hay que conectar uno propio (típico Tipo 2 AC).'],
  ],
  filterNetworkRows: [
    ['"PUBLIC"', 'Pública: red propia de UTE, accesible para todos.'],
    ['"TAXI"', 'Taxi: red dedicada a la flota de taxis eléctricos.'],
    ['"DMC"', 'DMC: operador externo (EMSP). Roaming.'],
    ['"ONE"', 'eOne: operador externo (EMSP). Roaming.'],
  ],
  filterPowerRows: [
    ['[0]', 'Cualquier potencia (default si no se especifica).'],
    ['[60]', 'Solo cargadores rápidos de 60 kW.'],
    ['[22, 50, 60]', 'Cualquiera entre 22, 50 o 60 kW.'],
  ],
  alert: {
    title: '⚠️ IDOR crítico en la API upstream',
    body: (vrHref, secHref) =>
      `El JWT anónimo de UTE no está atado a un usuario. Un atacante con conexión a internet y una cédula uruguaya válida puede leer nombre, apellido, BIN + últimos 4 dígitos de la tarjeta de crédito vinculada, mes/año de vencimiento, marca y <code>payerCardId</code> de Mercado Pago. Detalle completo: <a href="${vrHref}"><strong>Reporte VR-001</strong></a>. Aviso técnico ampliado: <a href="${secHref}">SEGURIDAD.md</a>.`,
  },
  map: {
    title: 'Mapa de estaciones',
    intro:
      'Vista previa con <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a> + Leaflet. Los datos vienen de <code>POST /stations/search</code> en vivo. Modificá los filtros y el mapa se actualiza solo.',
    apply: 'Aplicar filtros',
    locate: 'Ubicarme',
    reset: 'Reset',
    loading: 'Cargando…',
    legendAvailable: 'Disponible',
    legendCharging: 'Cargando',
    legendNoComm: 'Sin com.',
    legendUnavailable: 'No disp.',
    snippetTitle: 'Copiá el código',
    snippetIntro: 'Snippet generado en vivo con los filtros que tenés seleccionados arriba. Elegí el lenguaje y copialo.',
    npmLink: '@ute-mueve/sdk en npm',
    githubLink: 'Repositorio en GitHub',
    apiRefLink: 'Referencia completa de la API',
  },
  cards: {
    map: { title: 'Mapa interactivo', desc: 'Vista previa con OpenStreetMap + Leaflet, filtros en vivo y snippet de código en TS/JS/cURL/Python.' },
    docs: { title: 'Referencia de la API', desc: 'Explorá los endpoints con ejemplos reales saneados, esquemas Zod y "Probar" inline. Renderizado con Scalar.' },
    openapi: { title: 'Especificación OpenAPI 3.1', desc: 'JSON generado en vivo a partir de los esquemas Zod. Listo para generadores de código.' },
    status: { title: 'Verificación de estado', desc: 'Hace un ida-y-vuelta real contra UTE (token + GET configuration). Devuelve OK, latencia y backend de caché.' },
    health: { title: 'Salud', desc: 'Liveness simple, sin tocar upstream. Útil para health-checks de Vercel o balanceadores.' },
    security: { title: 'Informe de seguridad', desc: '12 hallazgos del análisis estático del APK, incluyendo el IDOR crítico F-05.' },
    vr: { title: 'VR-001 — IDOR Crítico', desc: 'Reporte formal de divulgación: con token anónimo y 8 dígitos de cédula uruguaya se exponen PII y datos parciales de tarjeta de crédito.' },
    github: { title: 'GitHub', desc: 'Código fuente, plan de implementación, documentos de diseño y CI/CD.' },
    sdk: { title: 'SDK en npm', desc: '@ute-mueve/sdk · cliente TypeScript isomorfo, ESM + CJS, zero deps.' },
    types: { title: 'Tipos en npm', desc: '@ute-mueve/types · Zod schemas + interfaces quicktype generadas.' },
  },
};

const EN: Strings = {
  nav: { home: 'Home', map: 'Map', api: 'API', openapi: 'OpenAPI', security: 'Security', vr: 'VR-001', status: 'Status' },
  brand: { name: 'UTE Mueve Bridge', sub: 'Unofficial bridge · v0.1.0' },
  footer: {
    notAffiliated: 'This project is <strong>not affiliated</strong> with UTE.',
    license: 'Source code and libraries under MIT license',
    rePrefix: 'Responsible reverse-engineering — read',
  },
  hero: {
    online: 'v0.1.0 · Bridge online',
    title: 'Unified access to UTE Mueve API',
    intro:
      "This is the dashboard for the public bridge to <code>movilidadelectrica.ute.com.uy/api/v2</code>. It handles the anonymous JWT lifecycle internally, validates Uruguayan CIs with the check-digit algorithm, and exposes a typed REST surface with interactive docs.",
    warning: 'Required reading · Critical IDOR documented in',
    vrLink: 'VR-001',
  },
  sections: {
    quickAccess: 'Quick access',
    filterParams: 'Station search parameters',
    filterParamsIntro:
      'All parameters are optional and accept arrays. Without parameters, the search returns all available stations. The <strong>Value</strong> column shows the codes accepted by the SDK and the <code>/stations/search</code> and <code>GET /stations?...</code> endpoints. The bridge internally translates these to UTE\'s verbose strings.',
    filterParamsDefaults:
      "<strong>Defaults without parameters</strong>: all categories selected except <code>statuses</code>, which is restricted to <code>['available']</code>. This replicates the \"Show available\" behavior of the UTE Mueve app.",
    endpoints: 'Available endpoints',
    endpointsCount: (n) => `${n} routes`,
    writesNote:
      'Endpoints tagged <span class="tag write">Writes</span> require <code>ENABLE_WRITE_ENDPOINTS=true</code> at deployment. They return <code>503 WRITES_DISABLED</code> by default.',
    typescriptUse: 'Use from TypeScript',
    securityNotice: 'Security notice',
    moreResources: 'More resources',
  },
  filterGroups: {
    types: 'connectorTypes — physical connector type',
    statuses: 'statuses — connector state right now',
    payments: 'paymentTypes — accepted payment methods',
    cables: 'cables — cable provisioning',
    networks: 'networks — charging network operator',
    powers: 'powers — power in kW',
  },
  filterDescs: {
    types: 'Charger plug standard. Your vehicle determines which one you can use.',
    statuses: "Status reported by the station. The search defaults to <code>['available']</code>.",
    payments: 'How the charge session is authenticated at the station.',
    cables: 'Whether the station provides its own cable or you bring one.',
    networks: 'Operator or "network" the station belongs to. Tariff and app vary by network.',
    powers: 'Filter by charger power. Pass an array of numbers.',
  },
  filterTypeRows: [
    ['"Tipo 2"', 'European three-phase AC (Mennekes). Slow/medium charge at home or public AC stations.'],
    ['"CCS2"', 'European combined DC fast. Dominant standard for modern cars in Uruguay.'],
    ['"CHAdeMO"', 'Japanese DC fast (Nissan Leaf, etc.). Limited compatibility.'],
    ['"GB/T"', 'Chinese DC fast. Mostly present in Asian fleets (BYD, etc.).'],
  ],
  filterStatusRows: [
    ['"available"', 'Available: free to start a charge.'],
    ['"charging"', 'Charging: currently in use.'],
    ['"no-comm"', 'No communication: station not reporting to the server.'],
    ['"unavailable"', 'Unavailable: out of service.'],
  ],
  filterPaymentRows: [
    ['"rfid"', 'UTE RFID card (physical card tapped against the reader).'],
    ['"app"', 'Mobile app (UTE Mueve / QR code / remote charge).'],
  ],
  filterCableRows: [
    ['"with"', 'With cable: the station provides one (faster to plug in).'],
    ['"without"', 'Without cable: you have to plug in your own (typical AC Type 2).'],
  ],
  filterNetworkRows: [
    ['"PUBLIC"', 'Public: UTE\'s own network, accessible to everyone.'],
    ['"TAXI"', 'Taxi: network dedicated to electric taxi fleet.'],
    ['"DMC"', 'DMC: external operator (EMSP). Roaming.'],
    ['"ONE"', 'eOne: external operator (EMSP). Roaming.'],
  ],
  filterPowerRows: [
    ['[0]', 'Any power (default if not specified).'],
    ['[60]', 'Only 60 kW fast chargers.'],
    ['[22, 50, 60]', 'Any of 22, 50, or 60 kW.'],
  ],
  alert: {
    title: '⚠️ Critical IDOR in the upstream API',
    body: (vrHref, secHref) =>
      `UTE's anonymous JWT is not bound to a user. An attacker with internet access and a valid Uruguayan CI can read first/last name, BIN + last 4 of the linked credit card, expiration month/year, brand, and Mercado Pago <code>payerCardId</code>. Full detail: <a href="${vrHref}"><strong>VR-001 Report</strong></a>. Extended technical notice: <a href="${secHref}">SECURITY.md</a>.`,
  },
  map: {
    title: 'Stations map',
    intro:
      'Preview powered by <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a> + Leaflet. Data comes from <code>POST /stations/search</code> live. Tweak the filters and the map updates itself.',
    apply: 'Apply filters',
    locate: 'Locate me',
    reset: 'Reset',
    loading: 'Loading…',
    legendAvailable: 'Available',
    legendCharging: 'Charging',
    legendNoComm: 'No comm',
    legendUnavailable: 'Unavailable',
    snippetTitle: 'Copy the code',
    snippetIntro: 'Snippet generated live with the filters you have selected above. Pick a language and copy it.',
    npmLink: '@ute-mueve/sdk on npm',
    githubLink: 'GitHub repository',
    apiRefLink: 'Full API reference',
  },
  cards: {
    map: { title: 'Interactive map', desc: 'Preview with OpenStreetMap + Leaflet, live filters, and code snippet in TS/JS/cURL/Python.' },
    docs: { title: 'API Reference', desc: 'Browse endpoints with real sanitized examples, Zod schemas, and inline "Try it". Rendered with Scalar.' },
    openapi: { title: 'OpenAPI 3.1 Spec', desc: 'JSON generated live from the Zod schemas. Ready for code generators.' },
    status: { title: 'Status check', desc: 'Performs a real round-trip to UTE (token + GET configuration). Returns OK, latency, and cache backend.' },
    health: { title: 'Health', desc: 'Simple liveness, does not touch upstream. Useful for Vercel/load-balancer health checks.' },
    security: { title: 'Security report', desc: '12 findings from the static APK analysis, including critical IDOR F-05.' },
    vr: { title: 'VR-001 — Critical IDOR', desc: 'Formal disclosure report: with an anonymous token and an 8-digit Uruguayan CI, PII and partial credit-card data are exposed.' },
    github: { title: 'GitHub', desc: 'Source code, implementation plan, design docs, and CI/CD.' },
    sdk: { title: 'SDK on npm', desc: '@ute-mueve/sdk · isomorphic TypeScript client, ESM + CJS, zero deps.' },
    types: { title: 'Types on npm', desc: '@ute-mueve/types · Zod schemas + quicktype-generated interfaces.' },
  },
};

export function t(lang: Lang): Strings {
  return lang === 'en' ? EN : ES;
}
