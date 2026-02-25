'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

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
  const [earnings, setEarnings] = useState<any | null>(null);
  const [earningsError, setEarningsError] = useState<string | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<any | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    // Ensure we have the latest user when navigating directly with a token in storage
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

  useEffect(() => {
    async function fetchEarnings() {
      if (!accessToken || user?.role !== 'provider') return;
      setEarningsLoading(true);
      setEarningsError(null);
      try {
        const res = await fetch('/api/providers/me/earnings?range=month', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEarnings(data);
        } else {
          const data = await res.json().catch(() => ({}));
          setEarningsError(data.error || 'Failed to load earnings');
        }
      } catch (err: any) {
        setEarningsError(err.message || 'Failed to load earnings');
      } finally {
        setEarningsLoading(false);
      }
    }
    fetchEarnings();
  }, [accessToken, user?.role]);

  useEffect(() => {
    async function fetchReviews() {
      if (!accessToken || user?.role !== 'provider') return;
      setReviewsLoading(true);
      setReviewsError(null);
      try {
        const res = await fetch('/api/providers/me/reviews?limit=20', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
          setReviewsSummary(data.summary || null);
        } else {
          const data = await res.json().catch(() => ({}));
          setReviewsError(data.error || 'Failed to load reviews');
        }
      } catch (err: any) {
        setReviewsError(err.message || 'Failed to load reviews');
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
  }, [accessToken, user?.role]);

  if (!accessToken) {
    return <div className="p-6 text-sm">Please sign in.</div>;
  }

  if (!user) {
    return <div className="p-6 text-sm text-gray-900 dark:text-gray-100">Loading user…</div>;
  }

  if (user.role !== 'provider') {
    return <div className="p-6 text-sm">Only providers have a profile.</div>;
  }

  const processingJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;
  const completedJobs = jobs.filter(j => j.status === 'succeeded').length;
  const potentialHourlyEarnings = nodes.reduce((sum, node) => {
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl border-r border-gray-200/50 dark:border-gray-700/50 animate-slide-in-right">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <span className="text-white font-bold text-[10px]">OG</span>
            </div>
            <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">OPENGPU</span>
          </div>
          
          <nav className="space-y-1">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">OVERVIEW</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-102'
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
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-102'
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
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-102'
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
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-102'
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
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-102'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Knowledge Base
            </button>
            
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-8 mb-3">SETTINGS</div>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-102'
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
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between animate-fade-in">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300">Provider Profile</h1>
            <ThemeToggle />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Profile Card */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01] animate-scale-in">
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {provider?.display_name || user?.email?.split('@')[0] || 'Provider'}
                      </h2>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Processing:{' '}
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{processingJobs}</span> | Completed:{' '}
                        <span className="text-green-600 dark:text-green-400 font-medium ml-1">{completedJobs}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Reviews</div>
                      {reviewsSummary ? (
                        <>
                          <div className="flex items-center justify-end gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span
                                key={idx}
                                className={
                                  idx < Math.round(reviewsSummary.avgRating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-1">{reviewsSummary.avgRating.toFixed(1)}/5</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {reviewsSummary.reviewCount}{' '}
                            {reviewsSummary.reviewCount === 1 ? 'Review' : 'Reviews'}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">No reviews yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* My Nodes Section */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-scale-in animation-delay-300">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Nodes</h3>
                {nodesError && <div className="text-sm text-red-600 mb-4">{nodesError}</div>}
                {nodes.length === 0 ? (
                  <div className="text-sm text-gray-900 dark:text-gray-100">No nodes registered yet.</div>
                ) : (
                  <div className="space-y-4">
                    {nodes.map((node) => (
                      <div key={node.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{node.name || 'Unnamed Node'}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                node.status === 'online'
                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                  : node.status === 'offline'
                                  ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              }`}>
                                {node.status}
                              </span>
                              {node.has_pricing ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                                  Pricing Set
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
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
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPU Pricing:</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {node.specs.gpus.map((gpu: any, index: number) => (
                                    <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                      {gpu.model}: {gpu.hourly_price_cents > 0 ? `$${(gpu.hourly_price_cents / 100).toFixed(2)}/hr` : 'No pricing'}
                                    </div>
                                  ))}
                                </div>
                                {node.has_pricing && (
                                  <div className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
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

              {/* Job History Section */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 animate-scale-in animation-delay-600">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Job History</h3>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 hover:scale-110"
                  >
                    See All →
                  </button>
                </div>

                <div className="space-y-3">
                  {jobs.slice(0, 3).map((job, index) => (
                    <div key={job.id} className="flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 dark:hover:from-violet-900/30 dark:hover:to-fuchsia-900/30 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{String.fromCharCode(65 + index)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.title}</div>
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl animate-scale-in">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Job Management</h2>
              {jobsError && <div className="text-sm text-red-600 mb-4">{jobsError}</div>}
              {jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-900 dark:text-gray-100">No jobs yet.</div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{job.title}</h4>
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl animate-scale-in">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 mb-6">
                Earnings Overview
              </h2>

              {earningsLoading && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Loading earnings…</div>
              )}
              {earningsError && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-4">{earningsError}</div>
              )}

              {earnings && (
                <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-scale-in">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Total Potential</h3>
                      <div className="text-4xl font-bold text-white">
                        ${potentialHourlyEarnings.toFixed(2)}/hr
                      </div>
                  <div className="text-sm text-white/80 mt-2">From {nodes.length} nodes</div>
                </div>

                <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-scale-in animation-delay-300">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">This Month</h3>
                      <div className="text-4xl font-bold text-white">
                        ${(earnings.summary.providerEarningsCents / 100).toFixed(2)}
                </div>
                      <div className="text-sm text-white/80 mt-2">
                        Platform fees: ${(earnings.summary.platformFeesCents / 100).toFixed(2)}
                      </div>
                      {typeof earnings.summary.monthOverMonthChangePct === 'number' && (
                        <div className="text-xs text-white/80 mt-1">
                          {earnings.summary.monthOverMonthChangePct >= 0 ? '+' : ''}
                          {earnings.summary.monthOverMonthChangePct.toFixed(1)}% vs last month
                        </div>
                      )}
                    </div>

                <div className="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-scale-in animation-delay-600">
                  <h3 className="text-lg font-semibold text-white/90 mb-2">Total Earned</h3>
                      <div className="text-4xl font-bold text-white">
                        ${(earnings.lifetime.providerEarningsCents / 100).toFixed(2)}
                </div>
                      <div className="text-sm text-white/80 mt-2">
                        Gross volume: ${(earnings.lifetime.grossRevenueCents / 100).toFixed(2)}
              </div>
                    </div>
                  </div>

                  {/* Daily earnings trend */}
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-inner mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Daily Earnings (This Month)</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {earnings.daily.length} day{earnings.daily.length === 1 ? '' : 's'} with payouts
                      </span>
                    </div>
                    {earnings.daily.length === 0 ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">No captured payments yet this month.</div>
                    ) : (
                      <div className="space-y-2">
                        {earnings.daily.map((d: any) => (
                          <div
                            key={d.day}
                            className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200"
                          >
                            <div className="w-32 text-gray-600 dark:text-gray-400">
                              {new Date(d.day).toLocaleDateString()}
                            </div>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (d.providerEarningsCents /
                                      Math.max(
                                        1,
                                        Math.max(
                                          ...earnings.daily.map(
                                            (x: any) => x.providerEarningsCents || 0
                                          )
                                        )
                                      )) * 100
                                  ).toFixed(1)}%`,
                                }}
                              />
                            </div>
                            <div className="w-24 text-right font-medium text-gray-800 dark:text-gray-200">
                              ${(d.providerEarningsCents / 100).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-800 dark:text-gray-200">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Paid Jobs
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {earnings.summary.paidJobs}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Jobs with captured payments this month
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Paid Orders
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {earnings.summary.paidOrders}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Some orders may contain multiple jobs
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Platform Take Rate
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {earnings.summary.grossRevenueCents > 0
                          ? `${(
                              (earnings.summary.platformFeesCents /
                                earnings.summary.grossRevenueCents) *
                              100
                            ).toFixed(1)}%`
                          : '—'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Fees as a share of total customer spend this month
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl animate-scale-in">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 mb-6">
                Reviews & Ratings
              </h2>

              {reviewsLoading && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Loading reviews…</div>
              )}
              {reviewsError && (
                <div className="text-sm text-red-600 dark:text-red-400 mb-4">{reviewsError}</div>
              )}

              {reviewsSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-6 shadow-xl text-white">
                    <div className="text-sm font-semibold text-white/90 mb-1">
                      Average Rating
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-4xl font-bold">
                        {reviewsSummary.avgRating.toFixed(2)}
                      </div>
                      <div className="text-lg">/ 5</div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={
                            idx < Math.round(reviewsSummary.avgRating)
                              ? 'text-yellow-300'
                              : 'text-white/40'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl p-6 shadow-xl text-white">
                    <div className="text-sm font-semibold text-white/90 mb-1">
                      Total Reviews
                    </div>
                    <div className="text-4xl font-bold">
                      {reviewsSummary.reviewCount}
                    </div>
                    <div className="text-sm text-white/80 mt-2">
                      Last review:{' '}
                      {reviewsSummary.lastReviewAt
                        ? new Date(reviewsSummary.lastReviewAt).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>

                </div>
              )}

              <div className="space-y-4">
                {reviews.length === 0 && !reviewsLoading ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    You don&apos;t have any reviews yet. Once consumers complete jobs and leave
                    feedback, their comments will appear here.
                  </div>
                ) : (
                  (showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                    <div
                      key={review.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {review.consumerDisplayName ||
                                review.consumerEmail?.split('@')[0] ||
                                'Customer'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {review.consumerEmail}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm mb-2">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span
                                key={idx}
                                className={
                                  idx < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                }
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                              {review.rating}/5
                            </span>
                          </div>
                          {review.comment && (
                            <div className="text-sm text-gray-800 dark:text-gray-200">
                              {review.comment}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleString()
                            : ''}
                          <div className="mt-1">
                            Order ID:{' '}
                            <span className="font-mono text-[11px]">
                              {review.orderId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {reviews.length > 3 && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 transition-all duration-300"
                  >
                    {showAllReviews ? 'Show Less' : 'View All Reviews'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-8 animate-fade-in">
              {/* Hero Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLThoLTJ2LTRoMnY0em0tOCA4aC0ydi00aDJ2NHptMC04aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Quick Start Guide
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      OpenGPU Provider Agent
                    </h2>
                    <p className="text-lg text-white/80 mb-6 max-w-xl">
                      Transform your Windows machine into a GPU computing powerhouse. Start earning by sharing your GPU resources with the OpenGPU network.
                    </p>
                    <a
                      href="https://github.com/GPUMarketplace-Core/providers-agent/releases/latest/download/GPU.Marketplace.Provider.Setup.1.0.0.exe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white text-violet-700 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download for Windows
                      <span className="text-sm font-normal text-violet-500 ml-2">v1.0.0</span>
                    </a>
                    <p className="text-white/60 text-sm mt-3">Windows 10/11 • 64-bit • ~45 MB</p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/20">
                      <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Steps */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </span>
                  Installation Guide
                </h3>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-6 p-6 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 rounded-2xl border border-violet-200/50 dark:border-violet-700/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">1</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Download the Installer</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Click the download button above to get the OpenGPU Provider Agent installer. The file will be saved to your Downloads folder.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        File: GPU.Marketplace.Provider.Setup.1.0.0.exe
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-6 p-6 bg-gradient-to-r from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 rounded-2xl border border-fuchsia-200/50 dark:border-fuchsia-700/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">2</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Run the Installer</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Double-click the downloaded file to launch the installation wizard. Follow the on-screen prompts to complete the installation.
                      </p>
                      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Windows SmartScreen:</span> If Windows shows a security warning, click &quot;More info&quot; → &quot;Run anyway&quot; to proceed with the installation.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-6 p-6 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl border border-pink-200/50 dark:border-pink-700/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">3</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Get Your Provider Agent Token</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Navigate to the <button onClick={() => setActiveTab('settings')} className="text-pink-600 dark:text-pink-400 font-medium hover:underline">Settings</button> tab in this dashboard. You&apos;ll find your unique Provider Agent Token in the &quot;Provider Agent Token&quot; section.
                      </p>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-4 font-mono text-sm overflow-x-auto">
                        <div className="flex items-center justify-between gap-4">
                          <code className="text-green-400 whitespace-nowrap">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
                          <span className="text-gray-500 text-xs whitespace-nowrap">← Your token looks like this</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">4</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Configure the Provider Agent</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Launch the OpenGPU Provider Agent from your desktop or Start menu. Go to Settings within the client and paste your Provider Agent Token to authenticate.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Open Settings</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Click the gear icon in the client</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">Paste Token</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Paste your token and save</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">5</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Start Earning!</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Once authenticated, click &quot;Start&quot; to begin sharing your GPU. Your node will appear on the Dashboard, and you&apos;ll start receiving jobs from consumers.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl text-sm font-medium">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Node Online
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Earning Active
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Requirements & FAQ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Requirements */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </span>
                    System Requirements
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Operating System</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Windows 10/11 (64-bit)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">GPU</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">NVIDIA GTX 1060 or higher (6GB+ VRAM)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">RAM</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">16GB minimum (32GB recommended)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">Network</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Stable internet connection (50+ Mbps)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                    <span className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Frequently Asked Questions
                  </h3>
                  <div className="space-y-4">
                    <details className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <summary className="flex items-center justify-between p-4 cursor-pointer">
                        <span className="font-medium text-gray-900 dark:text-gray-100">How do I get paid?</span>
                        <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                        Earnings are automatically transferred to your connected Stripe account. Set up your payout account in Settings to receive payments.
                      </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <summary className="flex items-center justify-between p-4 cursor-pointer">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Can I use my PC while providing?</span>
                        <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                        Yes! The agent runs in the background. However, GPU-intensive tasks may affect job performance. For best earnings, dedicate your GPU to OpenGPU.
                      </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <summary className="flex items-center justify-between p-4 cursor-pointer">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Is my data secure?</span>
                        <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                        Absolutely. All job data is encrypted and sandboxed. Your personal files are never accessible to jobs running on your machine.
                      </div>
                    </details>
                    <details className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <summary className="flex items-center justify-between p-4 cursor-pointer">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Where do I set my pricing?</span>
                        <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                        Once your node is online, go to the Dashboard tab and click &quot;Update Pricing&quot; on your node card to set hourly rates for each GPU.
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Need Help Banner */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Need Help?</h4>
                      <p className="text-gray-400">Our support team is ready to assist you</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <a href="mailto:support@opengpu.io" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Support
                    </a>
                    <a href="https://discord.gg/opengpu" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Join Discord
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Profile Information</h3>
                  {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
                  {provider ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{provider.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{provider.display_name || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{provider.company_name || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 capitalize">{provider.status}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{provider.rating_avg} ({provider.rating_count} reviews)</div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payout Account</label>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {provider.payout_account_id ? (
                                <div className="space-y-2">
                                  <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                    {showPayoutDetails ? provider.payout_account_id : '••••••••••••••••'}
                                  </div>
                                  {payoutDetails && showPayoutDetails && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                      <div>Email: {payoutDetails.email || '-'}</div>
                                      {payoutDetails.externalAccount && (
                                        <>
                                          <div>Bank: {payoutDetails.externalAccount.bankName || 'Not set'}</div>
                                          <div>Account: ••••{payoutDetails.externalAccount.last4}</div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                              payoutDetails.payoutsEnabled ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
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
                                <div className="text-sm text-gray-900 dark:text-gray-100">No payout account configured</div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              {provider.payout_account_id && (
                                <button
                                  onClick={handleViewPayoutDetails}
                                  disabled={payoutLoading}
                                  className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {payoutLoading ? 'Loading...' : showPayoutDetails ? 'Hide' : 'View'}
                                </button>
                              )}
                              <button
                                onClick={handleEditPayoutAccount}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors"
                              >
                                {provider.payout_account_id ? 'Edit' : 'Setup'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100">Loading profile...</div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Provider Agent Token</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Use this token to authenticate your Provider Agent CLI.
                    <span className="text-red-600 dark:text-red-400 font-medium ml-1">Do not share this token with anyone.</span>
                  </p>

                  <div className="relative">
                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-gray-300 break-all">
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
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 dark:bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Job Details</h3>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
            <div className="text-base text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{job.title}</div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              job.status === 'succeeded' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
              job.status === 'failed' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' :
              job.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}>
              {job.status}
            </span>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Submitted At</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                {new Date(job.submitted_at).toLocaleString()}
              </div>
            </div>
            {job.started_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Started At</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {new Date(job.started_at).toLocaleString()}
                </div>
              </div>
            )}
            {job.finished_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Finished At</label>
                <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {new Date(job.finished_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Job Details */}
          {job.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{job.description}</div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-fuchsia-50 dark:bg-fuchsia-900/30 border border-fuchsia-200 dark:border-fuchsia-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-fuchsia-800 dark:text-fuchsia-100">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
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
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Update Pricing - {node.name || 'Unnamed Node'}</h3>
        
        {error && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {node.specs.gpus.map((gpu: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">GPU {index + 1}</div>
                <div className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Model: {gpu.model || 'Unknown'} | Memory: {gpu.memory_gb || 'Unknown'}GB
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hourly Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices[index] || '0.00'}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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