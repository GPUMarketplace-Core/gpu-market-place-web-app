'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

  useEffect(() => {
    if (user) {
      if (user.role === 'provider') {
        router.push('/providers');
      } else if (user.role === 'consumer') {
        router.push('/consumers');
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (accessToken && !user) {
      refreshUser(accessToken);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#faf9f7',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        color: '#141420',
      }}
    >
      {/* ── Nav ── */}
      <nav className="max-w-[1240px] w-full mx-auto px-6 lg:px-10 flex items-center justify-between h-[72px]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-[#141420] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <span className="text-[10px] font-bold text-[#faf9f7]" style={{ fontFamily: 'var(--font-instrument-serif)' }}>
              OG
            </span>
          </div>
          <span className="text-lg font-semibold tracking-tight">OpenGPU</span>
        </Link>

        <Link
          href="/"
          className="text-[14px] text-[#55556a] hover:text-[#141420] transition-colors"
        >
          &larr; Back to home
        </Link>
      </nav>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[440px]">

          {/* Header */}
          <div className="text-center mb-10" style={{ animation: 'lp-reveal 0.6s cubic-bezier(0.22,1,0.36,1) both' }}>
            <h1
              className="text-[clamp(1.8rem,4vw,2.4rem)] leading-[1.1] tracking-[-0.02em] mb-3"
              style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif' }}
            >
              {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[15px] text-[#55556a]">
              {authMode === 'signup'
                ? 'Get started with GPU compute in seconds'
                : 'Sign in to your OpenGPU account'}
            </p>
          </div>

          {/* Auth mode tabs */}
          <div
            className="flex items-center rounded-xl bg-[#f0eee9] p-1 mb-8"
            style={{ animation: 'lp-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.08s both' }}
          >
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200 ${
                authMode === 'signup'
                  ? 'bg-white text-[#141420] shadow-sm'
                  : 'text-[#8c8c9e] hover:text-[#55556a]'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200 ${
                authMode === 'login'
                  ? 'bg-white text-[#141420] shadow-sm'
                  : 'text-[#8c8c9e] hover:text-[#55556a]'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Google OAuth button */}
          <div style={{ animation: 'lp-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.16s both' }}>
            <GoogleSignInButton onToken={handleToken} />
          </div>

          {/* Signup completion form */}
          {accessToken && !isAuthed && authMode === 'signup' && (
            <div
              className="mt-8 bg-white border border-[#e5e2dc] rounded-2xl p-7"
              style={{ animation: 'lp-reveal 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#f0eee9] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#55556a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-semibold">Complete your profile</div>
                  <div className="text-[12px] text-[#8c8c9e]">Choose your role to get started</div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Role selection */}
                <div>
                  <label className="block text-[13px] font-medium text-[#55556a] mb-2.5">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRoleChoice('consumer')}
                      className={`relative p-5 rounded-xl border-2 transition-all duration-200 ${
                        roleChoice === 'consumer'
                          ? 'border-[#4f46e5] bg-[#f5f3ff]'
                          : 'border-[#e5e2dc] bg-white hover:border-[#d0cdc6]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                          roleChoice === 'consumer' ? 'bg-[#4f46e5]' : 'bg-[#f0eee9]'
                        }`}>
                          <svg className={`w-5 h-5 ${roleChoice === 'consumer' ? 'text-white' : 'text-[#8c8c9e]'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-4.5L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                          </svg>
                        </div>
                        <div>
                          <div className={`text-[13px] font-semibold ${roleChoice === 'consumer' ? 'text-[#4f46e5]' : 'text-[#141420]'}`}>
                            Rent GPUs
                          </div>
                          <div className="text-[11px] text-[#8c8c9e] mt-0.5">Submit compute jobs</div>
                        </div>
                      </div>
                      {roleChoice === 'consumer' && (
                        <div className="absolute top-2.5 right-2.5">
                          <svg className="w-4 h-4 text-[#4f46e5]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => setRoleChoice('provider')}
                      className={`relative p-5 rounded-xl border-2 transition-all duration-200 ${
                        roleChoice === 'provider'
                          ? 'border-[#4f46e5] bg-[#f5f3ff]'
                          : 'border-[#e5e2dc] bg-white hover:border-[#d0cdc6]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                          roleChoice === 'provider' ? 'bg-[#4f46e5]' : 'bg-[#f0eee9]'
                        }`}>
                          <svg className={`w-5 h-5 ${roleChoice === 'provider' ? 'text-white' : 'text-[#8c8c9e]'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                        <div>
                          <div className={`text-[13px] font-semibold ${roleChoice === 'provider' ? 'text-[#4f46e5]' : 'text-[#141420]'}`}>
                            Provide GPUs
                          </div>
                          <div className="text-[11px] text-[#8c8c9e] mt-0.5">Monetize hardware</div>
                        </div>
                      </div>
                      {roleChoice === 'provider' && (
                        <div className="absolute top-2.5 right-2.5">
                          <svg className="w-4 h-4 text-[#4f46e5]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-[13px] font-medium text-[#55556a] mb-2">
                    Display Name
                  </label>
                  <input
                    className="w-full px-4 py-3 text-[14px] border border-[#e5e2dc] rounded-xl focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none transition-all bg-white placeholder:text-[#c0bfca]"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>

                {/* Company Name (Provider only) */}
                {roleChoice === 'provider' && (
                  <div style={{ animation: 'lp-reveal 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
                    <label className="block text-[13px] font-medium text-[#55556a] mb-2">
                      Company Name <span className="text-[#8c8c9e] font-normal">(optional)</span>
                    </label>
                    <input
                      className="w-full px-4 py-3 text-[14px] border border-[#e5e2dc] rounded-xl focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none transition-all bg-white placeholder:text-[#c0bfca]"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  disabled={busy}
                  onClick={doSignup}
                  className="w-full py-3.5 text-[14px] font-medium text-white bg-[#4f46e5] rounded-xl hover:bg-[#4338ca] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99]"
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

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[13px] text-red-700">{error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Already signed in */}
          {isAuthed && (
            <div
              className="mt-8 bg-white border border-[#e5e2dc] rounded-2xl p-7 text-center"
              style={{ animation: 'lp-reveal 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-[15px] font-medium mb-1">Signed in as {user?.email}</div>
              <div className="text-[13px] text-[#8c8c9e] mb-6 capitalize">{user?.role} account</div>
              <div className="flex gap-3 justify-center">
                <button
                  className="px-5 py-2.5 text-[13px] font-medium border border-[#e5e2dc] rounded-xl hover:bg-[#f0eee9] transition-colors"
                  onClick={clear}
                >
                  Sign Out
                </button>
                {user?.role === 'provider' && (
                  <button
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#4f46e5] rounded-xl hover:bg-[#4338ca] transition-colors"
                    onClick={() => router.push('/providers')}
                  >
                    Go to Dashboard
                  </button>
                )}
                {user?.role === 'consumer' && (
                  <button
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#4f46e5] rounded-xl hover:bg-[#4338ca] transition-colors"
                    onClick={() => router.push('/consumers')}
                  >
                    Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Divider + legal */}
          <div className="mt-8 text-center" style={{ animation: 'lp-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.28s both' }}>
            <div className="h-px bg-[#e5e2dc] mb-6" />
            <p className="text-[12px] text-[#8c8c9e] leading-relaxed">
              By signing up you agree to our{' '}
              <a href="#" className="text-[#55556a] underline underline-offset-2 hover:text-[#141420] transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#55556a] underline underline-offset-2 hover:text-[#141420] transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="max-w-[1240px] w-full mx-auto px-6 lg:px-10 border-t border-[#e5e2dc]">
        <div className="flex items-center justify-between py-6">
          <span className="text-[12px] text-[#8c8c9e]">&copy; {new Date().getFullYear()} OpenGPU</span>
          <div className="flex items-center gap-6 text-[12px] text-[#8c8c9e]">
            <a href="#" className="hover:text-[#141420] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#141420] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#141420] transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
