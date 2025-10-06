'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';

function diffMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

export default function BillingPage() {
  const params = useParams<{ jobId: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!accessToken) return;
      const res = await fetch(`/api/providers/me/jobs/${params.jobId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to fetch job');
      }
    }
    load();
  }, [accessToken, params.jobId]);

  const minutes = useMemo(() => diffMinutes(job?.started_at, job?.finished_at || new Date().toISOString()), [job]);
  const ratePerMinute = 0.2; // demo rate
  const subtotal = minutes * ratePerMinute;
  const platformFee = subtotal * 0.05;
  const total = subtotal + platformFee;

  return (
    <div className="p-6">
      <button className="text-sm mb-4 underline" onClick={() => router.back()}>&larr; Back</button>
      <h1 className="text-2xl font-semibold mb-4">Billing Details</h1>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {!job ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Job</div>
            <div className="font-medium mb-2">{job.title}</div>
            <div className="text-xs text-gray-500">Submitted: {new Date(job.submitted_at).toLocaleString()}</div>
            {job.started_at && <div className="text-xs text-gray-500">Started: {new Date(job.started_at).toLocaleString()}</div>}
            {job.finished_at && <div className="text-xs text-gray-500">Finished: {new Date(job.finished_at).toLocaleString()}</div>}
            <div className="mt-3">
              <span className={`text-xs px-2 py-1 rounded-full border ${
                job.status === 'succeeded' ? 'bg-green-50 text-green-700 border-green-200' :
                job.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                job.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {job.status}
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm font-medium mb-3">Cost breakdown</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Usage minutes</span><span>{minutes} min</span></div>
              <div className="flex justify-between"><span>Rate</span><span>${ratePerMinute.toFixed(2)}/min</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Platform fee (5%)</span><span>${platformFee.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="md:col-span-2 border rounded-lg p-4">
            <div className="text-sm font-medium mb-2">Usage chart (demo)</div>
            <div className="h-24 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-300 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}


