import { NextRequest, NextResponse } from 'next/server';
import { NodeModel } from '@/lib/models/Node';

// This endpoint should be called periodically (every 1-5 minutes) by a cron job
// to mark nodes as offline if they haven't sent a heartbeat recently
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authorization check here to prevent unauthorized access
    // For example, check for a secret token in the Authorization header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid cron secret.' },
        { status: 401 }
      );
    }

    // Mark nodes as offline if they haven't sent a heartbeat in the last 10 seconds
    // Using a very short interval for testing responsiveness
    const staleSeconds = 10;
    const updatedCount = await NodeModel.markStaleNodesOffline(staleSeconds);

    return NextResponse.json({
      success: true,
      message: `Marked ${updatedCount} stale node(s) as offline`,
      updated_count: updatedCount,
      stale_seconds: staleSeconds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('GET /api/cron/update-node-status error:', error);
    return NextResponse.json(
      { error: 'Failed to update node status', details: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
