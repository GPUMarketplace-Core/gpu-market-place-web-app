/**
 * GET /api/providers/me/stripe/details
 * Get masked payout account details
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { getPayoutDetails } from '@/lib/stripe/connect';

export async function GET(req: NextRequest) {
  try {
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

    if (user.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can view payout details' }, { status: 403 });
    }

    // 2. Get provider profile
    const provider = await ProviderModel.getByUserId(user.id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    // 3. Check if account ID exists
    if (!provider.payout_account_id) {
      return NextResponse.json({ error: 'No payout account configured' }, { status: 404 });
    }

    // 4. Get payout details from Stripe
    try {
      const details = await getPayoutDetails(provider.payout_account_id);

      return NextResponse.json({
        success: true,
        details,
      });
    } catch (error: any) {
      // Account doesn't exist in Stripe
      if (error.code === 'resource_missing') {
        return NextResponse.json(
          { error: 'Payout account not found in Stripe' },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Stripe details fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout details', details: error.message },
      { status: 500 }
    );
  }
}
