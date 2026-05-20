import { createRoute, type OpenAPIHono, z } from '@hono/zod-openapi';
import { CustomerKeySchema, schemas } from '@ute-mueve/types';
import type { Container } from '../container.js';
import { remoteChargeUserExample } from '../examples.js';
import { UteApiError } from '../upstream/errors.js';

const KeyParamsSchema = z.object({ userId: CustomerKeySchema });

const TxParamsSchema = z.object({
  transactionId: z.string().min(1).max(128),
});

function guardWrites(c: Container) {
  if (!c.env.enableWriteEndpoints) {
    throw new UteApiError({
      code: 'WRITES_DISABLED',
      status: 503,
      message: 'Write endpoints disabled by configuration',
    });
  }
}

export function registerRemoteChargeRoutes(app: OpenAPIHono, c: Container) {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/remotecharge/user/{userId}',
      tags: ['Remote Charge'],
      summary: 'Remote-charge session history',
      description: '`userId` accepts a Uruguayan CI (validated) or a Firebase UID.',
      request: { params: KeyParamsSchema },
      responses: {
        200: {
          description: 'Envelope-wrapped session history',
          content: {
            'application/json': {
              schema: schemas.RemoteChargeHistoryResponseSchema,
              example: remoteChargeUserExample,
            },
          },
        },
      },
    }),
    async (ctx) => {
      const { userId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(`/remotecharge/user/${encodeURIComponent(userId)}`);
      return ctx.json(schemas.RemoteChargeHistoryResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/remotecharge/transaction/{transactionId}',
      tags: ['Remote Charge'],
      summary: 'Detail of a specific charge transaction',
      request: { params: TxParamsSchema },
      responses: {
        200: {
          description: 'Envelope-wrapped transaction detail',
          content: {
            'application/json': { schema: schemas.ConnectorStatusResponseSchema },
          },
        },
      },
    }),
    async (ctx) => {
      const { transactionId } = ctx.req.valid('param');
      const data = await c.upstream.get<unknown>(
        `/remotecharge/transaction/${encodeURIComponent(transactionId)}`,
      );
      return ctx.json(schemas.ConnectorStatusResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/remotecharge/connector/status',
      tags: ['Remote Charge'],
      summary: 'Live status of a station connector',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.ConnectorStatusRequestSchema } },
        },
      },
      responses: {
        200: {
          description: 'Connector status',
          content: {
            'application/json': { schema: schemas.ConnectorStatusResponseSchema },
          },
        },
      },
    }),
    async (ctx) => {
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/remotecharge/connector/status', body);
      return ctx.json(schemas.ConnectorStatusResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/remotecharge/start',
      tags: ['Remote Charge', 'Writes'],
      summary: 'Start a remote charging session (gated)',
      description: 'Requires `ENABLE_WRITE_ENDPOINTS=true`. Starts a real charging session.',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.StartRemoteChargeRequestSchema } },
        },
      },
      responses: {
        200: {
          description: 'Result',
          content: {
            'application/json': { schema: schemas.RemoteChargeActionResponseSchema },
          },
        },
        503: { description: 'Writes disabled' },
      },
    }),
    async (ctx) => {
      guardWrites(c);
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/remotecharge/start', body);
      return ctx.json(schemas.RemoteChargeActionResponseSchema.parse(data));
    },
  );

  app.openapi(
    createRoute({
      method: 'post',
      path: '/remotecharge/stop',
      tags: ['Remote Charge', 'Writes'],
      summary: 'Stop a remote charging session (gated)',
      description: 'Requires `ENABLE_WRITE_ENDPOINTS=true`. Stops an active charging session.',
      request: {
        body: {
          content: { 'application/json': { schema: schemas.StopRemoteChargeRequestSchema } },
        },
      },
      responses: {
        200: {
          description: 'Result',
          content: {
            'application/json': { schema: schemas.RemoteChargeActionResponseSchema },
          },
        },
        503: { description: 'Writes disabled' },
      },
    }),
    async (ctx) => {
      guardWrites(c);
      const body = ctx.req.valid('json');
      const data = await c.upstream.post<unknown>('/remotecharge/stop', body);
      return ctx.json(schemas.RemoteChargeActionResponseSchema.parse(data));
    },
  );
}
