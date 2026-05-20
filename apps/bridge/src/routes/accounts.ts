import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { cardAccountsExample } from '../examples.js';

export function registerAccountRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/card/accounts',
      tags: ['Accounts'],
      summary: 'Lookup customer accounts by identifier',
      description:
        'Returns accounts and masked cardIds for the given identifier. With `docType:"CI"` and a Uruguayan cédula, this endpoint resolves a customer record without per-user auth. See SECURITY.md F-05 / VR-001.',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.AccountsLookupRequestSchema } },
        },
      },
      responses: {
        200: {
          description: 'Envelope-wrapped account list',
          content: {
            'application/json': {
              schema: schemas.AccountsLookupResponseSchema,
              example: cardAccountsExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      // Upstream URL has a trailing slash on this endpoint.
      const data = await c.upstream.post<unknown>('/card/accounts/', body);
      return ctx.json(schemas.AccountsLookupResponseSchema.parse(data));
    },
  );
}
