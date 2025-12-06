/**
 * Stripe Configuration
 * Server-side Stripe SDK initialization
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with your secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Stripe Connect configuration
export const STRIPE_CONNECT_CONFIG = {
  refreshUrl: process.env.STRIPE_CONNECT_REFRESH_URL || 'http://localhost:3000/providers/settings/payout/refresh',
  returnUrl: process.env.STRIPE_CONNECT_RETURN_URL || 'http://localhost:3000/providers/settings/payout/complete',
};