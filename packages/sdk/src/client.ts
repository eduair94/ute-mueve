import { UteSdkError } from './errors.js';

export interface UteMueveClientOpts {
  /** Bridge base URL, e.g. https://ute-bridge.vercel.app */
  baseUrl: string;
  /** Optional API key, sent as `x-api-key` header if provided. */
  apiKey?: string;
  /** Custom fetch (testing, custom polyfills). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
  /** Request timeout in ms. Default 15000. */
  timeoutMs?: number;
}

export class UteMueveHttp {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly doFetch: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: UteMueveClientOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.doFetch = opts.fetch ?? globalThis.fetch;
    this.timeoutMs = opts.timeoutMs ?? 15000;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const init: RequestInit = {
        method,
        headers: {
          accept: 'application/json',
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
          ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
        },
        signal: ctrl.signal,
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      const res = await this.doFetch(`${this.baseUrl}${path}`, init);
      const text = await res.text();
      const json = text ? (JSON.parse(text) as unknown) : null;
      if (!res.ok) {
        if (json && typeof json === 'object' && 'error' in json) {
          throw new UteSdkError(
            (json as { error: { code: string; status: number; message: string; details?: unknown } })
              .error,
            json,
          );
        }
        throw new UteSdkError(
          { code: 'HTTP_ERROR', status: res.status, message: `Bridge returned ${res.status}` },
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
}
