'use client';

import React, { useCallback, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  onToken?: (token: string) => void;
}

export default function GoogleSignInButton({ onToken }: Props) {
  const { setAuthState, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;

  const requestAccessToken = useCallback(() => {
    if (!clientId) {
      console.error('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID');
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      console.error('Google Identity Services not loaded');
      return;
    }
    setLoading(true);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (resp: any) => {
        try {
          const token = resp.access_token;
          if (onToken) onToken(token);
          // Try to fetch user; if not found, caller will handle signup
          await refreshUser(token);
          setAuthState({ provider: 'google', accessToken: token, user: null });
        } finally {
          setLoading(false);
        }
      },
    });
    tokenClient.requestAccessToken();
  }, [clientId, onToken, refreshUser, setAuthState]);

  return (
    <button
      onClick={requestAccessToken}
      className="w-full h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm flex items-center justify-center gap-3 shadow-sm cursor-pointer transition-all duration-200"
      disabled={loading}
    >
      <span className="inline-flex items-center justify-center h-5 w-5">
        <svg viewBox="0 0 48 48" width="20" height="20">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.744,6.053,29.116,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,14,24,14c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.744,6.053,29.116,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.196l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.189,0-9.594-3.317-11.27-7.946l-6.522,5.025C9.5,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.083,5.566 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.657,44,35,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
      </span>
      <span className="font-medium text-gray-900">{loading ? 'Signing in…' : 'Continue with Google'}</span>
    </button>
  );
}


