import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/postgres';
import { authenticateRequest } from '@/lib/auth/utils';

/**
 * GET /api/providers/me/earnings
 *
 * Returns earnings analytics for the authenticated provider.
 *
 * Query params:
 * - range: 'month' | 'all' (default: 'month')
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
        { error: 'Only providers can view earnings' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Base constraints: captured payments for this provider
    const params: any[] = [user.id];

    let dateFilterCurrent = '';
    let dateFilterPrevious = '';

    if (range === 'month') {
      // Current month
      dateFilterCurrent =
        "AND DATE_TRUNC('month', pay.captured_at) = DATE_TRUNC('month', NOW())";
      // Previous month for comparison
      dateFilterPrevious =
        "AND DATE_TRUNC('month', pay.captured_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')";
    }

    // 1) Aggregate current-period earnings (provider share = subtotal_cents)
    const currentAggQuery = `
      SELECT
        COALESCE(SUM(o.subtotal_cents), 0)       AS provider_earnings_cents,
        COALESCE(SUM(o.fees_cents), 0)           AS platform_fees_cents,
        COALESCE(SUM(o.total_cents), 0)          AS gross_revenue_cents,
        COUNT(DISTINCT o.id)                     AS paid_orders,
        COUNT(DISTINCT j.id)                     AS paid_jobs
      FROM payments pay
      JOIN orders o ON o.id = pay.order_id
      JOIN jobs j   ON j.order_id = o.id
      WHERE o.provider_id = $1
        AND pay.status = 'captured'
        ${dateFilterCurrent};
    `;

    const currentAggResult = await pool.query(currentAggQuery, params);
    const currentAgg = currentAggResult.rows[0];

    // 2) Previous month comparison (only when range=month)
    let previousAgg = null;
    if (range === 'month') {
      const previousAggQuery = `
        SELECT
          COALESCE(SUM(o.subtotal_cents), 0) AS provider_earnings_cents
        FROM payments pay
        JOIN orders o ON o.id = pay.order_id
        JOIN jobs j   ON j.order_id = o.id
        WHERE o.provider_id = $1
          AND pay.status = 'captured'
          ${dateFilterPrevious};
      `;
      const previousAggResult = await pool.query(previousAggQuery, params);
      previousAgg = previousAggResult.rows[0] || { provider_earnings_cents: 0 };
    }

    // 3) Daily breakdown for charts (current period)
    const dailyQuery = `
      SELECT
        DATE(pay.captured_at)                           AS day,
        SUM(o.subtotal_cents)                           AS provider_earnings_cents,
        SUM(o.fees_cents)                               AS platform_fees_cents,
        SUM(o.total_cents)                              AS gross_revenue_cents,
        COUNT(DISTINCT o.id)                            AS paid_orders,
        COUNT(DISTINCT j.id)                            AS paid_jobs
      FROM payments pay
      JOIN orders o ON o.id = pay.order_id
      JOIN jobs j   ON j.order_id = o.id
      WHERE o.provider_id = $1
        AND pay.status = 'captured'
        ${dateFilterCurrent}
      GROUP BY DATE(pay.captured_at)
      ORDER BY day ASC;
    `;

    const dailyResult = await pool.query(dailyQuery, params);

    // 4) Lifetime totals (all captured payments for this provider)
    const lifetimeQuery = `
      SELECT
        COALESCE(SUM(o.subtotal_cents), 0) AS provider_earnings_cents,
        COALESCE(SUM(o.fees_cents), 0)     AS platform_fees_cents,
        COALESCE(SUM(o.total_cents), 0)    AS gross_revenue_cents
      FROM payments pay
      JOIN orders o ON o.id = pay.order_id
      WHERE o.provider_id = $1
        AND pay.status = 'captured';
    `;

    const lifetimeResult = await pool.query(lifetimeQuery, params);
    const lifetime = lifetimeResult.rows[0];

    const currentProviderEarnings =
      Number(currentAgg?.provider_earnings_cents || 0);
    const previousProviderEarnings =
      Number(previousAgg?.provider_earnings_cents || 0);

    let monthOverMonthChangePct: number | null = null;
    if (range === 'month') {
      if (previousProviderEarnings === 0 && currentProviderEarnings > 0) {
        monthOverMonthChangePct = 100;
      } else if (previousProviderEarnings > 0) {
        monthOverMonthChangePct =
          ((currentProviderEarnings - previousProviderEarnings) /
            previousProviderEarnings) *
          100;
      }
    }

    return NextResponse.json({
      success: true,
      range,
      summary: {
        providerEarningsCents: currentProviderEarnings,
        platformFeesCents: Number(currentAgg?.platform_fees_cents || 0),
        grossRevenueCents: Number(currentAgg?.gross_revenue_cents || 0),
        paidOrders: Number(currentAgg?.paid_orders || 0),
        paidJobs: Number(currentAgg?.paid_jobs || 0),
        monthOverMonthChangePct,
      },
      daily: dailyResult.rows.map((row) => ({
        day: row.day,
        providerEarningsCents: Number(row.provider_earnings_cents || 0),
        platformFeesCents: Number(row.platform_fees_cents || 0),
        grossRevenueCents: Number(row.gross_revenue_cents || 0),
        paidOrders: Number(row.paid_orders || 0),
        paidJobs: Number(row.paid_jobs || 0),
      })),
      lifetime: {
        providerEarningsCents: Number(
          lifetime?.provider_earnings_cents || 0
        ),
        platformFeesCents: Number(lifetime?.platform_fees_cents || 0),
        grossRevenueCents: Number(lifetime?.gross_revenue_cents || 0),
      },
    });
  } catch (error: any) {
    console.error('GET /providers/me/earnings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings', details: error.message },
      { status: 500 }
    );
  }
}


