'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProviderProfilePage() {
  const { accessToken, user, refreshUser, clear } = useAuth();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Ensure we have the latest user when navigating directly with a token in storage
  useEffect(() => {
    if (accessToken && !user) {
      void refreshUser();
    }
  }, [accessToken, user, refreshUser]);

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

  useEffect(() => {
    async function fetchJobs() {
      if (!accessToken || user?.role !== 'provider') return;
      const res = await fetch('/api/providers/me/jobs?limit=20', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        const data = await res.json().catch(() => ({}));
        setJobsError(data.error || 'Failed to load jobs');
      }
    }
    fetchJobs();
  }, [accessToken, user?.role]);

  if (!accessToken) {
    return <div className="p-6 text-sm">Please sign in.</div>;
  }

  if (!user) {
    return <div className="p-6 text-sm text-gray-500">Loading user…</div>;
  }

  if (user.role !== 'provider') {
    return <div className="p-6 text-sm">Only providers have a profile.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Provider Profile</h1>
        <button
          className="text-sm px-3 py-2 rounded border"
          onClick={() => {
            clear();
            router.push('/');
          }}
        >
          Logout
        </button>
      </div>
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

      {/* Job History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Job History</h2>
        {jobsError && <div className="text-sm text-red-600 mb-2">{jobsError}</div>}
        {jobs.length === 0 ? (
          <div className="text-sm text-gray-500">No jobs yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {jobs.map((j) => (
              <div key={j.id} className="rounded-lg border p-4 flex items-start justify-between">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-xs text-gray-500 mt-1">Submitted: {new Date(j.submitted_at).toLocaleString()}</div>
                  {j.started_at && <div className="text-xs text-gray-500">Started: {new Date(j.started_at).toLocaleString()}</div>}
                  {j.finished_at && <div className="text-xs text-gray-500">Finished: {new Date(j.finished_at).toLocaleString()}</div>}
                </div>
                <div className="self-center flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    j.status === 'succeeded' ? 'bg-green-50 text-green-700 border-green-200' :
                    j.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                    j.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {j.status}
                  </span>
                  <a href={`/billing/${j.id}`} className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50">Billing details</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


