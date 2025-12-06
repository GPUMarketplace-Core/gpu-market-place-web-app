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

// GET /api/jobs - List jobs for the authenticated consumer
export async function GET(request: NextRequest) {
  try {
    const auth = await getUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;
    
    if (user.role !== 'consumer') {
      return NextResponse.json({ error: 'Only consumers can view their jobs here' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    const jobs = await JobModel.listByConsumer(user.id, limit, offset);
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const auth = await getUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { user } = auth;

    if (user.role !== 'consumer') {
      return NextResponse.json({ error: 'Only consumers can submit jobs' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const providerId = formData.get('provider_id') as string;
    const nodeId = formData.get('node_id') as string;

    if (!file || !title || !providerId || !nodeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'inputs');
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
    const relativePath = `/uploads/inputs/${fileName}`;

    // Create job in DB
    const job = await JobModel.create({
      consumer_id: user.id,
      provider_id: providerId,
      node_id: nodeId,
      title: title,
      input_file_path: relativePath,
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/jobs error:', error);
    return NextResponse.json({ error: 'Failed to create job', details: error.message }, { status: 500 });
  }
}

