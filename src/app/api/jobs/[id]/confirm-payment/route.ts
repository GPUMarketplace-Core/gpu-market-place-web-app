/**
 * POST /api/jobs/[id]/confirm-payment
 * Verify payment with Stripe and update database
 * Called after Stripe redirect to confirm payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { getPaymentIntent } from '@/lib/stripe/payments';
import pool from '@/lib/db/postgres';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

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

    // 2. Get job details to verify ownership
    const jobResult = await pool.query(
      `SELECT consumer_id, order_id FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobResult.rows[0];

    if (job.consumer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 3. Retrieve payment intent from Stripe to verify status
    const paymentIntent = await getPaymentIntent(paymentIntentId);

    console.log(`Payment intent ${paymentIntentId} status: ${paymentIntent.status}`);

    // 4. Update database based on payment intent status
    if (paymentIntent.status === 'succeeded') {
      // Update payment status to captured
      const result = await pool.query(
        `UPDATE payments
         SET status = $1, captured_at = NOW()
         WHERE gateway_payment_intent_id = $2
         RETURNING id, order_id`,
        ['captured', paymentIntentId]
      );

      if (result.rows.length > 0) {
        const payment = result.rows[0];

        // Update order status to completed
        await pool.query(
          `UPDATE orders
           SET status = $1
           WHERE id = $2`,
          ['completed', payment.order_id]
        );

        console.log(`Payment ${payment.id} confirmed and marked as captured`);

        return NextResponse.json({
          success: true,
          status: 'captured',
          message: 'Payment confirmed successfully',
        });
      } else {
        return NextResponse.json(
          { error: 'Payment record not found in database' },
          { status: 404 }
        );
      }
    } else if (paymentIntent.status === 'processing') {
      return NextResponse.json({
        success: true,
        status: 'processing',
        message: 'Payment is being processed',
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      return NextResponse.json({
        success: false,
        status: 'failed',
        message: 'Payment failed - requires new payment method',
      });
    } else {
      return NextResponse.json({
        success: false,
        status: paymentIntent.status,
        message: `Payment status: ${paymentIntent.status}`,
      });
    }
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment', details: error.message },
      { status: 500 }
    );
  }
}
