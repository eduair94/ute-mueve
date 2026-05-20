import { z } from 'zod';

const RawEnvSchema = z.object({
  UTE_UNIQUE_KEY: z.string().min(1),
  UTE_BASE_URL: z.string().url().default('https://movilidadelectrica.ute.com.uy/api/v2'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  ENABLE_WRITE_ENDPOINTS: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export interface Env {
  uteUniqueKey: string;
  uteBaseUrl: string;
  upstashUrl: string | undefined;
  upstashToken: string | undefined;
  enableWriteEndpoints: boolean;
  corsOrigins: string[];
  rateLimitPerMin: number | undefined;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

export function loadEnv(raw: Record<string, string | undefined>): Env {
  const parsed = RawEnvSchema.parse(raw);
  return {
    uteUniqueKey: parsed.UTE_UNIQUE_KEY,
    uteBaseUrl: parsed.UTE_BASE_URL,
    upstashUrl: parsed.UPSTASH_REDIS_REST_URL,
    upstashToken: parsed.UPSTASH_REDIS_REST_TOKEN,
    enableWriteEndpoints: parsed.ENABLE_WRITE_ENDPOINTS === 'true',
    corsOrigins:
      parsed.CORS_ORIGINS?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? ['*'],
    rateLimitPerMin: parsed.RATE_LIMIT_PER_MIN ? Number(parsed.RATE_LIMIT_PER_MIN) : undefined,
    logLevel: parsed.LOG_LEVEL,
  };
}
