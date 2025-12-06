import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { JobModel } from '@/lib/models/Job';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
      return NextResponse.json({ error: 'Only providers can complete jobs' }, { status: 403 });
    }

    const job = await JobModel.getById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.provider_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'outputs');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${cleanFileName}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create relative path for storage/serving
    const relativePath = `/uploads/outputs/${fileName}`;

    // Update job status and artifacts
    await JobModel.complete(jobId, relativePath);

    return NextResponse.json({ success: true, message: 'Job completed' });
  } catch (error: any) {
    console.error('POST /api/jobs/[id]/complete error:', error);
    return NextResponse.json({ error: 'Failed to complete job', details: error.message }, { status: 500 });
  }
}

