/**
 * POST /api/admin/mark-payment-captured
 * Manually mark a payment as captured (for testing without webhooks)
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/postgres';

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

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

      return NextResponse.json({
        success: true,
        message: `Payment ${payment.id} marked as captured, order ${payment.order_id} completed`,
      });
    } else {
      return NextResponse.json(
        { error: `No payment found with payment intent ID: ${paymentIntentId}` },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Mark payment captured error:', error);
    return NextResponse.json(
      { error: 'Failed to mark payment as captured', details: error.message },
      { status: 500 }
    );
  }
}
