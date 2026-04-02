'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

function formatDuration(startDate: string | undefined, endDate: string | undefined): string | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const durationMs = end - start;
  if (durationMs < 0) return null;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getElapsedTime(startDate: string | undefined): string | null {
  if (!startDate) return null;
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const durationMs = now - start;
  if (durationMs < 0) return null;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/* ─── Icons (matching landing page style) ─── */
const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  search: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M2 13h20"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  gpu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><rect x="6.5" y="8" width="11" height="8" rx="1.5"/><line x1="9.5" y1="8" x2="9.5" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="14.5" y1="8" x2="14.5" y2="16"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  star: <svg width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8h9M8.5 4l4 4-4 4"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  globe: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
};

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Browse providers and manage your GPU compute jobs' },
  marketplace: { title: 'Marketplace', subtitle: 'Find and rent GPU compute nodes from providers worldwide' },
  jobs: { title: 'My Jobs', subtitle: 'Track and manage your submitted GPU compute jobs' },
  settings: { title: 'Settings', subtitle: 'Manage your account preferences' },
};

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
  const [lastJobsUpdate, setLastJobsUpdate] = useState<Date | null>(null);

  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken && !user) void refreshUser();
  }, [accessToken, user, refreshUser]);

  useEffect(() => {
    if (!accessToken) { router.push('/'); return; }
    if (user?.role === 'provider') { router.push('/providers'); return; }
  }, [accessToken, user, router]);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/providers?status=online');
        if (res.ok) {
          const data = await res.json();
          setProviders(data.providers || []);
        } else { setError('Failed to load providers'); }
      } catch { setError('Failed to load providers'); }
      finally { setLoading(false); }
    }
    fetchProviders();

    // Poll every 5 minutes for provider status updates
    const intervalId = setInterval(() => {
      fetchProviders();
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  const fetchJobs = async (showLoading = false) => {
    if (!accessToken) return;
    if (showLoading) setJobsLoading(true);
    try {
      const res = await fetch('/api/jobs', { headers: { Authorization: `Bearer ${accessToken}` } });
      if (res.ok) {
        const data = await res.json();
        const sortedJobs = (data.jobs || []).sort((a: Job, b: Job) => {
          const aDate = a.finished_at ? new Date(a.finished_at) : new Date(a.submitted_at);
          const bDate = b.finished_at ? new Date(b.finished_at) : new Date(b.submitted_at);
          return bDate.getTime() - aDate.getTime();
        });
        setJobs(sortedJobs);
        setLastJobsUpdate(new Date());
        setJobsError(null);
      } else { setJobsError('Failed to fetch jobs'); }
    } catch { setJobsError('Failed to fetch jobs'); }
    finally { setJobsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'jobs' || activeTab === 'dashboard') fetchJobs(true);
  }, [activeTab, accessToken]);

  useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === 'queued' || j.status === 'running');
    if ((activeTab === 'jobs' || activeTab === 'dashboard') && accessToken) {
      const interval = setInterval(() => {
        fetchJobs();
      }, hasActiveJobs ? 30000 : 300000); // 30s if active jobs, 5 min otherwise

      return () => clearInterval(interval);
    }
  }, [activeTab, accessToken, jobs]);

  const handleOpenJobModal = (provider: Provider, nodeId: string) => {
    const node = provider.nodes.find(n => n.node_id === nodeId);
    if (!node || node.status !== 'online') {
      alert('This node is no longer online. Please refresh the page or select a different node.');
      return;
    }
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
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (res.ok) {
        setShowJobModal(false);
        setActiveTab('jobs');
        fetchJobs(true);
      } else {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to submit job');
      }
    } catch (err: any) { setSubmitError(err.message || 'Failed to submit job'); }
    finally { setSubmitting(false); }
  };

  const totalProviders = providers.length;
  const totalOnlineNodes = providers.reduce((sum, p) => sum + p.online_nodes_count, 0);
  const runningJobs = jobs.filter(j => j.status === 'running').length;
  const completedJobs = jobs.filter(j => j.status === 'succeeded').length;

  if (!accessToken) return <div className="app-shell min-h-screen flex items-center justify-center text-[var(--lp-secondary)] text-sm">Please sign in.</div>;
  if (!user) return <div className="app-shell min-h-screen flex items-center justify-center text-[var(--lp-secondary)] text-sm">Loading user&hellip;</div>;
  if (user.role !== 'consumer') return <div className="app-shell min-h-screen flex items-center justify-center text-[var(--lp-secondary)] text-sm">Only consumers can access this page.</div>;

  const initials = (user.display_name || user.email || 'U').slice(0, 2).toUpperCase();
  const tabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      succeeded: 'bg-emerald-50 text-emerald-700',
      failed: 'bg-red-50 text-red-700',
      running: 'bg-blue-50 text-blue-700',
      queued: 'bg-amber-50 text-amber-700',
      canceled: 'bg-gray-100 text-[var(--lp-dim)]',
    };
    return map[status] || 'bg-gray-100 text-[var(--lp-dim)]';
  };

  return (
    <div className="app-shell min-h-screen flex">
      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div className="p-6 flex-1 flex flex-col">
          <Link href="/" className="flex items-center gap-2.5 mb-10 group">
            <div className="h-9 w-9 rounded-xl bg-[var(--lp-ink)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <span className="text-[10px] font-bold text-[var(--lp-bg)] font-serif">CX</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">ComputeX</span>
          </Link>

          <div className="section-label mb-3">Overview</div>
          <nav className="space-y-1 mb-8">
            {[
              { key: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
              { key: 'marketplace', icon: icons.search, label: 'Find Providers' },
              { key: 'jobs', icon: icons.briefcase, label: 'My Jobs' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`sidebar-link ${activeTab === item.key ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
                {item.key === 'jobs' && runningJobs > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                    {runningJobs}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="section-label mb-3">Account</div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('settings')}
              className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            >
              {icons.settings}
              Settings
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-[var(--lp-border)]">
            <button
              onClick={() => { clear(); router.push('/'); }}
              className="sidebar-link !text-red-500 hover:!bg-red-50"
            >
              {icons.logout}
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-[var(--lp-border)] px-8 h-[72px] flex items-center justify-between lp-fade">
          <div>
            <h1 className="font-serif text-[1.75rem] leading-tight">{tabInfo.title}</h1>
            <p className="text-[13px] text-[var(--lp-secondary)] mt-0.5">{tabInfo.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[var(--lp-dim)]">{user.email}</span>
            <div className="w-8 h-8 rounded-full bg-[var(--lp-surface)] flex items-center justify-center text-[12px] font-semibold text-[var(--lp-secondary)]">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8" key={activeTab}>

          {/* ── Dashboard Tab ── */}
          {activeTab === 'dashboard' && (
            <div className="tab-content">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                  { label: 'Providers Online', value: totalProviders, sub: `${totalOnlineNodes} nodes available`, icon: icons.globe },
                  { label: 'Active Jobs', value: runningJobs, sub: 'Currently running', icon: icons.zap },
                  { label: 'Completed', value: completedJobs, sub: 'Successfully finished', icon: icons.chart },
                  { label: 'Total Jobs', value: jobs.length, sub: 'All time submissions', icon: icons.briefcase },
                ].map((stat, i) => (
                  <div key={stat.label} className={`ip-stat p-6 lp-reveal lp-d${i + 1}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)]">{stat.label}</div>
                      <div className="w-9 h-9 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="font-serif text-[2rem] leading-none">{stat.value}</div>
                    <div className="text-[12px] text-[var(--lp-dim)] mt-2">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Profile Card */}
              <div className="ip-card p-7 mb-6 lp-reveal lp-d5">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-secondary)]">
                    {icons.user}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-[17px] mb-0.5">
                      {user?.display_name || user?.email?.split('@')[0] || 'Consumer'}
                    </h2>
                    <p className="text-[13px] text-[var(--lp-dim)]">
                      {runningJobs} active &middot; {completedJobs} completed &middot; {jobs.length} total jobs
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="btn-primary btn-sm"
                  >
                    Find a Provider {icons.arrow}
                  </button>
                </div>
              </div>

              {/* Recent Completed Jobs */}
              <div className="ip-card-static overflow-hidden lp-reveal lp-d6">
                <div className="px-7 py-5 border-b border-[var(--lp-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-[16px]">Recent Jobs</h3>
                    {jobs.some(j => j.status === 'queued' || j.status === 'running') && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-full">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                        Auto-updating
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {lastJobsUpdate && (
                      <span className="text-[11px] text-[var(--lp-dim)]">
                        Updated {lastJobsUpdate.toLocaleTimeString()}
                      </span>
                    )}
                    <button onClick={() => fetchJobs(true)} className="text-[var(--lp-dim)] hover:text-[var(--lp-ink)] transition-colors" title="Refresh">
                      <span className={jobsLoading ? 'animate-spin inline-block' : ''}>{icons.refresh}</span>
                    </button>
                    <button onClick={() => setActiveTab('jobs')} className="text-[13px] text-[var(--lp-accent)] font-medium hover:underline">
                      View All
                    </button>
                  </div>
                </div>

                {jobs.length === 0 ? (
                  <div className="px-7 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center mx-auto mb-4 text-[var(--lp-dim)]">
                      {icons.briefcase}
                    </div>
                    <p className="text-[var(--lp-secondary)] text-[15px] mb-1">No jobs submitted yet</p>
                    <p className="text-[var(--lp-dim)] text-[13px]">Submit your first GPU compute job to get started</p>
                  </div>
                ) : (
                  <div>
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="ip-row flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                          {icons.file}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[14px] truncate">{job.title}</h4>
                          <div className="flex items-center gap-3 text-[12px] text-[var(--lp-dim)]">
                            <span>{new Date(job.submitted_at).toLocaleDateString()}</span>
                            {(job.status === 'succeeded' || job.status === 'failed') && job.started_at && job.finished_at && (
                              <span className="flex items-center gap-1">
                                {icons.clock}
                                {formatDuration(job.started_at, job.finished_at)}
                              </span>
                            )}
                            {job.status === 'running' && job.started_at && (
                              <span className="flex items-center gap-1 text-blue-600">
                                {icons.clock}
                                {getElapsedTime(job.started_at)} elapsed
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`ip-badge ${statusBadge(job.status)}`}>
                          {job.status === 'running' ? 'in-progress' : job.status}
                        </span>
                        {job.status === 'succeeded' && (
                          <button
                            onClick={() => router.push(`/billing/${job.id}`)}
                            className="btn-primary btn-sm"
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Marketplace Tab ── */}
          {activeTab === 'marketplace' && (
            <div className="tab-content">
              {loading && (
                <div className="text-center py-16 text-[var(--lp-secondary)]">Loading providers&hellip;</div>
              )}
              {error && (
                <div className="text-center py-16 text-red-600">{error}</div>
              )}
              {!loading && !error && providers.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center mx-auto mb-4 text-[var(--lp-dim)]">
                    {icons.globe}
                  </div>
                  <p className="text-[var(--lp-secondary)]">No online providers found.</p>
                  <p className="text-[var(--lp-dim)] text-[13px] mt-1">Check back soon &mdash; providers come online regularly.</p>
                </div>
              )}
              {!loading && !error && providers.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {providers.map((provider, pi) => (
                    <div key={provider.provider_id} className={`ip-card p-6 lp-reveal lp-d${Math.min(pi + 1, 8)}`}>
                      {/* Provider Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                            {icons.user}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[15px]">
                              {provider.provider_display_name || provider.provider_email.split('@')[0]}
                            </h3>
                            {provider.company_name && (
                              <p className="text-[12px] text-[var(--lp-dim)]">{provider.company_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-[13px]">
                            {icons.star}
                            <span className="font-medium">{provider.rating.average.toFixed(1)}</span>
                            <span className="text-[var(--lp-dim)]">({provider.rating.count})</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                            <span className="text-[11px] text-emerald-600 font-medium">{provider.online_nodes_count} online</span>
                          </div>
                        </div>
                      </div>

                      {/* Nodes */}
                      <div className="space-y-3">
                        {provider.nodes.filter(node => node.status === 'online').map((node) => (
                          <div key={node.node_id} className="border border-[var(--lp-border)] rounded-xl p-4 hover:border-[var(--lp-accent)] transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--lp-dim)]">{icons.gpu}</span>
                                <h4 className="font-medium text-[14px]">{node.name || 'Unnamed Node'}</h4>
                              </div>
                              <span className="text-[11px] font-medium text-[var(--lp-dim)] bg-[var(--lp-surface)] px-2 py-0.5 rounded-full">
                                {node.region}
                              </span>
                            </div>

                            {node.specs?.gpus && (
                              <div className="space-y-1.5 mb-4">
                                {node.specs.gpus.map((gpu, index) => (
                                  <div key={index} className="flex items-center justify-between text-[13px]">
                                    <span className="text-[var(--lp-secondary)]">{gpu.model} &middot; {gpu.vram_gb}GB</span>
                                    <span className="font-semibold text-[var(--lp-accent)]">
                                      ${(gpu.hourly_price_cents / 100).toFixed(2)}<span className="text-[var(--lp-dim)] font-normal">/hr</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => handleOpenJobModal(provider, node.node_id)}
                              className="w-full py-2.5 bg-[var(--lp-ink)] text-white text-[13px] font-medium rounded-xl hover:bg-[var(--lp-ink)]/90 transition-colors flex items-center justify-center gap-2"
                            >
                              {icons.zap}
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

          {/* ── Jobs Tab ── */}
          {activeTab === 'jobs' && (
            <div className="tab-content">
              <div className="ip-card-static overflow-hidden">
                <div className="px-7 py-5 border-b border-[var(--lp-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-[16px]">All Jobs</h2>
                    {jobs.some(j => j.status === 'queued' || j.status === 'running') && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-full">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                        Auto-updating every 3s
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {lastJobsUpdate && (
                      <span className="text-[11px] text-[var(--lp-dim)]">
                        Last updated: {lastJobsUpdate.toLocaleTimeString()}
                      </span>
                    )}
                    <button
                      onClick={() => fetchJobs(true)}
                      disabled={jobsLoading}
                      className="btn-secondary btn-sm disabled:opacity-50"
                    >
                      <span className={jobsLoading ? 'animate-spin inline-block' : ''}>{icons.refresh}</span>
                      Refresh
                    </button>
                  </div>
                </div>

                {jobsError && <div className="px-7 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{jobsError}</div>}

                {jobs.length === 0 && !jobsLoading ? (
                  <div className="px-7 py-16 text-center text-[var(--lp-secondary)]">No jobs submitted yet.</div>
                ) : (
                  <div>
                    {jobs.map((job) => (
                      <div key={job.id} className="ip-row">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[14px] mb-1">{job.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--lp-dim)]">
                              <span>Submitted: {new Date(job.submitted_at).toLocaleString()}</span>
                              {job.started_at && <span>Started: {new Date(job.started_at).toLocaleString()}</span>}
                              {job.finished_at && <span>Finished: {new Date(job.finished_at).toLocaleString()}</span>}
                            </div>

                            {(job.status === 'succeeded' || job.status === 'failed') && job.started_at && job.finished_at && (
                              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-[var(--lp-surface)] text-[var(--lp-secondary)] text-[11px] rounded-lg">
                                {icons.clock}
                                Duration: <strong>{formatDuration(job.started_at, job.finished_at)}</strong>
                              </div>
                            )}

                            {job.status === 'running' && job.started_at && (
                              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] rounded-lg">
                                {icons.clock}
                                Elapsed: <strong>{getElapsedTime(job.started_at)}</strong>
                              </div>
                            )}

                            {job.failure_reason && (
                              <div className="text-[12px] text-red-600 mt-1">Error: {job.failure_reason}</div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`ip-badge ${statusBadge(job.status)}`}>
                              {job.status === 'running' ? 'in-progress' : job.status}
                            </span>
                            {job.status === 'succeeded' && (
                              <button
                                onClick={() => router.push(`/billing/${job.id}`)}
                                className="btn-primary btn-sm"
                              >
                                View Results
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Settings Tab ── */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="ip-card-static p-8">
                <h2 className="font-semibold text-[17px] mb-6">Account Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Email', value: user.email },
                    { label: 'Display Name', value: user.display_name || '-' },
                    { label: 'Role', value: user.role, capitalize: true },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">{field.label}</label>
                      <div className={`text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5 ${field.capitalize ? 'capitalize' : ''}`}>
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Job Submission Modal ── */}
      {showJobModal && (
        <div className="ip-modal-overlay">
          <div className="ip-modal p-8 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-[1.4rem]">Submit Job</h3>
              <button onClick={() => setShowJobModal(false)} className="text-[var(--lp-dim)] hover:text-[var(--lp-ink)] transition-colors">
                {icons.close}
              </button>
            </div>

            <form onSubmit={handleSubmitJob} className="space-y-5">
              <div>
                <label className="block text-[13px] font-medium text-[var(--lp-secondary)] mb-1.5">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full border border-[var(--lp-border)] rounded-xl px-4 py-2.5 text-[14px] focus:ring-2 focus:ring-[var(--lp-accent)] focus:border-transparent outline-none transition-shadow"
                  placeholder="e.g. Render Scene 1"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--lp-secondary)] mb-1.5">Blend File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setJobFile(e.target.files?.[0] || null)}
                  className="w-full text-[13px] text-[var(--lp-dim)] file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-[13px] file:font-medium file:bg-[var(--lp-surface)] file:text-[var(--lp-secondary)] hover:file:bg-[var(--lp-border)] file:transition-colors file:cursor-pointer"
                  accept=".blend,.zip"
                />
                <p className="text-[11px] text-[var(--lp-dim)] mt-1.5">Supported formats: .blend, .zip &middot; Max 500 MB</p>
              </div>

              {submitError && (
                <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">{submitError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowJobModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Submitting...' : 'Submit Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
