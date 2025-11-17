import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/db/redis';

// GET endpoint to view all cached provider data
export async function GET(request: NextRequest) {
  try {
    const client = getRedisClient();

    // Get all node keys from Redis
    const keys = await client.keys('node:*');

    if (keys.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Cache is empty',
        count: 0,
        providers: [],
      });
    }

    // Fetch all cached provider data
    const cachedData = [];
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          // Get TTL for this key
          const ttl = await client.ttl(key);
          cachedData.push({
            key,
            ttl_seconds: ttl,
            ...parsedData,
          });
        } catch (e) {
          console.error('Failed to parse cached data:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: cachedData.length,
      providers: cachedData,
    });
  } catch (error: any) {
    console.error('GET /cache/providers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cached providers', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear the cache
export async function DELETE(request: NextRequest) {
  try {
    const client = getRedisClient();

    // Get all node keys
    const keys = await client.keys('node:*');

    if (keys.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Cache was already empty',
        deleted: 0,
      });
    }

    // Delete all keys
    await client.del(...keys);

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      deleted: keys.length,
    });
  } catch (error: any) {
    console.error('DELETE /cache/providers error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    );
  }
}
