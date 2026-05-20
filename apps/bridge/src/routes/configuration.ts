import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { configurationAppVersionExample } from '../examples.js';

export function registerConfigurationRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/configuration/appversion',
      tags: ['Configuration'],
      summary: 'Minimum supported app version',
      responses: {
        200: {
          description: 'App version metadata (envelope-wrapped)',
          content: {
            'application/json': {
              schema: schemas.AppVersionResponseSchema,
              example: configurationAppVersionExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const data = await c.upstream.get<unknown>('/configuration/appversion');
      return ctx.json(schemas.AppVersionResponseSchema.parse(data));
    },
  );
}
