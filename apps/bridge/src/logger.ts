import { pino } from 'pino';
import type { Env } from './env.js';

export function createLogger(env: Env) {
  return pino({
    level: env.logLevel,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type Logger = ReturnType<typeof createLogger>;
