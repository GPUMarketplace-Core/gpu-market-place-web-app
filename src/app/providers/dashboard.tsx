'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProviderDashboard() {
  const { accessToken, user, refreshUser, clear } = useAuth();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [pricingModal, setPricingModal] = useState<{ show: boolean; node: any }>({ show: false, node: null });
  const [jobDetailsModal, setJobDetailsModal] = useState<{ show: boolean; job: any }>({ show: false, job: null });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPayoutDetails, setShowPayoutDetails] = useState(false);
  const [payoutDetails, setPayoutDetails] = useState<any>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

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

    // Initial fetch
    fetchNodes();

    // Poll every 10 seconds for node status updates
    const intervalId = setInterval(() => {
      fetchNodes();
    }, 10000); // 10 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [accessToken, user?.role]);

  if (!accessToken) {
    return <div className="p-6 text-sm">Please sign in.</div>;
  }

  if (!user) {
    return <div className="p-6 text-sm text-gray-900">Loading user…</div>;
  }

  if (user.role !== 'provider') {
    return <div className="p-6 text-sm">Only providers have a profile.</div>;
  }

  const processingJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
  const completedJobs = jobs.filter(j => j.status === 'succeeded').length;
  const totalEarnings = nodes.reduce((sum, node) => {
    return sum + (node.specs?.gpus?.reduce((gpuSum: number, gpu: any) => gpuSum + (gpu.hourly_price_cents || 0), 0) || 0);
  }, 0) / 100;

  const handleViewPayoutDetails = async () => {
    if (!accessToken) return;
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/providers/me/stripe/details', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayoutDetails(data.details);
        setShowPayoutDetails(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to fetch payout details');
      }
    } catch (err: any) {
      alert('Error fetching payout details: ' + err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  const handleEditPayoutAccount = () => {
    router.push('/providers/settings/payout/setup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-xl shadow-xl border-r border-gray-200/50 animate-slide-in-right">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <span className="text-white font-bold text-[10px]">OG</span>
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">OPENGPU</span>
          </div>
          
          <nav className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">OVERVIEW</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'jobs'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V8" />
              </svg>
              Jobs
            </button>
            
            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'earnings'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Earnings
            </button>
            
            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Reviews
            </button>
            
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'knowledge'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Knowledge Base
            </button>
            
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-8 mb-3">SETTINGS</div>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            
            <button
              onClick={() => {
                clear();
                router.push('/');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-102"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between animate-fade-in">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">Provider Profile</h1>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Profile Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01] animate-scale-in">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {provider?.display_name || user?.email?.split('@')[0] || 'Provider'}
                    </h2>
                    <div className="text-sm text-gray-600 mb-4">
                      Processing: <span className="text-blue-600 font-medium">{processingJobs}</span> | 
                      Completed: <span className="text-green-600 font-medium ml-1">{completedJobs}</span>
                    </div>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5V3h5v14z" />
                      </svg>
                      △
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Reviews</div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <span className="text-yellow-400">★★★★</span>
                      <span className="text-gray-300">★</span>
                      <span className="ml-1">4.5/5</span>
                    </div>
                    <div className="text-xs text-gray-500">1,230 Reviews</div>
                  </div>
                </div>
              </div>

              {/* My Nodes Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-scale-in animation-delay-300">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-6">My Nodes</h3>
                {nodesError && <div className="text-sm text-red-600 mb-4">{nodesError}</div>}
                {nodes.length === 0 ? (
                  <div className="text-sm text-gray-900">No nodes registered yet.</div>
                ) : (
                  <div className="space-y-4">
                    {nodes.map((node) => (
                      <div key={node.id} className="border border-gray-200 rounded-2xl p-6 hover:border-violet-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{node.name || 'Unnamed Node'}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                node.status === 'online' 
                                  ? 'bg-green-100 text-green-800' 
                                  : node.status === 'offline'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {node.status}
                              </span>
                              {node.has_pricing ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Pricing Set
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No Pricing
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="text-gray-500">Region:</span> {node.region || 'Unknown'}
                              </div>
                              <div>
                                <span className="text-gray-500">OS:</span> {node.os || 'Unknown'}
                              </div>
                              <div>
                                <span className="text-gray-500">GPUs:</span> {node.gpu_count}
                              </div>
                              <div>
                                <span className="text-gray-500">Created:</span> {new Date(node.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {node.specs?.gpus && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">GPU Pricing:</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {node.specs.gpus.map((gpu: any, index: number) => (
                                    <div key={index} className="text-sm text-gray-600">
                                      {gpu.model}: {gpu.hourly_price_cents > 0 ? `$${(gpu.hourly_price_cents / 100).toFixed(2)}/hr` : 'No pricing'}
                                    </div>
                                  ))}
                                </div>
                                {node.has_pricing && (
                                  <div className="text-sm font-semibold text-green-600 mt-2 pt-2 border-t border-gray-200">
                                    Total Potential: ${(node.specs.gpus.reduce((sum: number, gpu: any) => sum + (gpu.hourly_price_cents || 0), 0) / 100).toFixed(2)}/hr
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4">
                            <button
                              onClick={() => setPricingModal({ show: true, node })}
                              disabled={!node.specs || node.gpu_count === 0}
                              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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

              {/* History Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-scale-in animation-delay-600">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">History</h3>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-110"
                  >
                    See All →
                  </button>
                </div>
                
                <div className="space-y-3">
                  {jobs.slice(0, 3).map((job, index) => (
                    <div key={job.id} className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        <div className="text-xs text-gray-500">{new Date(job.submitted_at).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={() => setJobDetailsModal({ show: true, job })}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white text-xs rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'jobs' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-xl animate-scale-in">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-8">Job Management</h2>
              {jobsError && <div className="text-sm text-red-600 mb-4">{jobsError}</div>}
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-900">No jobs yet.</div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-2xl p-6 hover:border-violet-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] bg-gradient-to-br from-white to-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{job.title}</h4>
                          <div className="text-sm text-gray-600 mb-2">
                            Submitted: {new Date(job.submitted_at).toLocaleDateString()}
                            {job.started_at && (
                              <span className="ml-3">Started: {new Date(job.started_at).toLocaleDateString()}</span>
                            )}
                            {job.finished_at && (
                              <span className="ml-3">Finished: {new Date(job.finished_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                          <button
                            onClick={() => setJobDetailsModal({ show: true, job })}
                            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white text-sm rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-xl animate-scale-in">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 mb-8">Earnings Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-scale-in">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Total Potential</h3>
                  <div className="text-4xl font-bold text-white">${totalEarnings.toFixed(2)}/hr</div>
                  <div className="text-sm text-white/80 mt-2">From {nodes.length} nodes</div>
                </div>
                <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-scale-in animation-delay-300">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">This Month</h3>
                  <div className="text-4xl font-bold text-white">$1,247.50</div>
                  <div className="text-sm text-white/80 mt-2">+12% from last month</div>
                </div>
                <div className="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-scale-in animation-delay-600">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Total Earned</h3>
                  <div className="text-4xl font-bold text-white">$8,932.15</div>
                  <div className="text-sm text-white/80 mt-2">Since inception</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews & Ratings</h2>
              <div className="text-center py-8 text-gray-900">Reviews functionality coming soon...</div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Knowledge Base</h2>
              <div className="text-center py-8 text-gray-900">Knowledge base coming soon...</div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
                  {provider ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{provider.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{provider.display_name || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{provider.company_name || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 capitalize">{provider.status}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{provider.rating_avg} ({provider.rating_count} reviews)</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payout Account</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {provider.payout_account_id ? (
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-900 font-mono">
                                    {showPayoutDetails ? provider.payout_account_id : '••••••••••••••••'}
                                  </div>
                                  {payoutDetails && showPayoutDetails && (
                                    <div className="text-xs text-gray-600 space-y-1 mt-2 pt-2 border-t border-gray-300">
                                      <div>Email: {payoutDetails.email || '-'}</div>
                                      {payoutDetails.externalAccount && (
                                        <>
                                          <div>Bank: {payoutDetails.externalAccount.bankName || 'Not set'}</div>
                                          <div>Account: ••••{payoutDetails.externalAccount.last4}</div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                              payoutDetails.payoutsEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {payoutDetails.payoutsEnabled ? 'Payouts Enabled' : 'Setup Incomplete'}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-900">No payout account configured</div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              {provider.payout_account_id && (
                                <button
                                  onClick={handleViewPayoutDetails}
                                  disabled={payoutLoading}
                                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {payoutLoading ? 'Loading...' : showPayoutDetails ? 'Hide' : 'View'}
                                </button>
                              )}
                              <button
                                onClick={handleEditPayoutAccount}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                              >
                                {provider.payout_account_id ? 'Edit' : 'Setup'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900">Loading profile...</div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Provider Agent Token</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use this token to authenticate your Provider Agent CLI. 
                    <span className="text-red-600 font-medium ml-1">Do not share this token with anyone.</span>
                  </p>
                  
                  <div className="relative">
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 font-mono text-sm text-gray-600 break-all">
                      {accessToken}
                    </div>
                    <button
                      onClick={() => {
                        if (accessToken) {
                          navigator.clipboard.writeText(accessToken);
                          alert('Token copied to clipboard!');
                        }
                      }}
                      className="absolute top-2 right-2 px-3 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Copy Token
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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

      {/* Job Details Modal */}
      {jobDetailsModal.show && (
        <JobDetailsModal
          job={jobDetailsModal.job}
          onClose={() => setJobDetailsModal({ show: false, job: null })}
        />
      )}
    </div>
  );
}

// Job Details Modal Component
function JobDetailsModal({ job, onClose }: {
  job: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">Job Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <div className="text-base text-gray-900 bg-gray-50 rounded-lg p-3">{job.title}</div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              job.status === 'succeeded' ? 'bg-green-100 text-green-800' :
              job.status === 'failed' ? 'bg-red-100 text-red-800' :
              job.status === 'running' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status}
            </span>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitted At</label>
              <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                {new Date(job.submitted_at).toLocaleString()}
              </div>
            </div>
            {job.started_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Started At</label>
                <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {new Date(job.started_at).toLocaleString()}
                </div>
              </div>
            )}
            {job.finished_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finished At</label>
                <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {new Date(job.finished_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Job Details */}
          {job.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{job.description}</div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Provider Information</p>
                <p>This view shows job details from the provider perspective. Consumer personal information is not displayed for privacy reasons.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8 gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Pricing Modal Component (same as before)
function PricingModal({ node, onClose, accessToken, onSuccess }: {
  node: any;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}) {
  const [prices, setPrices] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Update Pricing</h3>
          <p className="text-sm text-red-600 mb-4">No GPU specifications found for this node. Please add node specs first.</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Update Pricing - {node.name || 'Unnamed Node'}</h3>
        
        {error && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {node.specs.gpus.map((gpu: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-2">GPU {index + 1}</div>
                <div className="text-sm text-gray-900 mb-2">
                  Model: {gpu.model || 'Unknown'} | Memory: {gpu.memory_gb || 'Unknown'}GB
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-900">Hourly Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices[index] || '0.00'}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Pricing'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}