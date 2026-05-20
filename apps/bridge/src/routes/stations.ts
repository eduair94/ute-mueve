import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { expandStationsFilters, schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { stationRenewEnergyExample, stationStatusFilteredExample } from '../examples.js';

export function registerStationRoutes(app: OpenAPIHono, c: Container) {
  // --- Friendly endpoint: /stations/search (POST + GET) -----------------

  const SearchBody = schemas.StationsSearchRequestSchema;

  app.openapi(
    createRoute({
      method: 'post',
      path: '/stations/search',
      tags: ['Stations'],
      summary: 'Búsqueda ergonómica de estaciones',
      description:
        'Busca estaciones de carga EV con enums amigables (CCS2, available, PUBLIC, etc.). Internamente expande al body verboso de UTE `/station/statusFiltered`. Todos los campos opcionales; por defecto devuelve estaciones disponibles en todas las redes y tipos de conector.',
      request: {
        body: { content: { 'application/json': { schema: SearchBody } } },
      },
      responses: {
        200: {
          description: 'Estaciones (envueltas en envelope UTE)',
          content: {
            'application/json': {
              schema: schemas.StatusFilteredResponseSchema,
              example: stationStatusFilteredExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const expanded = expandStationsFilters(body);
      const data = await c.upstream.post<unknown>('/station/statusFiltered', expanded);
      return ctx.json(schemas.StatusFilteredResponseSchema.parse(data));
    },
  );

  const QuerySchema = z.object({
    types: z.string().optional(),
    statuses: z.string().optional(),
    payments: z.string().optional(),
    cables: z.string().optional(),
    networks: z.string().optional(),
    powers: z.string().optional(),
  });

  app.openapi(
    createRoute({
      method: 'get',
      path: '/stations',
      tags: ['Stations'],
      summary: 'Búsqueda ergonómica vía query string (URLs compartibles)',
      description:
        'Equivalente a `POST /stations/search` pero acepta query params separados por coma, p. ej. `?types=CCS2,CHAdeMO&statuses=available&networks=PUBLIC`. Fácil de compartir como URL.',
      request: { query: QuerySchema },
      responses: {
        200: {
          description: 'Estaciones (envueltas en envelope UTE)',
          content: {
            'application/json': {
              schema: schemas.StatusFilteredResponseSchema,
              example: stationStatusFilteredExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const q = ctx.req.valid('query');
      const split = (s: string | undefined) =>
        s ? s.split(',').map((x) => x.trim()).filter(Boolean) : undefined;
      const search = schemas.StationsSearchRequestSchema.parse({
        connectorTypes: split(q.types),
        statuses: split(q.statuses),
        paymentTypes: split(q.payments),
        cables: split(q.cables),
        networks: split(q.networks),
        powers: q.powers
          ? q.powers.split(',').map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n))
          : undefined,
      });
      const expanded = expandStationsFilters(search);
      const data = await c.upstream.post<unknown>('/station/statusFiltered', expanded);
      return ctx.json(schemas.StatusFilteredResponseSchema.parse(data));
    },
  );

  app.get('/stations/available', async (ctx) => {
    const expanded = expandStationsFilters({ statuses: ['available'] });
    const data = await c.upstream.post<unknown>('/station/statusFiltered', expanded);
    return ctx.json(schemas.StatusFilteredResponseSchema.parse(data));
  });

  // --- Power-user endpoint: passes UTE's verbose body through unchanged -

  app.openapi(
    createRoute({
      method: 'post',
      path: '/station/statusFiltered',
      tags: ['Stations', 'Advanced'],
      summary: 'Body verbatim de UTE (power-user)',
      description:
        'Endpoint para power-users; espeja el upstream UTE `/api/v2/station/statusFiltered` 1:1. Para la mayoría de los casos preferí `POST /stations/search`.',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.StatusFilteredRequestSchema } },
        },
      },
      responses: {
        200: {
          description: 'Envelope-wrapped array of stations',
          content: {
            'application/json': {
              schema: schemas.StatusFilteredResponseSchema,
              example: stationStatusFilteredExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/station/statusFiltered', body);
      return ctx.json(schemas.StatusFilteredResponseSchema.parse(data));
    },
  );

  // --- Renewable energy -------------------------------------------------

  app.openapi(
    createRoute({
      method: 'post',
      path: '/station/renewEnergy',
      tags: ['Stations'],
      summary: 'Energía renovable agregada en un rango de fechas',
      request: {
        body: { content: { 'application/json': { schema: schemas.RenewEnergyRequestSchema } } },
      },
      responses: {
        200: {
          description: 'Aggregate renewable-energy data',
          content: {
            'application/json': {
              schema: schemas.RenewEnergyResponseSchema,
              example: stationRenewEnergyExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/station/renewEnergy', body);
      return ctx.json(schemas.RenewEnergyResponseSchema.parse(data));
    },
  );
}
