import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { CustomerKeySchema, schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { cardExample } from '../examples.js';

const ParamsSchema = z.object({ userId: CustomerKeySchema });

export function registerCardRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/card/{userId}',
      tags: ['Cards'],
      summary: 'List of UTE-issued cards for the customer',
      description: '`userId` accepts a Uruguayan CI (validated) or a Firebase UID.',
      request: { params: ParamsSchema },
      responses: {
        200: {
          description: 'Envelope-wrapped card list',
          content: {
            'application/json': {
              schema: schemas.CardListResponseSchema,
              example: cardExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/card/${encodeURIComponent(userId)}`);
      return ctx.json(schemas.CardListResponseSchema.parse(data));
    },
  );
}
