'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Link from 'next/link';

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

  /* ── Not authenticated ── */
  if (!accessToken) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <p className="text-[14px] text-[var(--lp-secondary)]">Please sign in&hellip;</p>
      </div>
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <div className="text-center lp-fade">
          <div className="w-14 h-14 bg-[var(--lp-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-[var(--lp-accent)] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--lp-secondary)]">Loading payment information&hellip;</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center p-4">
        <div className="ip-card-static p-8 max-w-md w-full lp-scale">
          <div className="text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-serif text-[1.4rem] mb-2">Something went wrong</h1>
            <p className="text-[14px] text-[var(--lp-secondary)] mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Payment complete -> Download page ── */
  if (paymentStatus?.payment?.isPaid) {
    return <DownloadPage jobId={params.jobId} paymentStatus={paymentStatus} accessToken={accessToken!} />;
  }

  /* ── Payment form ── */
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

  /* ── Initializing ── */
  return (
    <div className="app-shell min-h-screen flex items-center justify-center">
      <div className="text-center lp-fade">
        <div className="w-14 h-14 bg-[var(--lp-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-[var(--lp-accent)] animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <p className="text-[14px] text-[var(--lp-secondary)]">Initializing payment&hellip;</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Payment Form Component
   ───────────────────────────────────────────── */
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

  const statusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      succeeded: 'bg-emerald-50 text-emerald-700',
      failed: 'bg-red-50 text-red-700',
      running: 'bg-blue-50 text-blue-700',
      queued: 'bg-amber-50 text-amber-700',
      canceled: 'bg-gray-100 text-[var(--lp-dim)]',
    };
    return map[status] || 'bg-gray-100 text-[var(--lp-dim)]';
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="text-[13px] text-[var(--lp-accent)] flex items-center gap-2 mb-6 hover:underline lp-fade"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>

        <h1 className="font-serif text-[2rem] mb-2 lp-reveal">Complete Payment</h1>
        <p className="text-[var(--lp-secondary)] text-[15px] mb-8 lp-reveal lp-d1">
          Review your job details and complete your payment to download results.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left column: Job Details + Payment Summary ── */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="ip-card-static p-7 lp-reveal lp-d2">
              <h2 className="font-semibold text-[17px] mb-5">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-[12px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">Job Title</div>
                  <div className="text-[14px] font-medium">{paymentStatus.jobTitle}</div>
                </div>
                <div>
                  <div className="text-[12px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">Status</div>
                  <span className={`ip-badge ${statusBadgeClass(paymentStatus.jobStatus)}`}>
                    {paymentStatus.jobStatus}
                  </span>
                </div>
                {paymentStatus.finishedAt && (
                  <div>
                    <div className="text-[12px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">Completed</div>
                    <div className="text-[14px]">{new Date(paymentStatus.finishedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="ip-card-static p-7 lp-reveal lp-d3">
              <h2 className="font-semibold text-[17px] mb-5">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[var(--lp-secondary)]">Subtotal</span>
                  <span>${((paymentStatus.payment.subtotal || 0) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[var(--lp-secondary)]">Platform Fee</span>
                  <span>${((paymentStatus.payment.fees || 0) / 100).toFixed(2)}</span>
                </div>
                <div className="border-t border-[var(--lp-border)] pt-3 flex justify-between">
                  <span className="font-semibold text-[15px]">Total</span>
                  <span className="font-semibold text-[15px]">
                    ${((paymentStatus.payment.amount || 0) / 100).toFixed(2)} {paymentStatus.payment.currency.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: Payment Form ── */}
          <div className="ip-card-static p-7 lp-reveal lp-d4">
            <h2 className="font-semibold text-[17px] mb-2">Payment Details</h2>
            <p className="text-[13px] text-[var(--lp-secondary)] mb-6">
              Enter your payment details below to access your job results.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <PaymentElement />
              </div>

              {message && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={!stripe || processing}
                className="btn-primary w-full justify-center py-3"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing&hellip;
                  </span>
                ) : (
                  `Pay $${((paymentStatus.payment.amount || 0) / 100).toFixed(2)}`
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-[var(--lp-dim)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secured by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Download Page Component (shown after payment)
   ───────────────────────────────────────────── */
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

  /* ── Loading while checking review status ── */
  if (checkingReview) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <div className="text-center lp-fade">
          <div className="w-14 h-14 bg-[var(--lp-surface)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-[var(--lp-accent)] animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--lp-secondary)]">Loading&hellip;</p>
        </div>
      </div>
    );
  }

  /* ── Downloads page ── */
  return (
    <div className="app-shell min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Back link */}
        <Link
          href="/consumers"
          className="text-[13px] text-[var(--lp-accent)] flex items-center gap-2 mb-6 hover:underline lp-fade"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Dashboard
        </Link>

        {/* Success Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 lp-reveal lp-d1">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-[1.5rem] text-emerald-900 mb-1">Payment Successful</h1>
              <p className="text-[14px] text-emerald-700">
                Your payment has been processed. You can now download your job results below.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="ip-card-static p-7 lp-reveal lp-d2">
            <h3 className="font-semibold text-[17px] mb-5">Job Details</h3>
            <div className="space-y-4">
              <div>
                <div className="text-[12px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">Job Title</div>
                <div className="text-[14px] font-medium">{paymentStatus.jobTitle}</div>
              </div>
              <div>
                <div className="text-[12px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">Status</div>
                <span className="ip-badge bg-emerald-50 text-emerald-700">
                  {paymentStatus.jobStatus}
                </span>
              </div>
              {paymentStatus.finishedAt && (
                <div>
                  <div className="text-[12px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">Completed</div>
                  <div className="text-[14px]">{new Date(paymentStatus.finishedAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Receipt */}
          <div className="ip-card-static p-7 lp-reveal lp-d3">
            <h3 className="font-semibold text-[17px] mb-5">Payment Receipt</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-[14px]">
                <span className="text-[var(--lp-secondary)]">Subtotal</span>
                <span>${((paymentStatus.payment.subtotal || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[var(--lp-secondary)]">Platform Fee</span>
                <span>${((paymentStatus.payment.fees || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="border-t border-[var(--lp-border)] pt-3 flex justify-between">
                <span className="font-semibold text-[15px]">Total Paid</span>
                <span className="font-semibold text-[15px]">
                  ${((paymentStatus.payment.amount || 0) / 100).toFixed(2)} {paymentStatus.payment.currency.toUpperCase()}
                </span>
              </div>
              {paymentStatus.payment.capturedAt && (
                <div className="text-[12px] text-[var(--lp-dim)] pt-2">
                  Paid on {new Date(paymentStatus.payment.capturedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Download Section */}
          <div className="lg:col-span-2 ip-card-static p-7 lp-reveal lp-d4">
            <h3 className="font-semibold text-[17px] mb-5">Download Files</h3>

            {loading ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-[var(--lp-surface)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-5 h-5 text-[var(--lp-accent)] animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
                <p className="text-[13px] text-[var(--lp-secondary)]">Loading download links&hellip;</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            ) : downloads ? (
              <div className="divide-y divide-[var(--lp-border)]">
                {downloads.files && downloads.files.map((file: any, index: number) => (
                  <div
                    key={index}
                    className="ip-row flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--lp-surface)] rounded-xl flex items-center justify-center text-[var(--lp-dim)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-[14px]">{file.name}</div>
                        <div className="text-[12px] text-[var(--lp-dim)]">{file.size} &middot; {file.type}</div>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download
                      className="btn-primary btn-sm"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center mx-auto mb-4 text-[var(--lp-dim)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-[14px] text-[var(--lp-secondary)]">No files available</p>
              </div>
            )}
          </div>
        </div>

        {/* Review prompt (inline) */}
        {!hasReview && paymentStatus?.orderId && paymentStatus?.providerId && !showReviewModal && (
          <div className="mt-6 lp-reveal lp-d5">
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Rate Your Experience
            </button>
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div className="ip-modal-overlay">
          <div className="ip-modal p-8 max-w-md w-full mx-4">
            {/* Icon + Title */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[var(--lp-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h2 className="font-serif text-[1.5rem] text-center mb-2">Rate Your Experience</h2>
              <p className="text-[13px] text-[var(--lp-secondary)]">How was your experience with the provider?</p>
            </div>

            {/* Star Rating */}
            <div className="mb-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform duration-200 hover:scale-110"
                  >
                    <svg
                      className="w-10 h-10"
                      viewBox="0 0 24 24"
                      fill={star <= rating ? '#f59e0b' : 'none'}
                      stroke={star <= rating ? '#f59e0b' : 'var(--lp-border)'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center mt-3 text-[13px] text-[var(--lp-secondary)]">
                  You rated: {rating} star{rating > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-[13px] font-medium text-[var(--lp-secondary)] mb-2">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full border border-[var(--lp-border)] rounded-xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--lp-accent)] focus:border-transparent outline-none transition-shadow resize-none"
                rows={4}
              />
            </div>

            {/* Error */}
            {reviewError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {reviewError}
              </div>
            )}

            {/* Actions */}
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview || rating === 0}
              className="btn-primary w-full justify-center py-3"
            >
              {submittingReview ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting&hellip;
                </span>
              ) : rating === 0 ? (
                'Please Select a Rating'
              ) : (
                'Submit Review'
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="w-full text-center text-[13px] text-[var(--lp-dim)] hover:text-[var(--lp-secondary)] mt-3 py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
