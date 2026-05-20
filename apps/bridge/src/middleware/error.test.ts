import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { errorMiddleware } from './error.js';
import { UteApiError } from '../upstream/errors.js';

describe('errorMiddleware', () => {
  it('formats UteApiError', async () => {
    const app = new Hono();
    app.onError(errorMiddleware);
    app.get('/x', () => {
      throw new UteApiError({ code: 'UPSTREAM_4XX', status: 404, message: 'nope' });
    });
    const res = await app.request('/x');
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string; status: number; message: string } };
    expect(body.error).toMatchObject({ code: 'UPSTREAM_4XX', status: 404, message: 'nope' });
  });

  it('formats unknown error as 500', async () => {
    const app = new Hono();
    app.onError(errorMiddleware);
    app.get('/x', () => {
      throw new Error('boom');
    });
    const res = await app.request('/x');
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('INTERNAL');
  });
});
