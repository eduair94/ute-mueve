import { describe, expect, it } from 'vitest';
import { InMemoryTokenCache } from './token-cache.js';

describe('InMemoryTokenCache', () => {
  it('returns null on miss', async () => {
    const cache = new InMemoryTokenCache();
    expect(await cache.get('k')).toBeNull();
  });

  it('returns value while not expired', async () => {
    const cache = new InMemoryTokenCache();
    await cache.set('k', 'jwt', 60);
    expect(await cache.get('k')).toBe('jwt');
  });

  it('returns null after invalidate', async () => {
    const cache = new InMemoryTokenCache();
    await cache.set('k', 'jwt', 60);
    await cache.invalidate('k');
    expect(await cache.get('k')).toBeNull();
  });

  it('returns null when ttl exhausted (clock advanced)', async () => {
    let now = 0;
    const cache = new InMemoryTokenCache({ now: () => now });
    await cache.set('k', 'jwt', 1);
    now = 2000;
    expect(await cache.get('k')).toBeNull();
  });
});
