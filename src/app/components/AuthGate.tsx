'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton';
import { useAuth } from '../providers/AuthProvider';
import { me, signup } from '../lib/authClient';

type RoleChoice = 'consumer' | 'provider';

export default function AuthGate() {
  const { user, accessToken, setAuthState, clear } = useAuth();
  const [roleChoice, setRoleChoice] = useState<RoleChoice>('consumer');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Login failed');
      }
    } finally {
      setBusy(false);
    }
  }, [setAuthState]);

  const doSignup = useCallback(async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signup(accessToken, roleChoice, displayName || undefined, roleChoice === 'provider' ? companyName || undefined : undefined);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Signup failed');
        return;
      }
      const meRes = await me(accessToken);
      if (meRes.ok) {
        const data = await meRes.json();
        setAuthState({ provider: 'google', accessToken, user: data.user });
      }
    } finally {
      setBusy(false);
    }
  }, [accessToken, companyName, displayName, roleChoice, setAuthState]);

  return (
    <div className="relative flex w-full h-screen bg-white">
      {/* Left: Background image in rounded container with white margins */}
      <div className="hidden md:flex w-3/5 h-full items-center justify-center">
        <div className="relative w-[90%] h-[92%] rounded-3xl overflow-hidden shadow-sm">
          <div className="absolute inset-0" style={{ backgroundImage: 'url(/signup_background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className="absolute inset-0 bg-blue-700/10"></div>

          {/* Top title */}
          <div className="absolute left-12 top-20 text-white">
            <div className="font-mono text-4xl md:text-5xl mb-3">Welcome to OpenGPU</div>
            <div className="text-base tracking-wide">Rent Powerful GPU by the Hour</div>
          </div>

          {/* Bottom section */}
          <div className="absolute left-12 bottom-24 text-white max-w-xl">
            <div className="font-mono text-3xl md:text-4xl mb-4">On-Demand GPU Power</div>
            <p className="text-base leading-7">
              Run AI, rendering, and research works on community GPUs - fast, secure, and affordable
            </p>
          </div>
        </div>
      </div>

      {/* Right: Auth area */}
      <div className="relative flex-1 h-full">
        <div className="mx-auto mt-16 md:mt-24 w-[360px] md:w-[420px]">
          {/* Brand */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">S</div>
            <div className="text-[20px] font-semibold">OpenGPU</div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="inline-flex items-center rounded-xl border border-indigo-100 bg-indigo-50 p-1">
              <button className="px-5 py-2 text-sm rounded-lg bg-indigo-500 text-white">Sign Up</button>
              <button className="px-5 py-2 text-sm rounded-lg text-gray-400" disabled>Log In</button>
            </div>
          </div>

          {/* Google button */}
          <div className="mb-8">
            <GoogleSignInButton onToken={handleToken} />
          </div>

          {/* Signup form after token, if needed */}
          {accessToken && !isAuthed && (
            <div className="border rounded-xl p-4 flex flex-col gap-3">
              <div className="text-sm font-medium">Complete signup</div>
              <div className="flex gap-3 items-center">
                <label className="text-sm w-24">Role</label>
                <select className="border rounded px-2 py-2 text-sm flex-1" value={roleChoice} onChange={(e) => setRoleChoice(e.target.value as RoleChoice)}>
                  <option value="consumer">Consumer</option>
                  <option value="provider">Provider</option>
                </select>
              </div>
              <div className="flex gap-3 items-center">
                <label className="text-sm w-24">Name</label>
                <input className="border rounded px-2 py-2 text-sm flex-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              {roleChoice === 'provider' && (
                <div className="flex gap-3 items-center">
                  <label className="text-sm w-24">Company</label>
                  <input className="border rounded px-2 py-2 text-sm flex-1" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company (optional)" />
                </div>
              )}
              <button disabled={busy} onClick={doSignup} className="rounded-lg px-3 py-2 text-sm bg-black text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Create account'}</button>
              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>
          )}

          {/* Signed in */}
          {isAuthed && (
            <div className="flex flex-col gap-3">
              <div className="text-sm">Signed in as <span className="font-medium">{user?.email}</span> ({user?.role})</div>
              <button className="rounded border px-3 py-2 text-sm" onClick={clear}>Logout</button>
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


