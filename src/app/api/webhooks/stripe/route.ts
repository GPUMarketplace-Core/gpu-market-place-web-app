/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe/payments';
import pool from '@/lib/db/postgres';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const event = constructWebhookEvent(body, signature, webhookSecret);

    console.log('Stripe webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);

  // Update payment status to captured
  const result = await pool.query(
    `UPDATE payments
     SET status = $1, captured_at = NOW()
     WHERE gateway_payment_intent_id = $2
     RETURNING id, order_id`,
    ['captured', paymentIntent.id]
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

    console.log(`Payment ${payment.id} marked as captured, order ${payment.order_id} completed`);
  } else {
    console.warn(`No payment record found for payment intent ${paymentIntent.id}`);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);

  await pool.query(
    `UPDATE payments
     SET status = $1
     WHERE gateway_payment_intent_id = $2`,
    ['failed', paymentIntent.id]
  );
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: any) {
  console.log('Payment canceled:', paymentIntent.id);

  await pool.query(
    `UPDATE payments
     SET status = $1
     WHERE gateway_payment_intent_id = $2`,
    ['failed', paymentIntent.id]
  );
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: any) {
  console.log('Charge refunded:', charge.id);

  // Find payment by payment intent ID
  await pool.query(
    `UPDATE payments
     SET status = $1
     WHERE gateway_payment_intent_id = $2`,
    ['refunded', charge.payment_intent]
  );
}
