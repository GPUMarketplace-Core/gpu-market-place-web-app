/**
 * GET /api/jobs/[jobId]/download
 * Get download links for job artifacts (only if payment is complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import pool from '@/lib/db/postgres';
import path from 'path';
import { stat } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    // 1. Verify OAuth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await verifyGoogleToken(token);

    if (!userInfo?.email) {
      return NextResponse.json({ error: 'Invalid or expired OAuth token' }, { status: 401 });
    }

    const user = await UserModel.findByEmail(userInfo.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Get job and payment details
    const result = await pool.query(
      `SELECT
         j.id as job_id,
         j.consumer_id,
         j.status as job_status,
         j.title,
         j.artifacts_ref,
         p.status as payment_status
       FROM jobs j
       LEFT JOIN orders o ON j.order_id = o.id
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = result.rows[0];

    // 3. Verify user is the consumer of this job
    if (job.consumer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You are not the consumer of this job' }, { status: 403 });
    }

    // 4. Check if job is completed
    if (job.job_status !== 'succeeded') {
      return NextResponse.json({ error: 'Job is not completed yet' }, { status: 400 });
    }

    // 5. Check if payment has been made
    if (job.payment_status !== 'captured') {
      return NextResponse.json({
        error: 'Payment required to download files',
        requiresPayment: true,
      }, { status: 402 }); // 402 Payment Required
    }

    // 6. Check if artifacts exist
    if (!job.artifacts_ref) {
      return NextResponse.json({ error: 'No artifacts available for this job' }, { status: 404 });
    }

    // 7. Generate download links from artifacts_ref
    // artifacts_ref is stored like: /uploads/outputs/timestamp_filename.zip
    const artifactsPath = job.artifacts_ref;
    const fullPath = path.join(process.cwd(), 'public', artifactsPath);
    
    // Get file info
    let fileSize = 'Unknown';
    if (existsSync(fullPath)) {
      try {
        const stats = await stat(fullPath);
        const sizeInMB = stats.size / (1024 * 1024);
        fileSize = sizeInMB >= 1 
          ? `${sizeInMB.toFixed(2)} MB` 
          : `${(stats.size / 1024).toFixed(2)} KB`;
      } catch (e) {
        console.error('Error getting file stats:', e);
      }
    }
    
    // Get original filename (remove timestamp prefix)
    const originalFilename = path.basename(artifactsPath).replace(/^\d+_/, '');
    
    // Determine content type based on file extension
    const ext = path.extname(artifactsPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.zip': 'application/zip',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.blend': 'application/octet-stream',
      '.log': 'text/plain',
      '.txt': 'text/plain',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    const downloadLinks = {
      success: true,
      jobId: job.job_id,
      jobTitle: job.title,
      artifactsRef: job.artifacts_ref,
      files: [
        {
          name: originalFilename,
          size: fileSize,
          type: contentType,
          // Direct link to the file in public folder (auth is verified before this response)
          url: artifactsPath,
        },
      ],
    };

    return NextResponse.json(downloadLinks);
  } catch (error: any) {
    console.error('Download authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to authorize download', details: error.message },
      { status: 500 }
    );
  }
}
