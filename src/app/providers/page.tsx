'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

export default function ProviderProfilePage() {
  const { accessToken, user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!accessToken || user?.role !== 'provider') return;
      const res = await fetch('/api/providers/me', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load profile');
      }
    }
    fetchProfile();
  }, [accessToken, user?.role]);

  if (!accessToken) {
    return <div className="p-6 text-sm">Please sign in.</div>;
  }
  if (user?.role !== 'provider') {
    return <div className="p-6 text-sm">Only providers have a profile.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Provider Profile</h1>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {!provider ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="text-sm">{provider.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Display name</div>
            <div className="text-sm">{provider.display_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Company</div>
            <div className="text-sm">{provider.company_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Payout account</div>
            <div className="text-sm">{provider.payout_account_id || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="text-sm capitalize">{provider.status}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Rating</div>
            <div className="text-sm">{provider.rating_avg} ({provider.rating_count})</div>
          </div>
        </div>
      )}
    </div>
  );
}


