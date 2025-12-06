import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { JobModel } from '@/lib/models/Job';

async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }
  const token = authHeader.substring(7);
  const info = await verifyGoogleToken(token);
  if (!info?.email) return { error: 'Invalid or expired OAuth token' };
  const user = await UserModel.findByEmail(info.email);
  if (!user) return { error: 'User not found' };
  return { user };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const auth = await getUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can update job status' }, { status: 403 });
    }

    const job = await JobModel.getById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.provider_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
    }

    const body = await request.json();
    const { status, failure_reason } = body;

    if (!['running', 'failed', 'canceled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await JobModel.updateStatus(jobId, status, failure_reason);

    return NextResponse.json({ success: true, message: 'Job status updated' });
  } catch (error: any) {
    console.error('POST /api/jobs/[id]/status error:', error);
    return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 });
  }
}

