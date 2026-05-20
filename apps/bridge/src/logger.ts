import type { Env } from './env.js';

/**
 * Lightweight structured-logger. We use console.* rather than pino because
 * pino bundlers (esbuild + serverless) often leave the event loop alive due
 * to worker-thread transports — which causes Vercel 504 timeouts.
 */
const LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
type Level = (typeof LEVELS)[number];

export interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
  debug(obj: unknown, msg?: string): void;
  trace(obj: unknown, msg?: string): void;
  fatal(obj: unknown, msg?: string): void;
}

function emit(active: Level, level: Level, obj: unknown, msg?: string) {
  if (LEVELS.indexOf(level) > LEVELS.indexOf(active)) return;
  const base = typeof obj === 'string' ? { msg: obj } : (obj as Record<string, unknown>);
  const payload = { level, time: new Date().toISOString(), ...base, ...(msg ? { msg } : {}) };
  const line = JSON.stringify(payload);
  if (level === 'error' || level === 'fatal') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function createLogger(env: Env): Logger {
  const active = env.logLevel;
  return {
    info: (o, m) => emit(active, 'info', o, m),
    warn: (o, m) => emit(active, 'warn', o, m),
    error: (o, m) => emit(active, 'error', o, m),
    debug: (o, m) => emit(active, 'debug', o, m),
    trace: (o, m) => emit(active, 'trace', o, m),
    fatal: (o, m) => emit(active, 'fatal', o, m),
  };
}
