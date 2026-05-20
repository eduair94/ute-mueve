import { Redis } from '@upstash/redis';
import { loadEnv, type Env } from './env.js';
import { createLogger, type Logger } from './logger.js';
import { UpstreamClient } from './upstream/client.js';
import { fetchUteToken } from './upstream/fetch-token.js';
import {
  InMemoryTokenCache,
  UpstashTokenCache,
  type TokenCache,
  type UpstashRedisLike,
} from './upstream/token-cache.js';
import { TokenManager } from './upstream/token-manager.js';

export interface Container {
  env: Env;
  logger: Logger;
  upstream: UpstreamClient;
  tokenManager: TokenManager;
}

let cached: Container | null = null;

export function getContainer(rawEnv: Record<string, string | undefined> = process.env): Container {
  if (cached) return cached;
  const env = loadEnv(rawEnv);
  const logger = createLogger(env);
  const cache: TokenCache =
    env.upstashUrl && env.upstashToken
      ? new UpstashTokenCache(
          new Redis({ url: env.upstashUrl, token: env.upstashToken }) as unknown as UpstashRedisLike,
        )
      : new InMemoryTokenCache();
  const tokenManager = new TokenManager({
    cache,
    cacheKey: 'ute:token:v1',
    fetchToken: () => fetchUteToken({ baseUrl: env.uteBaseUrl, uniqueKey: env.uteUniqueKey }),
  });
  const upstream = new UpstreamClient({
    baseUrl: env.uteBaseUrl,
    uniqueKey: env.uteUniqueKey,
    tokenManager,
  });
  cached = { env, logger, upstream, tokenManager };
  return cached;
}

export function resetContainer(): void {
  cached = null;
}
