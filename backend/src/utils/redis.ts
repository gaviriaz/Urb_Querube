import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: Redis | null = null;
let useMemoryFallback = false;
const memoryCache = new Map<string, string>();

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true
  });

  redisClient.on('error', (err) => {
    logger.warn(`Redis connection failed: ${err.message}. Falling back to In-Memory cache.`);
    useMemoryFallback = true;
  });

  redisClient.on('connect', () => {
    logger.info('Connected to Redis successfully.');
    useMemoryFallback = false;
  });

  // Try to connect asynchronously
  redisClient.connect().catch((err) => {
    logger.warn(`Redis connect catch: ${err.message}. Falling back to In-Memory cache.`);
    useMemoryFallback = true;
  });
} catch (err: any) {
  logger.warn(`Failed to initialize Redis client: ${err.message}. Using In-Memory fallback.`);
  useMemoryFallback = true;
}

export const cache = {
  async get(key: string): Promise<string | null> {
    if (useMemoryFallback || !redisClient) {
      return memoryCache.get(key) || null;
    }
    try {
      return await redisClient.get(key);
    } catch {
      return memoryCache.get(key) || null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryCache.set(key, value);
      if (ttlSeconds) {
        setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
      }
      return;
    }
    try {
      if (ttlSeconds) {
        await redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, value);
      }
    } catch {
      memoryCache.set(key, value);
      if (ttlSeconds) {
        setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
      }
    }
  },

  async del(key: string): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryCache.delete(key);
      return;
    }
    try {
      await redisClient.del(key);
    } catch {
      memoryCache.delete(key);
    }
  },

  async incr(key: string): Promise<number> {
    if (useMemoryFallback || !redisClient) {
      const current = Number(memoryCache.get(key) || 0) + 1;
      memoryCache.set(key, String(current));
      return current;
    }
    try {
      return await redisClient.incr(key);
    } catch {
      const current = Number(memoryCache.get(key) || 0) + 1;
      memoryCache.set(key, String(current));
      return current;
    }
  },

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      if (memoryCache.has(key)) {
        setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
      }
      return;
    }
    try {
      await redisClient.expire(key, ttlSeconds);
    } catch {
      if (memoryCache.has(key)) {
        setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
      }
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (useMemoryFallback || !redisClient) {
      // Basic wildcards to regex converter
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(memoryCache.keys()).filter(k => regex.test(k));
    }
    try {
      return await redisClient.keys(pattern);
    } catch {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(memoryCache.keys()).filter(k => regex.test(k));
    }
  }
};
