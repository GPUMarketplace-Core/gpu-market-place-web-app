/**
 * POST /api/jobs/[jobId]/create-payment-intent
 * Create Stripe Payment Intent for job payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { createPaymentIntent, getPaymentIntent } from '@/lib/stripe/payments';
import pool from '@/lib/db/postgres';

export async function POST(
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

    // 2. Get job details
    const jobResult = await pool.query(
      `SELECT j.id, j.consumer_id, j.provider_id, j.order_id, j.status, j.title,
              o.total_cents, o.currency, o.fees_cents, o.subtotal_cents, o.status as order_status
       FROM jobs j
       LEFT JOIN orders o ON j.order_id = o.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobResult.rows[0];

    // 3. Verify user is the consumer of this job
    if (job.consumer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: You are not the consumer of this job' }, { status: 403 });
    }

    // 4. Check if job is completed
    if (job.status !== 'succeeded') {
      return NextResponse.json({ error: 'Job must be completed before payment' }, { status: 400 });
    }

    // 5. Check if payment already exists for this order
    const existingPaymentResult = await pool.query(
      `SELECT id, status, gateway_payment_intent_id
       FROM payments
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [job.order_id]
    );

    if (existingPaymentResult.rows.length > 0) {
      const existingPayment = existingPaymentResult.rows[0];

      // If payment is already captured, return error
      if (existingPayment.status === 'captured') {
        return NextResponse.json({ error: 'Payment already completed for this job' }, { status: 400 });
      }

      // If pending, retrieve payment intent from Stripe to get client secret
      if (existingPayment.gateway_payment_intent_id) {
        try {
          const paymentIntent = await getPaymentIntent(existingPayment.gateway_payment_intent_id);

          // Return existing payment intent if it's in any usable state
          if (
            paymentIntent.status === 'requires_payment_method' ||
            paymentIntent.status === 'requires_confirmation' ||
            paymentIntent.status === 'requires_action' ||
            paymentIntent.status === 'processing'
          ) {
            console.log(`Reusing existing payment intent: ${paymentIntent.id}`);
            return NextResponse.json({
              success: true,
              clientSecret: paymentIntent.client_secret,
              amount: job.total_cents,
              currency: job.currency,
            });
          }

          // If payment succeeded but our DB shows pending, don't create new one
          if (paymentIntent.status === 'succeeded') {
            return NextResponse.json({
              error: 'Payment already completed for this job (verification pending)'
            }, { status: 400 });
          }
        } catch (error) {
          console.error('Failed to retrieve existing payment intent:', error);
          // Only create new payment intent if the old one truly doesn't exist on Stripe
          // If it's a different error, return error instead of creating duplicate
          if ((error as any)?.code !== 'resource_missing') {
            return NextResponse.json({
              error: 'Error checking existing payment status'
            }, { status: 500 });
          }
        }
      }
    }

    // 6. Get provider's Stripe account ID
    if (!job.provider_id) {
      return NextResponse.json({ error: 'No provider assigned to this job' }, { status: 400 });
    }

    const provider = await ProviderModel.getByUserId(job.provider_id);
    if (!provider || !provider.payout_account_id) {
      return NextResponse.json({
        error: 'Provider has not set up payout account. Please contact the provider.'
      }, { status: 400 });
    }

    // 7. Create Payment Intent
    const paymentIntent = await createPaymentIntent(
      job.total_cents,
      job.currency || 'usd',
      provider.payout_account_id,
      {
        jobId: job.id,
        orderId: job.order_id,
        consumerId: user.id,
        providerId: job.provider_id,
        jobTitle: job.title,
      },
      job.fees_cents || 0 // Platform fee
    );

    // 8. Save payment record to database
    await pool.query(
      `INSERT INTO payments (order_id, status, gateway, gateway_payment_intent_id, amount_cents, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (gateway_payment_intent_id) DO NOTHING`,
      [
        job.order_id,
        'pending',
        'stripe',
        paymentIntent.id,
        job.total_cents,
        job.currency || 'usd',
      ]
    );

    // 9. Return client secret
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: job.total_cents,
      currency: job.currency || 'usd',
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent', details: error.message },
      { status: 500 }
    );
  }
}
