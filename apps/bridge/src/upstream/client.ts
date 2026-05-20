import type { TokenManager } from './token-manager.js';
import { UteApiError } from './errors.js';

export interface UpstreamClientOpts {
  baseUrl: string;
  uniqueKey: string;
  tokenManager: TokenManager;
  fetch?: typeof fetch;
  userAgent?: string;
}

export class UpstreamClient {
  private readonly baseUrl: string;
  private readonly uniqueKey: string;
  private readonly tokenManager: TokenManager;
  private readonly doFetch: typeof fetch;
  private readonly userAgent: string;

  constructor(opts: UpstreamClientOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.uniqueKey = opts.uniqueKey;
    this.tokenManager = opts.tokenManager;
    this.doFetch = opts.fetch ?? globalThis.fetch;
    this.userAgent = opts.userAgent ?? 'Dart/3.4 (dart:io)';
  }

  async get<T = unknown>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let attempt = 0;
    while (attempt < 2) {
      const token = await this.tokenManager.getToken();
      const init: RequestInit = {
        method,
        headers: {
          authorization: `Bearer ${token}`,
          uniquekeyuser: this.uniqueKey,
          'user-agent': this.userAgent,
          'accept-encoding': 'gzip',
          ...(body !== undefined
            ? { 'content-type': 'application/json; charset=utf-8' }
            : { 'content-type': 'application/json;' }),
        },
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      const res = await this.doFetch(`${this.baseUrl}${path}`, init);
      if (res.status === 401) {
        await this.tokenManager.invalidate();
        attempt += 1;
        if (attempt >= 2) {
          throw new UteApiError({
            code: 'UPSTREAM_AUTH',
            status: 401,
            message: 'Upstream rejected token twice',
          });
        }
        continue;
      }
      if (res.status >= 500) {
        throw new UteApiError({
          code: 'UPSTREAM_5XX',
          status: res.status,
          message: `Upstream ${res.status}`,
          upstream: await safeText(res),
        });
      }
      if (res.status >= 400) {
        throw new UteApiError({
          code: 'UPSTREAM_4XX',
          status: res.status,
          message: `Upstream ${res.status}`,
          upstream: await safeText(res),
        });
      }
      const text = await res.text();
      try {
        return text.length ? (JSON.parse(text) as T) : (undefined as T);
      } catch (cause) {
        throw new UteApiError({
          code: 'UPSTREAM_INVALID_RESPONSE',
          status: 502,
          message: 'Upstream response not JSON',
          details: cause,
          upstream: text.slice(0, 256),
        });
      }
    }
    throw new UteApiError({
      code: 'UPSTREAM_AUTH',
      status: 401,
      message: 'Retry loop exhausted',
    });
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 1024);
  } catch {
    return '';
  }
}
