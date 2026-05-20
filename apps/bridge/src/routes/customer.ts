import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { CustomerKeySchema, schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { customerCardExample } from '../examples.js';
import { UteApiError } from '../upstream/errors.js';

const ParamsSchema = z.object({ userId: CustomerKeySchema });

export function registerCustomerRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/customer/card/{userId}',
      tags: ['Customer'],
      summary: 'Metadatos de tarjeta de crédito del cliente',
      description:
        "Returns the customer's MercadoPago-linked credit-card metadata. `userId` accepts a Uruguayan CI (6-8 digits, validated) or a Firebase Auth UID (>= 16 alphanumeric chars). See SECURITY.md F-05.",
      request: { params: ParamsSchema },
      responses: {
        200: {
          description: 'Envelope-wrapped customer card list',
          content: {
            'application/json': {
              schema: schemas.CustomerCardListSchema,
              example: customerCardExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/customer/card/${encodeURIComponent(userId)}`);
      return ctx.json(schemas.CustomerCardListSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/customer/card/register',
      tags: ['Customer', 'Writes'],
      summary: 'Registrar nueva tarjeta de pago (write, gated)',
      description:
        'Requires `ENABLE_WRITE_ENDPOINTS=true`. Modifies a real UTE Mueve customer account.',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.RegisterCardRequestSchema } },
        },
      },
      responses: {
        200: {
          description: 'Result',
          content: {
            'application/json': { schema: schemas.RegisterCardResponseSchema },
          },
        },
        503: { description: 'Writes disabled' },
      },
    }),
    async (ctx) => {
      if (!c.env.enableWriteEndpoints) {
        throw new UteApiError({
          code: 'WRITES_DISABLED',
          status: 503,
          message: 'Write endpoints disabled by configuration',
        });
      }
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/customer/card/register', body);
      return ctx.json(schemas.RegisterCardResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/customer/card/unregister',
      tags: ['Customer', 'Writes'],
      summary: 'Desregistrar tarjeta de pago (write, gated)',
      description: 'Requires `ENABLE_WRITE_ENDPOINTS=true`.',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.RegisterCardRequestSchema.partial() } },
        },
      },
      responses: {
        200: {
          description: 'Result',
          content: {
            'application/json': { schema: schemas.RegisterCardResponseSchema },
          },
        },
        503: { description: 'Writes disabled' },
      },
    }),
    async (ctx) => {
      if (!c.env.enableWriteEndpoints) {
        throw new UteApiError({
          code: 'WRITES_DISABLED',
          status: 503,
          message: 'Write endpoints disabled by configuration',
        });
      }
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/customer/card/unregister', body);
      return ctx.json(schemas.RegisterCardResponseSchema.parse(data));
    },
  );
}
