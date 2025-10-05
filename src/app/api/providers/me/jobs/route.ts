import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { JobModel } from '@/lib/models/Job';

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

export async function GET(request: NextRequest) {
  try {
    const auth = await getUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;
    if (user.role !== 'provider') return NextResponse.json({ error: 'Only providers can view their jobs' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    const jobs = await JobModel.listByProvider(user.id, limit, offset);
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    console.error('GET /providers/me/jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs', details: error.message }, { status: 500 });
  }
}


