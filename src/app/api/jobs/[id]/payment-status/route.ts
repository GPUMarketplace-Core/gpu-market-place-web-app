/**
 * GET /api/jobs/[jobId]/payment-status
 * Check if payment has been made for a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import pool from '@/lib/db/postgres';

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
         j.provider_id,
         j.order_id,
         j.status as job_status,
         j.title,
         j.finished_at,
         j.artifacts_ref,
         o.total_cents,
         o.currency,
         o.subtotal_cents,
         o.fees_cents,
         p.id as payment_id,
         p.status as payment_status,
         p.gateway_payment_intent_id,
         p.captured_at,
         p.created_at as payment_created_at
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

    // 4. Return payment status
    return NextResponse.json({
      success: true,
      jobId: job.job_id,
      jobTitle: job.title,
      jobStatus: job.job_status,
      finishedAt: job.finished_at,
      hasArtifacts: !!job.artifacts_ref,
      artifactsRef: job.artifacts_ref,
      payment: {
        exists: !!job.payment_id,
        status: job.payment_status || null,
        isPaid: job.payment_status === 'captured',
        amount: job.total_cents,
        currency: job.currency || 'usd',
        subtotal: job.subtotal_cents,
        fees: job.fees_cents,
        capturedAt: job.captured_at,
        createdAt: job.payment_created_at,
      },
    });
  } catch (error: any) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status', details: error.message },
      { status: 500 }
    );
  }
}
