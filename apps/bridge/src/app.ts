import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import type { Container } from './container.js';
import { errorMiddleware } from './middleware/error.js';
import { renderDashboard } from './views/dashboard.js';
import { pickLang } from './views/i18n.js';
import { renderMap } from './views/map.js';
import { renderSecurityIndex, renderVr001 } from './views/markdown.js';
import { registerConfigurationRoutes } from './routes/configuration.js';
import { registerStationRoutes } from './routes/stations.js';
import { registerCustomerRoutes } from './routes/customer.js';
import { registerCardRoutes } from './routes/card.js';
import { registerNetworkRoutes } from './routes/network.js';
import { registerRemoteChargeRoutes } from './routes/remote-charge.js';
import { registerAccountRoutes } from './routes/accounts.js';
import { registerNotificationRoutes } from './routes/notification.js';

export function createApp(container: Container) {
  const app = new OpenAPIHono();

  app.use('*', async (ctx, next) => {
    const start = Date.now();
    await next();
    container.logger.info({
      method: ctx.req.method,
      path: ctx.req.path,
      status: ctx.res.status,
      ms: Date.now() - start,
    });
  });

  app.use(
    '*',
    cors({
      origin: container.env.corsOrigins.includes('*') ? '*' : container.env.corsOrigins,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'x-api-key'],
      maxAge: 600,
    }),
  );

  app.get('/', (ctx) => ctx.html(renderDashboard(pickLang(ctx.req.url))));
  app.get('/api', (ctx) =>
    ctx.json({
      name: 'ute-mueve-bridge',
      version: '0.1.0',
      docs: '/docs',
      openapi: '/openapi.json',
      health: '/health',
      status: '/status',
      security: '/security',
      vr001: '/security/vr-001',
      unaffiliated_with_ute: true,
    }),
  );
  app.get('/map', (ctx) => ctx.html(renderMap(pickLang(ctx.req.url))));
  app.get('/security', (ctx) => ctx.html(renderSecurityIndex(pickLang(ctx.req.url))));
  app.get('/security/vr-001', (ctx) => ctx.html(renderVr001(pickLang(ctx.req.url))));

  app.get('/health', (ctx) => ctx.json({ ok: true }));

  /**
   * Deep validation endpoint: round-trips the upstream by acquiring a token
   * and probing `/configuration/appversion`. Returns 200 only when token
   * acquisition and a single upstream GET both succeed.
   */
  app.get('/status', async (ctx) => {
    const t0 = Date.now();
    try {
      const data = await container.upstream.get<unknown>('/configuration/appversion');
      return ctx.json({
        ok: true,
        ms: Date.now() - t0,
        upstreamSampleKeys: Object.keys((data as { data?: unknown }).data ?? {}),
        cache: container.env.upstashUrl ? 'upstash' : 'in-memory',
      });
    } catch (err) {
      const e = err as { code?: string; status?: number; message?: string };
      return ctx.json(
        {
          ok: false,
          ms: Date.now() - t0,
          error: { code: e.code ?? 'UNKNOWN', status: e.status ?? 500, message: e.message },
        },
        500,
      );
    }
  });

  registerConfigurationRoutes(app, container);
  registerStationRoutes(app, container);
  registerCustomerRoutes(app, container);
  registerCardRoutes(app, container);
  registerNetworkRoutes(app, container);
  registerRemoteChargeRoutes(app, container);
  registerAccountRoutes(app, container);
  registerNotificationRoutes(app, container);

  app.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'Puente UTE Mueve',
      version: '0.1.0',
      description:
        'Puente no oficial a movilidadelectrica.ute.com.uy/api/v2. Gestiona el ciclo de vida del JWT anónimo internamente. NO afiliado a UTE. Ver SECURITY.md y docs/security/2026-05-20-VR-001-idor-customer-card.md.',
      contact: { email: 'admin@checkleaked.cc' },
      license: { name: 'MIT' },
    },
    servers: [{ url: '/' }],
  });

  app.get(
    '/docs',
    apiReference({
      spec: { url: '/openapi.json' },
      theme: 'purple',
      pageTitle: 'Puente UTE Mueve — Referencia de la API',
    }),
  );

  app.onError(errorMiddleware);
  return app;
}
