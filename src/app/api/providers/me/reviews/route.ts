import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/postgres';
import { authenticateRequest } from '@/lib/auth/utils';

/**
 * GET /api/providers/me/reviews
 *
 * Returns reviews for the authenticated provider along with summary stats.
 *
 * Query params:
 * - limit  (default: 20, max: 100)
 * - offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { user } = auth;
    if (user.role !== 'provider') {
      return NextResponse.json(
        { error: 'Only providers can view their reviews' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    // 1) Fetch individual reviews for this provider
    const reviewsResult = await pool.query(
      `
        SELECT
          r.id,
          r.rating,
          r.comment,
          r.created_at,
          o.id AS order_id,
          u.display_name AS consumer_display_name,
          u.email AS consumer_email
        FROM reviews r
        JOIN orders o ON o.id = r.order_id
        JOIN users u ON u.id = r.rater_id
        WHERE r.ratee_id = $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [user.id, limit, offset]
    );

    // 2) Summary computed directly from reviews table
    const summaryResult = await pool.query(
      `
        SELECT
          COALESCE(AVG(r.rating), 0)::numeric(3,2) AS avg_rating,
          COUNT(*) AS review_count,
          MAX(r.created_at) AS last_review_at
        FROM reviews r
        WHERE r.ratee_id = $1
      `,
      [user.id]
    );

    const summaryRow = summaryResult.rows[0] || {
      avg_rating: 0,
      review_count: 0,
      last_review_at: null,
    };

    // 3) Provider aggregate stored in providers table
    const providerAggResult = await pool.query(
      `
        SELECT rating_avg, rating_count
        FROM providers
        WHERE user_id = $1
      `,
      [user.id]
    );

    const providerAgg = providerAggResult.rows[0] || {
      rating_avg: null,
      rating_count: 0,
    };

    return NextResponse.json({
      success: true,
      summary: {
        avgRating: Number(summaryRow.avg_rating || 0),
        reviewCount: Number(summaryRow.review_count || 0),
        lastReviewAt: summaryRow.last_review_at,
        providerRatingAvg: providerAgg.rating_avg,
        providerRatingCount: Number(providerAgg.rating_count || 0),
      },
      reviews: reviewsResult.rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        orderId: r.order_id,
        consumerDisplayName: r.consumer_display_name,
        consumerEmail: r.consumer_email,
      })),
      paging: {
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('GET /providers/me/reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}


