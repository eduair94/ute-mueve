import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { stationRenewEnergyExample, stationStatusFilteredExample } from '../examples.js';

export function registerStationRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/station/statusFiltered',
      tags: ['Stations'],
      summary: 'Charging stations filtered by connector criteria',
      description:
        'Returns stations matching the supplied connector filters. Pass arrays of UTE filter options with `selected: true` for the categories you want to include.',
      request: {
        body: {
          content: {
            'application/json': { schema: schemas.StatusFilteredRequestSchema },
          },
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

  app.openapi(
    createRoute({
      method: 'post',
      path: '/station/renewEnergy',
      tags: ['Stations'],
      summary: 'Renewable-energy aggregates for a date range',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.RenewEnergyRequestSchema } },
        },
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
