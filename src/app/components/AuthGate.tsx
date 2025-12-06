'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from './GoogleSignInButton';
import { useAuth } from '../providers/AuthProvider';
import { me, signup } from '../lib/authClient';

type RoleChoice = 'consumer' | 'provider';
type AuthMode = 'signup' | 'login';

export default function AuthGate() {
  const { user, accessToken, setAuthState, clear, refreshUser } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [roleChoice, setRoleChoice] = useState<RoleChoice>('consumer');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const isAuthed = useMemo(() => !!user, [user]);

  const handleToken = useCallback(async (token: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await me(token);
      if (res.status === 404) {
        // Not signed up yet; keep token and show signup inputs
        setAuthState({ provider: 'google', accessToken: token, user: null });
      } else if (res.ok) {
        const data = await res.json();
        setAuthState({ provider: 'google', accessToken: token, user: data.user });
        if (data.user.role === 'provider') {
          router.push('/providers');
        } else if (data.user.role === 'consumer') {
          router.push('/consumers');
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed');
      }
    } finally {
      setBusy(false);
    }
  }, [setAuthState, router]);

  const doSignup = useCallback(async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signup(accessToken, roleChoice, displayName || undefined, roleChoice === 'provider' ? companyName || undefined : undefined);
      if (!res.ok) {
        if (res.status === 409) {
          // Already registered: fetch user and redirect if provider
          const meRes = await me(accessToken);
          if (meRes.ok) {
            const data = await meRes.json();
            setAuthState({ provider: 'google', accessToken, user: data.user });
            if (data.user.role === 'provider') {
              router.push('/providers');
            } else if (data.user.role === 'consumer') {
              router.push('/consumers');
            }
          }
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Signup failed');
        return;
      }
      const meRes = await me(accessToken);
      if (meRes.ok) {
        const data = await meRes.json();
        setAuthState({ provider: 'google', accessToken, user: data.user });
        if (data.user.role === 'provider') {
          router.push('/providers');
        } else if (data.user.role === 'consumer') {
          router.push('/consumers');
        }
      }
    } finally {
      setBusy(false);
    }
  }, [accessToken, companyName, displayName, roleChoice, setAuthState, router]);

  // Auto-redirect when user is authenticated (on page reload)
  useEffect(() => {
    if (user) {
      if (user.role === 'provider') {
        router.push('/providers');
      } else if (user.role === 'consumer') {
        router.push('/consumers');
      }
    }
  }, [user, router]);

  // Fetch user data on mount if we have a token but no user
  useEffect(() => {
    if (accessToken && !user) {
      refreshUser(accessToken);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex w-full h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-violet-400 to-purple-300 rounded-full mix-blend-normal filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-r from-fuchsia-400 to-pink-300 rounded-full mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-300 rounded-full mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Left: Background image in rounded container with white margins */}
      <div className="hidden md:flex w-3/5 h-full items-center justify-center relative z-10">
        <div className="relative w-[90%] h-[92%] rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-700 hover:scale-[1.02]">
          <div className="absolute inset-0" style={{ backgroundImage: 'url(/signup_background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-fuchsia-900/30 to-pink-900/40"></div>

          {/* Top title with animation */}
          <div className="absolute left-12 top-20 text-white animate-fade-in-up">
            <div className="font-bold text-4xl md:text-5xl mb-3">
              Welcome to OpenGPU
            </div>
            <div className="text-base tracking-wide text-violet-100">Rent Powerful GPU by the Hour</div>
          </div>

          {/* Bottom section with animation */}
          <div className="absolute left-12 bottom-24 text-white max-w-xl animate-fade-in-up animation-delay-300">
            <div className="font-bold text-3xl md:text-4xl mb-4">On-Demand GPU Power</div>
            <p className="text-base leading-7 text-violet-50">
              Run AI, rendering, and research works on community GPUs - fast, secure, and affordable
            </p>
          </div>
        </div>
      </div>

      {/* Right: Auth area */}
      <div className="relative flex-1 h-full z-10 flex items-center justify-center">
        <div className={`w-[360px] md:w-[420px] animate-fade-in transition-all duration-500 ${accessToken && !isAuthed && authMode === 'signup' ? 'mt-8' : ''}`}>
          {/* Brand */}
          <div className="mb-6 flex items-center gap-2 group cursor-pointer">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white flex items-center justify-center text-[10px] font-bold shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              OG
            </div>
            <div className="text-[22px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">
              OpenGPU
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-sm p-1.5 shadow-sm">
              <button
                onClick={() => setAuthMode('signup')}
                className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  authMode === 'signup'
                    ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  authMode === 'login'
                    ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Log In
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-gray-600">
              {authMode === 'signup'
                ? 'Sign up with Google to get started'
                : 'Log in with your Google account'}
            </p>
          </div>

          {/* Google button */}
          <div className="mb-8">
            <GoogleSignInButton onToken={handleToken} />
          </div>

          {/* Signup form after token, if needed */}
          {accessToken && !isAuthed && authMode === 'signup' && (
            <div className="bg-white/80 backdrop-blur-md border border-indigo-200 rounded-2xl p-6 shadow-xl animate-slide-in-up">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  Complete Your Profile
                </div>
              </div>

              <div className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRoleChoice('consumer')}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 transform ${
                        roleChoice === 'consumer'
                          ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-violet-200 hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-xl transition-all duration-300 ${
                          roleChoice === 'consumer'
                            ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg'
                            : 'bg-gray-100'
                        }`}>
                          <svg className={`w-6 h-6 ${roleChoice === 'consumer' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <span className={`text-sm font-semibold transition-colors ${roleChoice === 'consumer' ? 'text-violet-900' : 'text-gray-700'}`}>
                          Rent GPUs
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setRoleChoice('provider')}
                      className={`p-5 rounded-2xl border-2 transition-all duration-300 transform ${
                        roleChoice === 'provider'
                          ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-violet-200 hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-xl transition-all duration-300 ${
                          roleChoice === 'provider'
                            ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg'
                            : 'bg-gray-100'
                        }`}>
                          <svg className={`w-6 h-6 ${roleChoice === 'provider' ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <span className={`text-sm font-semibold transition-colors ${roleChoice === 'provider' ? 'text-violet-900' : 'text-gray-700'}`}>
                          Provide GPUs
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Display Name
                  </label>
                  <input
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                {/* Company Name (Provider only) */}
                {roleChoice === 'provider' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Company Name <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <input
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  disabled={busy}
                  onClick={doSignup}
                  className="w-full mt-2 rounded-xl px-4 py-4 text-sm font-semibold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {busy ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Signed in */}
          {isAuthed && (
            <div className="flex flex-col gap-3">
              <div className="text-sm">Signed in as <span className="font-medium">{user?.email}</span> ({user?.role})</div>
              <div className="flex gap-2">
                <button className="rounded border px-3 py-2 text-sm" onClick={clear}>Logout</button>
                {user?.role === 'provider' && (
                  <button className="rounded border px-3 py-2 text-sm" onClick={() => router.push('/providers')}>Go to profile</button>
                )}
                {user?.role === 'consumer' && (
                  <button className="rounded border px-3 py-2 text-sm" onClick={() => router.push('/consumers')}>Dashboard</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legal text bottom-right */}
        <div className="absolute bottom-6 right-6 text-[11px] text-gray-400 text-right">
          By signing up to create an account I accept Company's
          <div>
            <a className="underline" href="#">Terms of use</a> & <a className="underline" href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}


