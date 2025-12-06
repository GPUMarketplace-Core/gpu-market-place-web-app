/**
 * Stripe Payment Helper Functions
 * Functions for handling payment intents, transfers, and charges
 */

import { stripe } from './config';

/**
 * Create a Payment Intent with destination charge (money goes to provider)
 * @param amount - Amount in cents
 * @param currency - Currency code (default: usd)
 * @param providerId - Provider's Stripe Connect account ID
 * @param metadata - Additional metadata (jobId, orderId, etc.)
 * @param applicationFeeAmount - Platform fee in cents (optional)
 * @returns Payment Intent object
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  providerStripeAccountId: string,
  metadata: Record<string, string>,
  applicationFeeAmount?: number
) {
  const paymentIntentParams: any = {
    amount,
    currency: currency.toLowerCase(),
    transfer_data: {
      destination: providerStripeAccountId,
    },
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  };

  // Add platform fee if specified
  if (applicationFeeAmount && applicationFeeAmount > 0) {
    paymentIntentParams.application_fee_amount = applicationFeeAmount;
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

  return paymentIntent;
}

/**
 * Retrieve a Payment Intent by ID
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Payment Intent object
 */
export async function getPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

/**
 * Confirm a Payment Intent
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Payment Intent object
 */
export async function confirmPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
  return paymentIntent;
}

/**
 * Cancel a Payment Intent
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Payment Intent object
 */
export async function cancelPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
}

/**
 * Construct webhook event from raw body and signature
 * @param rawBody - Raw request body
 * @param signature - Stripe signature header
 * @param webhookSecret - Webhook secret from Stripe
 * @returns Stripe Event object
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  return event;
}
