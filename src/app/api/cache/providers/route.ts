import { NextRequest, NextResponse } from 'next/server';
// import { getRedisClient } from '@/lib/db/redis';

// GET endpoint to view all cached provider data
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Caching is disabled',
    count: 0,
    providers: [],
  });
}

// DELETE endpoint to clear the cache
export async function DELETE(request: NextRequest) {
    return NextResponse.json({
      success: true,
      message: 'Caching is disabled',
      deleted: 0,
    });
}
