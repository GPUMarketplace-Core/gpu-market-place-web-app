// Redis is not used in production — all caching is disabled.
// This file is kept as a stub to prevent import errors if any file references it.

export interface CachedProviderData {
  nodeId: string;
  providerId: string;
  gpuSpecs: any;
  lastSeen: string;
  status: 'online' | 'offline' | 'draining';
}

export function getRedisClient(): null {
  return null;
}

export async function cacheProviderData(): Promise<void> {}
export async function getProviderCache(): Promise<null> { return null; }
export async function getAllOnlineProviders(): Promise<CachedProviderData[]> { return []; }
export async function clearProviderCache(): Promise<void> {}

export default getRedisClient;
