'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface Provider {
  provider_id: string;
  provider_display_name: string;
  provider_email: string;
  company_name: string;
  rating: {
    average: number;
    count: number;
  };
  online_nodes_count: number;
  nodes: Array<{
    node_id: string;
    name: string;
    region: string;
    status: string;
    specs: {
      gpus: Array<{
        model: string;
        vram_gb: number;
        hourly_price_cents: number;
      }>;
      cpu: { model: string; cores: number };
      memory_gb: number;
    } | null;
  }>;
}

interface Job {
  id: string;
  title: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  submitted_at: string;
  started_at?: string;
  finished_at?: string;
  provider_id?: string;
  artifacts_ref?: string;
  failure_reason?: string;
}

export default function ConsumerDashboard() {
  const { user, accessToken, refreshUser, clear } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // Job Submission State
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && !user) {
      void refreshUser();
    }
  }, [accessToken, user, refreshUser]);

  useEffect(() => {
    if (!accessToken) {
      router.push('/');
      return;
    }
    if (user?.role === 'provider') {
      router.push('/providers');
      return;
    }
  }, [accessToken, user, router]);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/providers?status=online');
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        } else {
          setError('Failed to load providers');
        }
      } catch (err) {
        setError('Failed to load providers');
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  const fetchJobs = async () => {
    if (!accessToken) return;
    setJobsLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        setJobsError('Failed to fetch jobs');
      }
    } catch (err) {
      setJobsError('Failed to fetch jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs' || activeTab === 'dashboard') {
      fetchJobs();
    }
  }, [activeTab, accessToken]);

  const handleOpenJobModal = (provider: Provider, nodeId: string) => {
    setSelectedProvider(provider);
    setSelectedNodeId(nodeId);
    setJobTitle('');
    setJobFile(null);
    setSubmitError(null);
    setShowJobModal(true);
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !selectedNodeId || !jobTitle || !jobFile || !accessToken) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('title', jobTitle);
      formData.append('provider_id', selectedProvider.provider_id);
      formData.append('node_id', selectedNodeId);
      formData.append('file', jobFile);

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (res.ok) {
        setShowJobModal(false);
        setActiveTab('jobs');
        fetchJobs();
      } else {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to submit job');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit job');
    } finally {
      setSubmitting(false);
    }
  };

  const totalProviders = providers.length;
  const totalOnlineNodes = providers.reduce((sum, p) => sum + p.online_nodes_count, 0);
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const completedJobs = jobs.filter(j => j.status === 'succeeded').length;

  if (!accessToken) {
    return <div className="p-6 text-sm">Please sign in.</div>;
  }

  if (!user) {
    return <div className="p-6 text-sm text-gray-500">Loading user…</div>;
  }

  if (user.role !== 'consumer') {
    return <div className="p-6 text-sm">Only consumers can access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">G</span>
            </div>
            <span className="font-semibold text-gray-900">OPENGPU</span>
          </div>
          
          <nav className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">OVERVIEW</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'marketplace' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Providers
            </button>
            
            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'jobs' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8a2 2 0 012-2V8" />
              </svg>
              My Jobs
            </button>
            
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-8 mb-3">SETTINGS</div>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
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
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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
      <div className="flex-1 overflow-auto relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Consumer Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Browse providers and manage your GPU compute jobs</p>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {user?.display_name || user?.email?.split('@')[0] || 'Consumer'}
                    </h2>
                    <div className="text-sm text-gray-600 mb-4">
                      Active Jobs: <span className="text-blue-600 font-medium">{runningJobs}</span> | 
                      Completed: <span className="text-green-600 font-medium ml-1">{completedJobs}</span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('marketplace')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Find a Provider
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 mb-1">Account Status</div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Available Providers</h3>
                  <div className="text-3xl font-bold text-blue-900">{totalProviders}</div>
                  <div className="text-sm text-blue-600 mt-1">{totalOnlineNodes} nodes online</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Total Jobs</h3>
                  <div className="text-3xl font-bold text-purple-900">{jobs.length}</div>
                  <div className="text-sm text-purple-600 mt-1">{runningJobs} currently running</div>
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
                  <button 
                    onClick={() => setActiveTab('jobs')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                
                {jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No jobs submitted yet</p>
                    <p className="text-sm mt-1">Submit your first GPU compute job to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{job.title}</h4>
                          <div className="text-sm text-gray-600">
                            {new Date(job.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status === 'running' ? 'in-progress' : job.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'marketplace' && (
            <div>
              {loading && (
                <div className="text-center py-8 text-gray-500">Loading providers...</div>
              )}

              {error && (
                <div className="text-center py-8 text-red-600">{error}</div>
              )}

              {!loading && !error && providers.length === 0 && (
                <div className="text-center py-8 text-gray-500">No online providers found.</div>
              )}

              {!loading && !error && providers.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {providers.map((provider) => (
                    <div key={provider.provider_id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                      {/* Provider Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {provider.provider_display_name || provider.provider_email.split('@')[0]}
                          </h3>
                          {provider.company_name && (
                            <p className="text-sm text-gray-600">{provider.company_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-yellow-400">★</span>
                            <span className="font-medium">{provider.rating.average.toFixed(1)}</span>
                            <span className="text-gray-500">({provider.rating.count})</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {provider.online_nodes_count} nodes online
                          </div>
                        </div>
                      </div>

                      {/* GPU Nodes */}
                      <div className="space-y-3">
                        {provider.nodes.filter(node => node.status === 'online').map((node) => (
                          <div key={node.node_id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{node.name || 'Unnamed Node'}</h4>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {node.region}
                              </span>
                            </div>
                            
                            {node.specs?.gpus && (
                              <div className="space-y-2 mb-3">
                                {node.specs.gpus.map((gpu, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{gpu.model}</span>
                                      <span className="text-gray-500">({gpu.vram_gb}GB)</span>
                                    </div>
                                    <div className="font-semibold text-blue-600">
                                      ${(gpu.hourly_price_cents / 100).toFixed(2)}/hr
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <button
                              onClick={() => handleOpenJobModal(provider, node.node_id)}
                              className="w-full py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Rent Node & Submit Job
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'jobs' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Jobs</h2>
              {jobsError && <div className="text-sm text-red-600 mb-4">{jobsError}</div>}
              {jobsLoading && <div className="text-sm text-gray-500 mb-4">Loading jobs...</div>}
              
              {!jobsLoading && jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No jobs submitted yet.</div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
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
                          {job.failure_reason && (
                            <div className="text-sm text-red-600">Error: {job.failure_reason}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                            job.status === 'failed' ? 'bg-red-100 text-red-800' :
                            job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status === 'running' ? 'in-progress' : job.status}
                          </span>
                          
                          {job.status === 'succeeded' && job.artifacts_ref && (
                            <a 
                              href={job.artifacts_ref}
                              download
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Result
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{user.display_name || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 capitalize">{user.role}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Job Submission Modal */}
        {showJobModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Submit Job</h3>
                <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Render Scene 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blend File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setJobFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".blend,.zip"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported formats: .blend</p>
                </div>

                {submitError && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{submitError}</div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
