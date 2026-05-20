import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { CustomerKeySchema, schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { networkExample } from '../examples.js';

const ParamsSchema = z.object({ userId: CustomerKeySchema });

export function registerNetworkRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/network/{userId}',
      tags: ['Networks'],
      summary: 'Redes de carga habilitadas para el cliente',
      description: '`userId` acepta una cédula uruguaya (validada con dígito verificador) o un Firebase UID.',
      request: { params: ParamsSchema },
      responses: {
        200: {
          description: 'Envelope-wrapped network list',
          content: {
            'application/json': {
              schema: schemas.UserNetworksResponseSchema,
              example: networkExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/network/${encodeURIComponent(userId)}`);
      return ctx.json(schemas.UserNetworksResponseSchema.parse(data));
    },
  );
}
