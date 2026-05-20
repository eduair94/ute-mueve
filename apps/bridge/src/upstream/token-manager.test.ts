import { describe, expect, it, vi } from 'vitest';
import { InMemoryTokenCache } from './token-cache.js';
import { TokenManager } from './token-manager.js';

const dummyJwt = (() => {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString('base64url');
  return `${header}.${payload}.signature`;
})();

describe('TokenManager', () => {
  it('fetches and caches on first call', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ access_token: dummyJwt, expires_in: 3600 });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    expect(await mgr.getToken()).toBe(dummyJwt);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('returns cached token on second call', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ access_token: dummyJwt, expires_in: 3600 });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    await mgr.getToken();
    await mgr.getToken();
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('single-flights concurrent acquisitions', async () => {
    const fetchToken = vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { access_token: dummyJwt, expires_in: 3600 };
    });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    const results = await Promise.all([mgr.getToken(), mgr.getToken(), mgr.getToken()]);
    expect(results.every((t) => t === dummyJwt)).toBe(true);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('invalidate forces refetch', async () => {
    const fetchToken = vi.fn().mockResolvedValue({ access_token: dummyJwt, expires_in: 3600 });
    const mgr = new TokenManager({ cache: new InMemoryTokenCache(), fetchToken, cacheKey: 'k' });
    await mgr.getToken();
    await mgr.invalidate();
    await mgr.getToken();
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });
});
