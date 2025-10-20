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
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [pricingModal, setPricingModal] = useState<{ show: boolean; node: any }>({ show: false, node: null });

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

  useEffect(() => {
    async function fetchNodes() {
      if (!accessToken || user?.role !== 'provider') return;
      const res = await fetch('/api/providers/me/nodes', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
      } else {
        const data = await res.json().catch(() => ({}));
        setNodesError(data.error || 'Failed to load nodes');
      }
    }
    fetchNodes();
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

      {/* Nodes Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">My Nodes</h2>
        {nodesError && <div className="text-sm text-red-600 mb-2">{nodesError}</div>}
        {nodes.length === 0 ? (
          <div className="text-sm text-gray-500">No nodes registered yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {nodes.map((node) => (
              <div key={node.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{node.name || 'Unnamed Node'}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {node.id}</div>
                    <div className="text-xs text-gray-500">Region: {node.region || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">OS: {node.os || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">GPUs: {node.gpu_count}</div>
                    <div className="text-xs text-gray-500">Created: {new Date(node.created_at).toLocaleDateString()}</div>
                    {node.specs?.gpus && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">GPU Pricing:</div>
                        {node.specs.gpus.map((gpu: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600">
                            {gpu.model}: {gpu.hourly_price_cents > 0 ? `$${(gpu.hourly_price_cents / 100).toFixed(2)}/hr` : 'No pricing'}
                          </div>
                        ))}
                        {node.has_pricing && (
                          <div className="text-xs font-medium text-green-600 mt-1">
                            Total: ${(node.specs.gpus.reduce((sum: number, gpu: any) => sum + (gpu.hourly_price_cents || 0), 0) / 100).toFixed(2)}/hr
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      node.status === 'online' ? 'bg-green-50 text-green-700 border-green-200' :
                      node.status === 'offline' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {node.status}
                    </span>
                    {node.has_pricing ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Pricing Set
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                        No Pricing
                      </span>
                    )}
                    <button 
                      onClick={() => setPricingModal({ show: true, node })}
                      className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50"
                      disabled={!node.specs || node.gpu_count === 0}
                    >
                      Update Pricing
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Pricing Update Modal */}
      {pricingModal.show && (
        <PricingModal 
          node={pricingModal.node} 
          onClose={() => setPricingModal({ show: false, node: null })} 
          accessToken={accessToken}
          onSuccess={() => {
            // Refresh nodes after successful update
            const fetchNodes = async () => {
              const res = await fetch('/api/providers/me/nodes', { headers: { Authorization: `Bearer ${accessToken}` } });
              if (res.ok) {
                const data = await res.json();
                setNodes(data.nodes || []);
              }
            };
            fetchNodes();
            setPricingModal({ show: false, node: null });
          }}
        />
      )}
    </div>
  );
}

// Pricing Modal Component
function PricingModal({ node, onClose, accessToken, onSuccess }: {
  node: any;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}) {
  const [prices, setPrices] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize prices from existing node specs
  React.useEffect(() => {
    if (node.specs?.gpus) {
      const initialPrices: { [key: number]: string } = {};
      node.specs.gpus.forEach((gpu: any, index: number) => {
        initialPrices[index] = gpu.hourly_price_cents ? (gpu.hourly_price_cents / 100).toFixed(2) : '0.00';
      });
      setPrices(initialPrices);
    }
  }, [node]);

  const handlePriceChange = (gpuIndex: number, price: string) => {
    setPrices(prev => ({ ...prev, [gpuIndex]: price }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);

    try {
      // Update pricing for each GPU
      for (const [gpuIndexStr, priceStr] of Object.entries(prices)) {
        const gpuIndex = parseInt(gpuIndexStr);
        const priceInCents = Math.round(parseFloat(priceStr) * 100);
        
        const res = await fetch(`/api/nodes/${node.id}/pricing`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gpuIndex,
            hourly_price_cents: priceInCents
          })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to update GPU ${gpuIndex} pricing`);
        }
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!node.specs?.gpus) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Update Pricing</h3>
          <p className="text-sm text-red-600 mb-4">No GPU specifications found for this node. Please add node specs first.</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Update Pricing - {node.name || 'Unnamed Node'}</h3>
        
        {error && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {node.specs.gpus.map((gpu: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="font-medium mb-2">GPU {index + 1}</div>
                <div className="text-sm text-gray-600 mb-2">
                  Model: {gpu.model || 'Unknown'} | Memory: {gpu.memory_gb || 'Unknown'}GB
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Hourly Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices[index] || '0.00'}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    className="border rounded px-2 py-1 text-sm w-24"
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Pricing'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


