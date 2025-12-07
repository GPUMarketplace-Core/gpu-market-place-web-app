import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import postgres from '@/lib/db/postgres';

/**
 * POST /api/reviews
 * Submit a review for a completed job
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await verifyGoogleToken(token);
    if (!userInfo?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, rating, comment } = body;

    if (!orderId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Get user
    const userRes = await postgres.query(
      'SELECT id, role FROM users WHERE email = $1',
      [userInfo.email]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // Get order details to verify ownership and get provider
    const orderRes = await postgres.query(
      `SELECT o.id, o.consumer_id, o.provider_id, o.status
       FROM orders o
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    // Verify user is the consumer
    if (order.consumer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized - not your order' }, { status: 403 });
    }

    // Verify order is completed
    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Order must be completed to review' }, { status: 400 });
    }

    if (!order.provider_id) {
      return NextResponse.json({ error: 'No provider associated with this order' }, { status: 400 });
    }

    // Check if review already exists
    const existingReview = await postgres.query(
      'SELECT id FROM reviews WHERE order_id = $1 AND rater_id = $2',
      [orderId, user.id]
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json({ error: 'Review already submitted for this order' }, { status: 400 });
    }

    // Insert review
    const reviewRes = await postgres.query(
      `INSERT INTO reviews (order_id, rater_id, ratee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [orderId, user.id, order.provider_id, rating, comment || null]
    );

    const review = reviewRes.rows[0];

    // Update provider's rating average
    await postgres.query(
      `UPDATE providers
       SET rating_avg = (
         SELECT ROUND(AVG(rating)::numeric, 2)
         FROM reviews
         WHERE ratee_id = $1
       ),
       rating_count = (
         SELECT COUNT(*)
         FROM reviews
         WHERE ratee_id = $1
       )
       WHERE user_id = $1`,
      [order.provider_id]
    );

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        createdAt: review.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?orderId=xxx
 * Check if user has already submitted a review for an order
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userInfo = await verifyGoogleToken(token);
    if (!userInfo?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Get user
    const userRes = await postgres.query(
      'SELECT id FROM users WHERE email = $1',
      [userInfo.email]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRes.rows[0];

    // Check if review exists
    const reviewRes = await postgres.query(
      'SELECT id, rating, comment, created_at FROM reviews WHERE order_id = $1 AND rater_id = $2',
      [orderId, user.id]
    );

    if (reviewRes.rows.length > 0) {
      return NextResponse.json({
        hasReview: true,
        review: reviewRes.rows[0],
      });
    }

    return NextResponse.json({ hasReview: false });
  } catch (error: any) {
    console.error('Error checking review:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
