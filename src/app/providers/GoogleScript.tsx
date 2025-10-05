'use client';

import Script from 'next/script';

export function GoogleScript() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      {!clientId && (
        <div style={{ display: 'none' }} data-missing-google-client-id></div>
      )}
    </>
  );
}


