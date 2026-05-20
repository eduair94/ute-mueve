import { UteSdkError } from './errors.js';
import { randomUniqueKey, SdkTokenManager } from './token-cache.js';

export interface UteMueveClientOpts {
  /**
   * Bridge base URL (e.g. `https://ute-mueve.vercel.app`).
   *
   * If omitted, the SDK runs in **direct mode**: it talks straight to
   * `https://movilidadelectrica.ute.com.uy/api/v2`, handling the anonymous
   * token lifecycle and `uniquekeyuser` header internally.
   *
   * Direct mode works out-of-the-box in Node.js. In the browser, UTE's
   * upstream does not send CORS headers, so use a bridge there.
   */
  baseUrl?: string;

  /**
   * Optional API key, forwarded as the `x-api-key` header. Only meaningful in
   * bridge mode (when `baseUrl` points to a bridge that gates by API key).
   */
  apiKey?: string;

  /**
   * Override the device key sent on the `uniquekeyuser` header in direct mode.
   * Ignored in bridge mode (the bridge injects its own).
   * Defaults to a freshly generated 13-hex value on first request.
   */
  uniqueKey?: string;

  /** Custom fetch (testing, custom polyfills). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;

  /** Request timeout in ms. Default 15000. */
  timeoutMs?: number;
}

const UTE_BASE = 'https://movilidadelectrica.ute.com.uy/api/v2';
const USER_AGENT = 'Dart/3.4 (dart:io)';

/**
 * HTTP layer. Operates in one of two modes:
 *
 * **Bridge mode** (default when `baseUrl` is set): plain JSON over HTTPS to
 * the bridge. The bridge handles auth.
 *
 * **Direct mode** (when `baseUrl` is omitted): hits UTE upstream directly,
 * acquires + caches anonymous JWT in memory, attaches `uniquekeyuser` + bearer
 * headers, single-flights cache misses, retries once on 401.
 */
export class UteMueveHttp {
  private readonly baseUrl: string;
  private readonly mode: 'direct' | 'bridge';
  private readonly apiKey: string | undefined;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;
  private readonly uniqueKey: string;
  private readonly tokenManager: SdkTokenManager | null;

  constructor(opts: UteMueveClientOpts) {
    if (opts.baseUrl) {
      this.mode = 'bridge';
      this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    } else {
      this.mode = 'direct';
      this.baseUrl = UTE_BASE;
    }
    this.apiKey = opts.apiKey;
    this.doFetch = opts.fetch ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 15000;
    this.uniqueKey = opts.uniqueKey ?? randomUniqueKey();
    this.tokenManager =
      this.mode === 'direct'
        ? new SdkTokenManager({ acquire: () => this.fetchUteToken() })
        : null;
  }

  isDirect(): boolean {
    return this.mode === 'direct';
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async fetchUteToken(): Promise<{ access_token: string; expires_in: number }> {
    const res = await this.doFetch(`${UTE_BASE}/token`, {
      method: 'POST',
      headers: {
        'user-agent': USER_AGENT,
        'content-type': 'application/json; charset=utf-8',
        'accept-encoding': 'gzip',
        uniquekeyuser: this.uniqueKey,
      },
      body: JSON.stringify({ clientIdIDP: 'cargaME', identifier: 'Anonymous' }),
    });
    if (!res.ok) {
      throw new UteSdkError({
        code: 'TOKEN_FAILED',
        status: res.status,
        message: `Token acquisition failed (${res.status})`,
      });
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token || !json.expires_in) {
      throw new UteSdkError({
        code: 'TOKEN_INVALID',
        status: 502,
        message: 'Upstream returned malformed token response',
      });
    }
    return { access_token: json.access_token, expires_in: json.expires_in };
  }

  private async authHeaders(
    body: unknown,
  ): Promise<Record<string, string>> {
    const base: Record<string, string> = { accept: 'application/json' };
    if (body !== undefined) base['content-type'] = 'application/json';
    if (this.apiKey) base['x-api-key'] = this.apiKey;
    if (this.mode === 'direct') {
      base['user-agent'] = USER_AGENT;
      base['uniquekeyuser'] = this.uniqueKey;
      // biome-ignore lint/style/noNonNullAssertion: tokenManager always set in direct mode
      const token = await this.tokenManager!.getToken();
      base.authorization = `Bearer ${token}`;
      // override content-type to match UTE's expected variant
      base['content-type'] = body !== undefined ? 'application/json; charset=utf-8' : 'application/json;';
      base['accept-encoding'] = 'gzip';
    }
    return base;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let attempt = 0;
    while (attempt < 2) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const init: RequestInit = {
          method,
          headers: await this.authHeaders(body),
          signal: ctrl.signal,
        };
        if (body !== undefined) init.body = JSON.stringify(body);
        const res = await this.doFetch(`${this.baseUrl}${path}`, init);
        const text = await res.text();
        const json = text ? (JSON.parse(text) as unknown) : null;
        if (!res.ok) {
          if (this.mode === 'direct' && res.status === 401 && this.tokenManager && attempt === 0) {
            this.tokenManager.invalidate();
            attempt += 1;
            continue;
          }
          if (json && typeof json === 'object' && 'error' in json) {
            throw new UteSdkError(
              (json as { error: { code: string; status: number; message: string; details?: unknown } })
                .error,
              json,
            );
          }
          throw new UteSdkError(
            { code: 'HTTP_ERROR', status: res.status, message: `Upstream returned ${res.status}` },
            text,
          );
        }
        return json as T;
      } catch (err) {
        if (err instanceof UteSdkError) throw err;
        if ((err as { name?: string }).name === 'AbortError') {
          throw new UteSdkError({
            code: 'TIMEOUT',
            status: 504,
            message: `Request timed out after ${this.timeoutMs}ms`,
          });
        }
        throw new UteSdkError({
          code: 'NETWORK',
          status: 0,
          message: (err as Error).message ?? 'Network error',
        });
      } finally {
        clearTimeout(t);
      }
    }
    throw new UteSdkError({
      code: 'UPSTREAM_AUTH',
      status: 401,
      message: 'Upstream rejected token twice',
    });
  }
}
