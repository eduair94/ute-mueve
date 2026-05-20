import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('throws when UTE_UNIQUE_KEY missing', () => {
    expect(() => loadEnv({})).toThrow(/UTE_UNIQUE_KEY/);
  });

  it('returns defaults when optional vars absent', () => {
    const env = loadEnv({ UTE_UNIQUE_KEY: 'abc123' });
    expect(env.uteUniqueKey).toBe('abc123');
    expect(env.enableWriteEndpoints).toBe(false);
    expect(env.upstashUrl).toBeUndefined();
    expect(env.corsOrigins).toEqual(['*']);
  });

  it('parses ENABLE_WRITE_ENDPOINTS=true', () => {
    const env = loadEnv({ UTE_UNIQUE_KEY: 'k', ENABLE_WRITE_ENDPOINTS: 'true' });
    expect(env.enableWriteEndpoints).toBe(true);
  });

  it('parses comma-separated CORS_ORIGINS', () => {
    const env = loadEnv({ UTE_UNIQUE_KEY: 'k', CORS_ORIGINS: 'https://a.com, https://b.com' });
    expect(env.corsOrigins).toEqual(['https://a.com', 'https://b.com']);
  });
});
