import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: false,
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  return redisClient;
}

// Helper functions for provider caching
export const PROVIDER_CACHE_TTL = 300; // 5 minutes
export const NODE_STATUS_TTL = 60; // 1 minute

export interface CachedProviderData {
  nodeId: string;
  providerId: string;
  gpuSpecs: any;
  lastSeen: string;
  status: 'online' | 'offline' | 'draining';
}

export async function cacheProviderData(
  nodeId: string,
  data: CachedProviderData
): Promise<void> {
  const client = getRedisClient();
  const key = `node:${nodeId}`;
  await client.setex(key, NODE_STATUS_TTL, JSON.stringify(data));
}

export async function getProviderCache(nodeId: string): Promise<CachedProviderData | null> {
  const client = getRedisClient();
  const key = `node:${nodeId}`;
  const data = await client.get(key);

  if (!data) return null;

  return JSON.parse(data);
}

export async function getAllOnlineProviders(): Promise<CachedProviderData[]> {
  const client = getRedisClient();
  const keys = await client.keys('node:*');

  if (keys.length === 0) return [];

  const providers: CachedProviderData[] = [];

  for (const key of keys) {
    const data = await client.get(key);
    if (data) {
      const provider = JSON.parse(data);
      if (provider.status === 'online') {
        providers.push(provider);
      }
    }
  }

  return providers;
}

export async function clearProviderCache(nodeId: string): Promise<void> {
  const client = getRedisClient();
  const key = `node:${nodeId}`;
  await client.del(key);
}

export default getRedisClient;
