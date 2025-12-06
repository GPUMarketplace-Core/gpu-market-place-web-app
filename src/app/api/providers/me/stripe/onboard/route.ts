/**
 * POST /api/providers/me/stripe/onboard
 * Create Stripe Connect account and return onboarding URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/auth/oauth';
import { UserModel } from '@/lib/models/User';
import { ProviderModel } from '@/lib/models/Provider';
import { createConnectAccount, createAccountLink, getConnectAccount } from '@/lib/stripe/connect';
import pool from '@/lib/db/postgres';

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'Only providers can set up payout accounts' }, { status: 403 });
    }

    // 2. Get provider profile
    const provider = await ProviderModel.getByUserId(user.id);
    if (!provider) {
      return NextResponse.json({ error: 'Provider profile not found' }, { status: 404 });
    }

    let accountId = provider.payout_account_id;
    let onboardingUrl: string;

    // 3. Check if account already exists
    if (accountId) {
      try {
        // Verify account still exists in Stripe
        await getConnectAccount(accountId);
        // Create new onboarding link for existing account
        onboardingUrl = await createAccountLink(accountId);
      } catch (error: any) {
        // Account doesn't exist in Stripe, create new one
        if (error.code === 'resource_missing') {
          const account = await createConnectAccount(user.email, user.id);
          accountId = account.id;
          onboardingUrl = await createAccountLink(accountId);

          // Update database with new account ID
          await pool.query(
            'UPDATE providers SET payout_account_id = $1 WHERE user_id = $2',
            [accountId, user.id]
          );
        } else {
          throw error;
        }
      }
    } else {
      // 4. Create new Stripe Connect account
      const account = await createConnectAccount(user.email, user.id);
      accountId = account.id;
      onboardingUrl = await createAccountLink(accountId);

      // 5. Save account ID to database
      await pool.query(
        'UPDATE providers SET payout_account_id = $1 WHERE user_id = $2',
        [accountId, user.id]
      );
    }

    return NextResponse.json({
      success: true,
      accountId,
      onboardingUrl,
    });
  } catch (error: any) {
    console.error('Stripe onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding session', details: error.message },
      { status: 500 }
    );
  }
}
