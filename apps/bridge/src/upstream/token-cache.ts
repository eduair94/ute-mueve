export interface TokenCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  invalidate(key: string): Promise<void>;
}

export class InMemoryTokenCache implements TokenCache {
  private readonly store = new Map<string, { value: string; expiresAt: number }>();
  private readonly now: () => number;

  constructor(opts: { now?: () => number } = {}) {
    this.now = opts.now ?? Date.now;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: this.now() + ttlSeconds * 1000 });
  }

  async invalidate(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export interface UpstashRedisLike {
  get(k: string): Promise<string | null>;
  set(k: string, v: string, opts: { ex: number }): Promise<unknown>;
  del(k: string): Promise<unknown>;
}

export class UpstashTokenCache implements TokenCache {
  constructor(private readonly redis: UpstashRedisLike) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, { ex: ttlSeconds });
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
