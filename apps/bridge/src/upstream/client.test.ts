import { describe, expect, it, vi } from 'vitest';
import { InMemoryTokenCache } from './token-cache.js';
import { TokenManager } from './token-manager.js';
import { UpstreamClient } from './client.js';
import { UteApiError } from './errors.js';

const validJwt = (() => {
  const h = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString(
    'base64url',
  );
  return `${h}.${p}.sig`;
})();

function makeClient(fetchMock: typeof fetch) {
  const tokenManager = new TokenManager({
    cache: new InMemoryTokenCache(),
    cacheKey: 'k',
    fetchToken: async () => ({ access_token: validJwt, expires_in: 3600 }),
  });
  return new UpstreamClient({
    baseUrl: 'https://example.test/api/v2',
    uniqueKey: 'abc',
    tokenManager,
    fetch: fetchMock,
  });
}

describe('UpstreamClient', () => {
  it('injects bearer + uniquekeyuser headers', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const client = makeClient(fetchMock as unknown as typeof fetch);
    const res = await client.get('/test');
    expect(res).toEqual({ ok: true });
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('no call');
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${validJwt}`);
    expect(headers.get('uniquekeyuser')).toBe('abc');
  });

  it('on 401 invalidates and retries once', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response('', { status: 401 });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const client = makeClient(fetchMock as unknown as typeof fetch);
    const res = await client.get('/test');
    expect(res).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('on second 401 throws UPSTREAM_AUTH', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 401 }));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await expect(client.get('/test')).rejects.toMatchObject({ code: 'UPSTREAM_AUTH' });
  });

  it('throws UteApiError on 503', async () => {
    const fetchMock = vi.fn(async () => new Response('boom', { status: 503 }));
    const client = makeClient(fetchMock as unknown as typeof fetch);
    await expect(client.get('/test')).rejects.toBeInstanceOf(UteApiError);
  });
});
