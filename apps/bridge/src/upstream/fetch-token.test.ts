import { describe, expect, it, vi } from 'vitest';
import { fetchUteToken } from './fetch-token.js';
import { UteApiError } from './errors.js';

describe('fetchUteToken', () => {
  it('POSTs to /token with required body and headers', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ access_token: 'abc', expires_in: 3600, token_type: 'Bearer' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    );
    const out = await fetchUteToken({
      baseUrl: 'https://x.test/api/v2',
      uniqueKey: 'key1',
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(out.access_token).toBe('abc');
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('no call');
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe('https://x.test/api/v2/token');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      clientIdIDP: 'cargaME',
      identifier: 'Anonymous',
    });
    const headers = new Headers(init.headers);
    expect(headers.get('uniquekeyuser')).toBe('key1');
  });

  it('throws on non-200', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 500 }));
    await expect(
      fetchUteToken({
        baseUrl: 'https://x.test/api/v2',
        uniqueKey: 'k',
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(UteApiError);
  });

  it('throws on missing access_token', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ wrong: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    await expect(
      fetchUteToken({
        baseUrl: 'https://x.test/api/v2',
        uniqueKey: 'k',
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(UteApiError);
  });
});
