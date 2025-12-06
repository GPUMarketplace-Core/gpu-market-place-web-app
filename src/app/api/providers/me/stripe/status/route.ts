/**
 * GET /api/providers/me/stripe/status
 * Check if provider's Stripe account is fully onboarded
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { isAccountOnboarded, getConnectAccount } from '@/lib/stripe/connect';

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
      return NextResponse.json({ error: 'Only providers can check payout status' }, { status: 403 });
    }

    // 2. Get provider profile
    const provider = await ProviderModel.getByUserId(user.id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    // 3. Check if account ID exists
    if (!provider.payout_account_id) {
      return NextResponse.json({
        hasAccount: false,
        isOnboarded: false,
        needsOnboarding: true,
      });
    }

    // 4. Check account status in Stripe
    try {
      const account = await getConnectAccount(provider.payout_account_id);
      const onboarded = await isAccountOnboarded(provider.payout_account_id);

      return NextResponse.json({
        hasAccount: true,
        isOnboarded: onboarded,
        needsOnboarding: !onboarded,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      });
    } catch (error: any) {
      // Account doesn't exist in Stripe
      if (error.code === 'resource_missing') {
        return NextResponse.json({
          hasAccount: false,
          isOnboarded: false,
          needsOnboarding: true,
          error: 'Account not found in Stripe',
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Stripe status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check account status', details: error.message },
      { status: 500 }
    );
  }
}
