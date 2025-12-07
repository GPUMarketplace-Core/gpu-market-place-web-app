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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400">Please sign in...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="text-gray-900 dark:text-gray-100 font-medium">Loading payment information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">Initializing payment...</div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <button
          onClick={() => router.back()}
          className="text-sm mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Job & Payment Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Job Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Job Title</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{paymentStatus.jobTitle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    paymentStatus.jobStatus === 'succeeded' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                    paymentStatus.jobStatus === 'failed' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {paymentStatus.jobStatus}
                  </span>
                </div>
                {paymentStatus.finishedAt && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(paymentStatus.finishedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ${((paymentStatus.payment.subtotal || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Platform Fee</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ${((paymentStatus.payment.fees || 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="border-t dark:border-gray-600 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ${((paymentStatus.payment.amount || 0) / 100).toFixed(2)} {paymentStatus.payment.currency.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Complete Payment</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Enter your payment details below to access your job results.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <PaymentElement />
              </div>

              {message && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? 'Processing...' : `Pay $${((paymentStatus.payment.amount || 0) / 100).toFixed(2)}`}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
  const [checkingReview, setCheckingReview] = useState(true);
  const [hasReview, setHasReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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

    async function checkReviewStatus() {
      if (!paymentStatus?.orderId) {
        setCheckingReview(false);
        return;
      }

      try {
        const res = await fetch(`/api/reviews?orderId=${paymentStatus.orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          setHasReview(data.hasReview);

          // Show review modal if payment is successful and no review exists
          if (!data.hasReview && paymentStatus?.orderId && paymentStatus?.providerId) {
            setShowReviewModal(true);
          }
        }
      } catch (err) {
        console.error('Failed to check review status:', err);
      } finally {
        setCheckingReview(false);
      }
    }

    fetchDownloadLinks();
    checkReviewStatus();
  }, [jobId, accessToken, paymentStatus]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setReviewError('Please select a rating');
      return;
    }

    if (!paymentStatus?.orderId) {
      setReviewError('Order ID not found');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: paymentStatus.orderId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (res.ok) {
        setHasReview(true);
        setShowReviewModal(false);
        // Reset form
        setRating(0);
        setComment('');
      } else {
        const data = await res.json();
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Show loading while checking review status
  if (checkingReview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="text-gray-900 dark:text-gray-100 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Show downloads page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <button
          onClick={() => router.push('/consumers')}
          className="text-sm mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">Payment Successful!</h2>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your payment has been processed. You can now download your job results below.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Job Title</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{paymentStatus.jobTitle}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                  {paymentStatus.jobStatus}
                </span>
              </div>
              {paymentStatus.finishedAt && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(paymentStatus.finishedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Receipt */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Receipt</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${((paymentStatus.payment.subtotal || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Platform Fee</span>
                <span className="text-gray-900 dark:text-gray-100">
                  ${((paymentStatus.payment.fees || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="border-t dark:border-gray-600 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-gray-100">Total Paid</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${((paymentStatus.payment.amount || 0) / 100).toFixed(2)} {paymentStatus.payment.currency.toUpperCase()}
                </span>
              </div>
              {paymentStatus.payment.capturedAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                  Paid on {new Date(paymentStatus.payment.capturedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Download Section */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Download Files</h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading download links...</div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : downloads ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {downloads.files && downloads.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{file.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{file.size} • {file.type}</div>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No files available</div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in border border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Rate Your Experience</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">How was your experience with the provider?</p>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-all duration-200 transform hover:scale-110"
                    >
                      <svg
                        className={`w-12 h-12 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-3 text-sm text-gray-600 dark:text-gray-400">
                    You rated: {rating} star{rating > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
                  rows={4}
                />
              </div>

              {/* Error */}
              {reviewError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {reviewError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview || rating === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {submittingReview ? 'Submitting...' : rating === 0 ? 'Please Select a Rating' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
