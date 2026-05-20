import type { TokenCache } from './token-cache.js';
import { UteApiError } from './errors.js';

export interface TokenManagerOpts {
  cache: TokenCache;
  cacheKey: string;
  fetchToken: () => Promise<{ access_token: string; expires_in: number }>;
  /** Seconds before JWT exp when we should refresh proactively. Default 60. */
  refreshSkewSeconds?: number;
}

interface JwtPayload {
  exp?: number;
  nbf?: number;
}

function decodeJwt(jwt: string): JwtPayload {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new UteApiError({
      code: 'TOKEN_DECODE',
      status: 500,
      message: 'JWT does not have 3 parts',
    });
  }
  try {
    const payload = parts[1] as string;
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch (cause) {
    throw new UteApiError({
      code: 'TOKEN_DECODE',
      status: 500,
      message: 'JWT payload decode failed',
      details: cause,
    });
  }
}

export class TokenManager {
  private inflight: Promise<string> | null = null;
  private readonly refreshSkewMs: number;

  constructor(private readonly opts: TokenManagerOpts) {
    this.refreshSkewMs = (opts.refreshSkewSeconds ?? 60) * 1000;
  }

  async getToken(): Promise<string> {
    const cached = await this.opts.cache.get(this.opts.cacheKey);
    if (cached && this.isFresh(cached)) return cached;
    if (this.inflight) return this.inflight;
    this.inflight = this.acquire();
    try {
      return await this.inflight;
    } finally {
      this.inflight = null;
    }
  }

  async invalidate(): Promise<void> {
    await this.opts.cache.invalidate(this.opts.cacheKey);
  }

  private async acquire(): Promise<string> {
    const res = await this.opts.fetchToken();
    const payload = decodeJwt(res.access_token);
    const skewSeconds = Math.floor(this.refreshSkewMs / 1000);
    const ttlSeconds = payload.exp
      ? Math.max(60, payload.exp - Math.floor(Date.now() / 1000) - skewSeconds)
      : Math.max(60, res.expires_in - skewSeconds);
    await this.opts.cache.set(this.opts.cacheKey, res.access_token, ttlSeconds);
    return res.access_token;
  }

  private isFresh(jwt: string): boolean {
    try {
      const payload = decodeJwt(jwt);
      if (!payload.exp) return true;
      return payload.exp * 1000 > Date.now() + this.refreshSkewMs;
    } catch {
      return false;
    }
  }
}
