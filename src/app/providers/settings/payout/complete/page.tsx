'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function PayoutCompletePage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'incomplete' | 'error'>('checking');
  const [accountStatus, setAccountStatus] = useState<any>(null);

  useEffect(() => {
    if (!accessToken || !user) return;

    if (user.role !== 'provider') {
      router.push('/');
      return;
    }

    async function checkStatus() {
      try {
        const res = await fetch('/api/providers/me/stripe/status', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          throw new Error('Failed to check account status');
        }

        const data = await res.json();
        setAccountStatus(data);

        if (data.isOnboarded) {
          setStatus('success');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/providers?tab=settings');
          }, 3000);
        } else {
          setStatus('incomplete');
        }
      } catch (err: any) {
        setStatus('error');
      }
    }

    checkStatus();
  }, [accessToken, user, router]);

  if (!accessToken || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Please sign in...</div>
        </div>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifying Setup</h1>
            <p className="text-sm text-gray-600">Checking your payout account status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h1>
            <p className="text-sm text-gray-600 mb-6">
              Your payout account has been successfully configured. You can now receive payments from consumers.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">What's next?</div>
                <ul className="list-disc list-inside text-left space-y-1">
                  <li>Payouts are enabled for your account</li>
                  <li>Earnings will be transferred automatically</li>
                  <li>View details in your settings anytime</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">Redirecting to dashboard in 3 seconds...</p>
            <button
              onClick={() => router.push('/providers?tab=settings')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Setup Incomplete</h1>
            <p className="text-sm text-gray-600 mb-6">
              Your payout account setup is not yet complete. You may need to provide additional information.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/providers/settings/payout/setup')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Setup
              </button>
              <button
                onClick={() => router.push('/providers?tab=settings')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Error</h1>
          <p className="text-sm text-gray-600 mb-6">
            We couldn't verify your payout account status. Please try again or contact support.
          </p>
          <button
            onClick={() => router.push('/providers?tab=settings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
