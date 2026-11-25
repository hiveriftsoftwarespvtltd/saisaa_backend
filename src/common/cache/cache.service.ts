import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry<any>>();

  /**
   * Retrieves an item from cache if it exists and has not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Stores an item in cache with a TTL (default: 60 seconds).
   */
  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Deletes a specific key or keys matching a prefix wildcard (e.g. 'products*').
   */
  del(keyOrPattern: string): void {
    if (keyOrPattern.endsWith('*')) {
      const prefix = keyOrPattern.slice(0, -1);
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      }
    } else {
      this.store.delete(keyOrPattern);
    }
  }

  /**
   * Flushes all stored cache entries.
   */
  clear(): void {
    this.store.clear();
  }
}
