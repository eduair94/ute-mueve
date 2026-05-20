import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { UteApiError } from '../upstream/errors.js';

export function registerNotificationRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'post',
      path: '/notification/register',
      tags: ['Notifications', 'Writes'],
      summary: 'Register an FCM token for push notifications (gated)',
      description:
        'Requires `ENABLE_WRITE_ENDPOINTS=true`. Associates a Firebase Cloud Messaging token with a device key (`UniqueKeyUser`).',
      request: {
        body: {
          content: {
            'application/json': { schema: schemas.NotificationRegisterRequestSchema },
          },
        },
      },
      responses: {
        200: {
          description: 'Result',
          content: {
            'application/json': { schema: schemas.NotificationRegisterResponseSchema },
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
      const data = await c.upstream.post<unknown>('/notification/register/', body);
      return ctx.json(schemas.NotificationRegisterResponseSchema.parse(data));
    },
  );
}
