/**
 * In-memory JWT cache + single-flight acquisition for the SDK's direct-to-UTE mode.
 * Bundled here (instead of reusing the bridge's) so the SDK keeps zero non-types deps.
 */
import { UteSdkError } from './errors.js';

interface JwtPayload {
  exp?: number;
}

function decodeJwt(jwt: string): JwtPayload {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new UteSdkError({
      code: 'TOKEN_DECODE',
      status: 500,
      message: 'JWT does not have 3 parts',
    });
  }
  try {
    const payloadB64 = parts[1] as string;
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch (cause) {
    throw new UteSdkError({
      code: 'TOKEN_DECODE',
      status: 500,
      message: 'JWT payload decode failed',
      details: cause,
    });
  }
}

export interface TokenManagerOpts {
  /** Acquire a fresh token from the upstream. */
  acquire: () => Promise<{ access_token: string; expires_in: number }>;
  /** Skew in seconds before exp when we consider a token stale. Default 60. */
  refreshSkewSeconds?: number;
}

interface CachedToken {
  jwt: string;
  expiresAt: number;
}

export class SdkTokenManager {
  private cached: CachedToken | null = null;
  private inflight: Promise<string> | null = null;
  private readonly skewMs: number;

  constructor(private readonly opts: TokenManagerOpts) {
    this.skewMs = (opts.refreshSkewSeconds ?? 60) * 1000;
  }

  async getToken(): Promise<string> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.jwt;
    if (this.inflight) return this.inflight;
    this.inflight = this.acquire();
    try {
      return await this.inflight;
    } finally {
      this.inflight = null;
    }
  }

  invalidate(): void {
    this.cached = null;
  }

  private async acquire(): Promise<string> {
    const res = await this.opts.acquire();
    const payload = decodeJwt(res.access_token);
    const expSeconds = payload.exp ?? Math.floor(Date.now() / 1000) + res.expires_in;
    this.cached = {
      jwt: res.access_token,
      expiresAt: expSeconds * 1000 - this.skewMs,
    };
    return res.access_token;
  }
}

/** Generate a 13-hex-char random `uniquekeyuser` value. */
export function randomUniqueKey(): string {
  const bytes = new Uint8Array(7);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 13);
}
