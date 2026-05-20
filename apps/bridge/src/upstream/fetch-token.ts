import { schemas } from '@ute-mueve/types';
import { UteApiError } from './errors.js';

export interface FetchTokenOpts {
  baseUrl: string;
  uniqueKey: string;
  fetch?: typeof fetch;
  userAgent?: string;
}

export async function fetchUteToken(opts: FetchTokenOpts): Promise<schemas.TokenResponse> {
  const doFetch = opts.fetch ?? globalThis.fetch;
  const res = await doFetch(`${opts.baseUrl.replace(/\/$/, '')}/token`, {
    method: 'POST',
    headers: {
      'user-agent': opts.userAgent ?? 'Dart/3.4 (dart:io)',
      'content-type': 'application/json; charset=utf-8',
      'accept-encoding': 'gzip',
      uniquekeyuser: opts.uniqueKey,
    },
    body: JSON.stringify({ clientIdIDP: 'cargaME', identifier: 'Anonymous' }),
  });
  if (res.status !== 200) {
    throw new UteApiError({
      code: res.status >= 500 ? 'UPSTREAM_5XX' : 'UPSTREAM_4XX',
      status: res.status,
      message: `Token endpoint returned ${res.status}`,
      upstream: await safeText(res),
    });
  }
  const json = (await res.json().catch(() => null)) as unknown;
  const parsed = schemas.TokenResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new UteApiError({
      code: 'UPSTREAM_INVALID_RESPONSE',
      status: 502,
      message: 'Token response invalid shape',
      details: parsed.error.flatten(),
    });
  }
  return parsed.data;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 256);
  } catch {
    return '';
  }
}
