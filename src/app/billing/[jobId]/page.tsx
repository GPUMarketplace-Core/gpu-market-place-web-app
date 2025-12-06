'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BillingPage() {
  const params = useParams<{ jobId: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const creatingPaymentIntent = useRef(false);

  useEffect(() => {
    async function confirmPaymentIfReturningFromStripe() {
      // Check if returning from Stripe payment
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentId = urlParams.get('payment_intent');
      const redirectStatus = urlParams.get('redirect_status');

      if (paymentIntentId && redirectStatus === 'succeeded') {
        console.log('Returning from Stripe, confirming payment:', paymentIntentId);

        try {
          const res = await fetch(`/api/jobs/${params.jobId}/confirm-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ paymentIntentId }),
          });

          const data = await res.json();
          console.log('Payment confirmation result:', data);

          // Clean up URL parameters
          window.history.replaceState({}, '', `/billing/${params.jobId}`);
        } catch (err) {
          console.error('Failed to confirm payment:', err);
        }
      }
    }

    async function checkPaymentStatus() {
      if (!accessToken) return;

      try {
        setLoading(true);

        // First, confirm payment if returning from Stripe
        await confirmPaymentIfReturningFromStripe();

        // Then check payment status
        const res = await fetch(`/api/jobs/${params.jobId}/payment-status`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setPaymentStatus(data);

          // If not paid, create payment intent
          if (!data.payment.isPaid && !clientSecret) {
            await createPaymentIntent();
          }
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to fetch payment status');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function createPaymentIntent() {
      // Prevent duplicate calls
      if (creatingPaymentIntent.current) {
        console.log('Payment intent creation already in progress, skipping...');
        return;
      }

      try {
        creatingPaymentIntent.current = true;
        console.log('Creating payment intent...');

        const res = await fetch(`/api/jobs/${params.jobId}/create-payment-intent`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setClientSecret(data.clientSecret);
          console.log('Payment intent created successfully');
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to create payment intent');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        creatingPaymentIntent.current = false;
      }
    }

    checkPaymentStatus();
  }, [accessToken, params.jobId, clientSecret]);

  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Please sign in...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="text-gray-900 font-medium">Loading payment information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If payment is complete, show download page
  if (paymentStatus?.payment?.isPaid) {
    return <DownloadPage jobId={params.jobId} paymentStatus={paymentStatus} accessToken={accessToken!} />;
  }

  // If payment not complete, show payment form
  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm
          jobId={params.jobId}
          paymentStatus={paymentStatus}
          accessToken={accessToken!}
        />
      </Elements>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Initializing payment...</div>
    </div>
  );
}

// Payment Form Component
function PaymentForm({ jobId, paymentStatus, accessToken }: { jobId: string; paymentStatus: any; accessToken: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing/${jobId}?payment_success=true`,
        },
      });

      if (error) {
        setMessage(error.message || 'Payment failed');
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <button
          onClick={() => router.back()}
          className="text-sm mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Job & Payment Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Job Title</div>
                  <div className="font-medium text-gray-900">{paymentStatus.jobTitle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    paymentStatus.jobStatus === 'succeeded' ? 'bg-green-100 text-green-800' :
                    paymentStatus.jobStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {paymentStatus.jobStatus}
                  </span>
                </div>
                {paymentStatus.finishedAt && (
                  <div>
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="text-sm text-gray-900">{new Date(paymentStatus.finishedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    ${((paymentStatus.payment.subtotal || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="text-gray-900">
                    ${((paymentStatus.payment.fees || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">
                    ${((paymentStatus.payment.amount || 0) / 100).toFixed(2)} {paymentStatus.payment.currency.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Complete Payment</h2>
            <p className="text-sm text-gray-600 mb-6">
              Enter your payment details below to access your job results.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <PaymentElement />
              </div>

              {message && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Processing...' : `Pay $${((paymentStatus.payment.amount || 0) / 100).toFixed(2)}`}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Download Page Component (shown after payment)
function DownloadPage({ jobId, paymentStatus, accessToken }: { jobId: string; paymentStatus: any; accessToken: string }) {
  const router = useRouter();
  const [downloads, setDownloads] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDownloadLinks() {
      try {
        const res = await fetch(`/api/jobs/${jobId}/download`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setDownloads(data);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to fetch download links');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDownloadLinks();
  }, [jobId, accessToken]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <button
          onClick={() => router.back()}
          className="text-sm mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-green-900 mb-1">Payment Successful!</h2>
              <p className="text-sm text-green-700">
                Your payment has been processed. You can now download your job results below.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Job Title</div>
                <div className="font-medium text-gray-900">{paymentStatus.jobTitle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {paymentStatus.jobStatus}
                </span>
              </div>
              {paymentStatus.finishedAt && (
                <div>
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-sm text-gray-900">{new Date(paymentStatus.finishedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Receipt */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Receipt</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  ${((paymentStatus.payment.subtotal || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fee</span>
                <span className="text-gray-900">
                  ${((paymentStatus.payment.fees || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total Paid</span>
                <span className="font-semibold text-gray-900">
                  ${((paymentStatus.payment.amount || 0) / 100).toFixed(2)} {paymentStatus.payment.currency.toUpperCase()}
                </span>
              </div>
              {paymentStatus.payment.capturedAt && (
                <div className="text-xs text-gray-500 pt-2">
                  Paid on {new Date(paymentStatus.payment.capturedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Download Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Files</h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading download links...</div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            ) : downloads ? (
              <div className="space-y-4">
                {downloads.message && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    {downloads.message}
                  </div>
                )}
                <div className="space-y-3">
                  {downloads.files && downloads.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.size} • {file.type}</div>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No files available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
