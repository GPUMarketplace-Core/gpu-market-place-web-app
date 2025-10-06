import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import pool from '@/lib/db/postgres';

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header. Expected: Bearer <oauth_token>' };
  }
  const token = authHeader.substring(7);
  const info = await verifyGoogleToken(token);
  if (!info?.email) return { error: 'Invalid or expired OAuth token' };
  const user = await UserModel.findByEmail(info.email);
  if (!user) return { error: 'User not found. Please signup first.' };
  return { user };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;
    if (user.role !== 'provider') return NextResponse.json({ error: 'Only providers can view job billing' }, { status: 403 });

    const { id: jobId } = await context.params;
    const result = await pool.query(
      `SELECT id, title, status, consumer_id, provider_id, node_id, order_id,
              submitted_at, started_at, finished_at
         FROM jobs WHERE id = $1 AND provider_id = $2`,
      [jobId, user.id]
    );
    const job = result.rows[0];
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('GET /providers/me/jobs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch job', details: error.message }, { status: 500 });
  }
}


