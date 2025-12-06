/**
 * Stripe Connect Helper Functions
 * Functions for managing provider payout accounts
 */

import { stripe, STRIPE_CONNECT_CONFIG } from './config';

/**
 * Create a Stripe Connect Express account for a provider
 * @param email - Provider's email
 * @param providerId - Provider's user ID (for metadata)
 * @returns Stripe Account object
 */
export async function createConnectAccount(email: string, providerId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      provider_id: providerId,
    },
    capabilities: {
      transfers: { requested: true },
    },
  });

  return account;
}

/**
 * Create an account link for onboarding
 * @param accountId - Stripe account ID
 * @returns Account link URL for onboarding
 */
export async function createAccountLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: STRIPE_CONNECT_CONFIG.refreshUrl,
    return_url: STRIPE_CONNECT_CONFIG.returnUrl,
    type: 'account_onboarding',
  });

  return accountLink.url;
}

/**
 * Retrieve a Stripe Connect account
 * @param accountId - Stripe account ID
 * @returns Stripe Account object
 */
export async function getConnectAccount(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return account;
}

/**
 * Create a login link for the provider's Stripe Express Dashboard
 * @param accountId - Stripe account ID
 * @returns Dashboard login URL
 */
export async function createDashboardLink(accountId: string) {
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

/**
 * Check if account is fully onboarded and can receive payouts
 * @param accountId - Stripe account ID
 * @returns boolean indicating if account is ready
 */
export async function isAccountOnboarded(accountId: string): Promise<boolean> {
  const account = await getConnectAccount(accountId);
  return account.charges_enabled && account.payouts_enabled;
}

/**
 * Get masked payout details for display
 * @param accountId - Stripe account ID
 * @returns Masked account details
 */
export async function getPayoutDetails(accountId: string) {
  const account = await getConnectAccount(accountId);

  // Get external account (bank account)
  const externalAccount = account.external_accounts?.data[0];

  return {
    accountId,
    email: account.email,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    externalAccount: externalAccount
      ? {
          last4: (externalAccount as any).last4,
          bankName: (externalAccount as any).bank_name,
          currency: (externalAccount as any).currency,
        }
      : null,
  };
}
