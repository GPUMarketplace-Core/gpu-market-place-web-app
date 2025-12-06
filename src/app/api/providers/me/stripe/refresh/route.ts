/**
 * GET /api/providers/me/stripe/refresh
 * Refresh onboarding link if incomplete
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { createAccountLink } from '@/lib/stripe/connect';

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
      return NextResponse.json({ error: 'Only providers can refresh onboarding' }, { status: 403 });
    }

    // 2. Get provider profile
    const provider = await ProviderModel.getByUserId(user.id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    // 3. Check if account ID exists
    if (!provider.payout_account_id) {
      return NextResponse.json({ error: 'No payout account to refresh' }, { status: 404 });
    }

    // 4. Create new onboarding link
    try {
      const onboardingUrl = await createAccountLink(provider.payout_account_id);

      return NextResponse.json({
        success: true,
        onboardingUrl,
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
    console.error('Stripe refresh link error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh onboarding link', details: error.message },
      { status: 500 }
    );
  }
}
