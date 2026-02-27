'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

interface Props {
  onToken?: (token: string) => void | Promise<void>;
}

export default function GoogleSignInButton({ onToken }: Props) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function tryInit() {
      if (cancelled) return false;
      if (!window.google?.accounts?.id || !containerRef.current) return false;
      const width = containerRef.current.offsetWidth;
      if (!width) return false;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          setLoading(true);
          try {
            if (onTokenRef.current) await onTokenRef.current(response.credential);
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: width,
        logo_alignment: 'center',
      });

      setReady(true);
      return true;
    }

    requestAnimationFrame(() => {
      if (cancelled || tryInit()) return;
      intervalId = setInterval(() => {
        if (tryInit() && intervalId) clearInterval(intervalId);
      }, 200);
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId]);

  return (
    <div className="w-full relative" style={{ minHeight: '44px' }}>
      {/* Always in normal flow so offsetWidth is accurate; centered because Google caps button width at 400px */}
      <div ref={containerRef} className="w-full flex justify-center" />

      {/* Overlay: loading state */}
      {loading && (
        <div
          className="absolute inset-0 rounded-lg border border-[#e5e2dc] bg-white text-[14px] flex items-center justify-center gap-3"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg className="animate-spin h-4 w-4 text-[#55556a]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-medium text-[#141420]">Signing in...</span>
        </div>
      )}

      {/* Overlay: placeholder while GIS loads */}
      {!ready && !loading && (
        <div
          className="absolute inset-0 rounded-lg border border-[#e5e2dc] bg-[#faf9f7] text-[14px] flex items-center justify-center gap-3 animate-pulse"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          <span className="text-[#8c8c9e]">Loading...</span>
        </div>
      )}
    </div>
  );
}
