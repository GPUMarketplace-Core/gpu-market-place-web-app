'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Icons (matching landing page style) ─── */
const icons = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  briefcase: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M2 13h20"/></svg>,
  dollar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  star: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starFilled: <svg width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  book: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  gpu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><rect x="6.5" y="8" width="11" height="8" rx="1.5"/><line x1="9.5" y1="8" x2="9.5" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="14.5" y1="8" x2="14.5" y2="16"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  download: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  chevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon"><polyline points="6 9 12 15 18 9"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8h9M8.5 4l4 4-4 4"/></svg>,
  mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  help: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  monitor: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  wifi: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>,
  memory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16"/></svg>,
};

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Manage your nodes, jobs, and provider performance' },
  jobs: { title: 'Jobs', subtitle: 'View and manage all compute jobs on your nodes' },
  earnings: { title: 'Earnings', subtitle: 'Track your revenue, payouts, and performance metrics' },
  reviews: { title: 'Reviews', subtitle: 'See what consumers are saying about your service' },
  knowledge: { title: 'Knowledge Base', subtitle: 'Set up your provider agent and start earning' },
  settings: { title: 'Settings', subtitle: 'Manage your account and payout configuration' },
};

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

    // Poll every 5 minutes for node status updates
    const intervalId = setInterval(() => {
      fetchNodes();
    }, 300000); // 5 minutes

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
    return <div className="app-shell min-h-screen flex items-center justify-center text-[var(--lp-secondary)] text-sm">Please sign in.</div>;
  }

  if (!user) {
    return <div className="app-shell min-h-screen flex items-center justify-center text-[var(--lp-secondary)] text-sm">Loading user&hellip;</div>;
  }

  if (user.role !== 'provider') {
    return <div className="app-shell min-h-screen flex items-center justify-center text-[var(--lp-secondary)] text-sm">Only providers have a profile.</div>;
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

  const initials = (user.display_name || user.email || 'P').slice(0, 2).toUpperCase();
  const tabInfo = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      succeeded: 'bg-emerald-50 text-emerald-700',
      failed: 'bg-red-50 text-red-700',
      running: 'bg-blue-50 text-blue-700',
      queued: 'bg-amber-50 text-amber-700',
      canceled: 'bg-gray-100 text-[var(--lp-dim)]',
      online: 'bg-emerald-50 text-emerald-700',
      offline: 'bg-red-50 text-red-700',
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
              <span className="text-[10px] font-bold text-[var(--lp-bg)] font-serif">OG</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">OpenGPU</span>
          </Link>

          <div className="section-label mb-3">Overview</div>
          <nav className="space-y-1 mb-8">
            {[
              { key: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
              { key: 'jobs', icon: icons.briefcase, label: 'Jobs' },
              { key: 'earnings', icon: icons.dollar, label: 'Earnings' },
              { key: 'reviews', icon: icons.star, label: 'Reviews' },
              { key: 'knowledge', icon: icons.book, label: 'Knowledge Base' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`sidebar-link ${activeTab === item.key ? 'active' : ''}`}
              >
                {item.icon}
                {item.label}
                {item.key === 'jobs' && processingJobs > 0 && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                    {processingJobs}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="section-label mb-3">Settings</div>
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
                  { label: 'Total Nodes', value: nodes.length, sub: `${nodes.filter(n => n.status === 'online').length} online`, icon: icons.gpu },
                  { label: 'Processing', value: processingJobs, sub: 'Running & queued jobs', icon: icons.zap },
                  { label: 'Completed', value: completedJobs, sub: 'Successfully finished', icon: icons.chart },
                  { label: 'Total Jobs', value: jobs.length, sub: 'All time received', icon: icons.briefcase },
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
                      {provider?.display_name || user?.email?.split('@')[0] || 'Provider'}
                    </h2>
                    <p className="text-[13px] text-[var(--lp-dim)]">
                      Processing: {processingJobs} &middot; Completed: {completedJobs}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {reviewsSummary ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[13px]">
                          {icons.starFilled}
                          <span className="font-medium">{reviewsSummary.avgRating.toFixed(1)}</span>
                          <span className="text-[var(--lp-dim)]">({reviewsSummary.reviewCount})</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[var(--lp-dim)]">No reviews yet</span>
                    )}
                    <button
                      onClick={() => setActiveTab('knowledge')}
                      className="btn-primary btn-sm"
                    >
                      Get Started {icons.arrow}
                    </button>
                  </div>
                </div>
              </div>

              {/* My Nodes */}
              <div className="ip-card-static overflow-hidden mb-6 lp-reveal lp-d6">
                <div className="px-7 py-5 border-b border-[var(--lp-border)] flex items-center justify-between">
                  <h3 className="font-semibold text-[16px]">My Nodes</h3>
                  <span className="text-[12px] text-[var(--lp-dim)]">{nodes.length} registered</span>
                </div>
                {nodesError && <div className="px-7 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{nodesError}</div>}
                {nodes.length === 0 ? (
                  <div className="px-7 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center mx-auto mb-4 text-[var(--lp-dim)]">
                      {icons.gpu}
                    </div>
                    <p className="text-[var(--lp-secondary)] text-[15px] mb-1">No nodes registered yet</p>
                    <p className="text-[var(--lp-dim)] text-[13px]">Download the provider agent to register your first node</p>
                  </div>
                ) : (
                  <div>
                    {nodes.map((node) => (
                      <div key={node.id} className="ip-row flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                          {icons.gpu}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-[14px]">{node.name || 'Unnamed Node'}</h4>
                            <span className={`ip-badge ${statusBadge(node.status)}`}>{node.status}</span>
                            {node.has_pricing ? (
                              <span className="ip-badge bg-blue-50 text-blue-700">Pricing Set</span>
                            ) : (
                              <span className="ip-badge bg-gray-100 text-[var(--lp-dim)]">No Pricing</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--lp-dim)]">
                            <span>Region: {node.region || 'Unknown'}</span>
                            <span>OS: {node.os || 'Unknown'}</span>
                            <span>GPUs: {node.gpu_count}</span>
                            <span>Created: {new Date(node.created_at).toLocaleDateString()}</span>
                          </div>
                          {node.specs?.gpus && (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                              {node.specs.gpus.map((gpu: any, index: number) => (
                                <span key={index} className="text-[var(--lp-secondary)]">
                                  {gpu.model}: {gpu.hourly_price_cents > 0 ? (
                                    <span className="font-semibold text-[var(--lp-accent)]">${(gpu.hourly_price_cents / 100).toFixed(2)}/hr</span>
                                  ) : (
                                    <span className="text-[var(--lp-dim)]">No pricing</span>
                                  )}
                                </span>
                              ))}
                              {node.has_pricing && (
                                <span className="font-semibold text-emerald-600">
                                  Total: ${(node.specs.gpus.reduce((sum: number, gpu: any) => sum + (gpu.hourly_price_cents || 0), 0) / 100).toFixed(2)}/hr
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setPricingModal({ show: true, node })}
                          disabled={!node.specs || node.gpu_count === 0}
                          className="btn-primary btn-sm disabled:opacity-50"
                        >
                          Update Pricing
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job History */}
              <div className="ip-card-static overflow-hidden lp-reveal lp-d7">
                <div className="px-7 py-5 border-b border-[var(--lp-border)] flex items-center justify-between">
                  <h3 className="font-semibold text-[16px]">Recent Jobs</h3>
                  <button onClick={() => setActiveTab('jobs')} className="text-[13px] text-[var(--lp-accent)] font-medium hover:underline">
                    View All
                  </button>
                </div>
                {jobs.length === 0 ? (
                  <div className="px-7 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center mx-auto mb-4 text-[var(--lp-dim)]">
                      {icons.briefcase}
                    </div>
                    <p className="text-[var(--lp-secondary)] text-[15px] mb-1">No jobs received yet</p>
                    <p className="text-[var(--lp-dim)] text-[13px]">Jobs will appear here once consumers submit work to your nodes</p>
                  </div>
                ) : (
                  <div>
                    {jobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="ip-row flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                          {icons.file}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[14px] truncate">{job.title}</h4>
                          <span className="text-[12px] text-[var(--lp-dim)]">{new Date(job.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`ip-badge ${statusBadge(job.status)}`}>{job.status}</span>
                        <button
                          onClick={() => setJobDetailsModal({ show: true, job })}
                          className="btn-secondary btn-sm"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Jobs Tab ── */}
          {activeTab === 'jobs' && (
            <div className="tab-content">
              <div className="ip-card-static overflow-hidden">
                <div className="px-7 py-5 border-b border-[var(--lp-border)] flex items-center justify-between">
                  <h3 className="font-semibold text-[16px]">All Jobs</h3>
                  <span className="text-[12px] text-[var(--lp-dim)]">{jobs.length} total</span>
                </div>
                {jobsError && <div className="px-7 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{jobsError}</div>}
                {jobs.length === 0 ? (
                  <div className="px-7 py-16 text-center text-[var(--lp-secondary)]">No jobs yet.</div>
                ) : (
                  <div>
                    {jobs.map((job, i) => (
                      <div key={job.id} className={`ip-row lp-reveal lp-d${Math.min(i + 1, 8)}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[14px] mb-1">{job.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--lp-dim)]">
                              <span>Submitted: {new Date(job.submitted_at).toLocaleDateString()}</span>
                              {job.started_at && (
                                <span>Started: {new Date(job.started_at).toLocaleDateString()}</span>
                              )}
                              {job.finished_at && (
                                <span>Finished: {new Date(job.finished_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`ip-badge ${statusBadge(job.status)}`}>{job.status}</span>
                            <button
                              onClick={() => setJobDetailsModal({ show: true, job })}
                              className="btn-primary btn-sm"
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
            </div>
          )}

          {/* ── Earnings Tab ── */}
          {activeTab === 'earnings' && (
            <div className="tab-content">
              {earningsLoading && (
                <div className="text-center py-16 text-[var(--lp-secondary)]">Loading earnings&hellip;</div>
              )}
              {earningsError && (
                <div className="text-center py-4 text-red-600 text-sm">{earningsError}</div>
              )}

              {earnings && (
                <>
                  {/* Top stat cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    <div className="ip-stat-accent p-6 lp-reveal lp-d1">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-2">Total Potential</div>
                      <div className="font-serif text-[2rem] leading-none">${potentialHourlyEarnings.toFixed(2)}/hr</div>
                      <div className="text-[12px] text-white/60 mt-2">From {nodes.length} node{nodes.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="ip-stat-accent p-6 lp-reveal lp-d2">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-2">This Month</div>
                      <div className="font-serif text-[2rem] leading-none">${(earnings.summary.providerEarningsCents / 100).toFixed(2)}</div>
                      <div className="text-[12px] text-white/60 mt-2">
                        Platform fees: ${(earnings.summary.platformFeesCents / 100).toFixed(2)}
                      </div>
                      {typeof earnings.summary.monthOverMonthChangePct === 'number' && (
                        <div className="text-[11px] text-white/50 mt-1">
                          {earnings.summary.monthOverMonthChangePct >= 0 ? '+' : ''}
                          {earnings.summary.monthOverMonthChangePct.toFixed(1)}% vs last month
                        </div>
                      )}
                    </div>
                    <div className="ip-stat-accent p-6 lp-reveal lp-d3">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-2">Total Earned</div>
                      <div className="font-serif text-[2rem] leading-none">${(earnings.lifetime.providerEarningsCents / 100).toFixed(2)}</div>
                      <div className="text-[12px] text-white/60 mt-2">
                        Gross volume: ${(earnings.lifetime.grossRevenueCents / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Daily earnings chart */}
                  <div className="ip-card-static p-7 mb-8 lp-reveal lp-d4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-[16px]">Daily Earnings (This Month)</h3>
                      <span className="text-[12px] text-[var(--lp-dim)]">
                        {earnings.daily.length} day{earnings.daily.length === 1 ? '' : 's'} with payouts
                      </span>
                    </div>
                    {earnings.daily.length === 0 ? (
                      <div className="text-[13px] text-[var(--lp-secondary)]">No captured payments yet this month.</div>
                    ) : (
                      <div className="flex items-end gap-1.5 h-40">
                        {earnings.daily.map((d: any) => {
                          const maxEarnings = Math.max(1, Math.max(...earnings.daily.map((x: any) => x.providerEarningsCents || 0)));
                          const pct = (d.providerEarningsCents / maxEarnings) * 100;
                          return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group">
                              <div className="text-[10px] text-[var(--lp-dim)] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                ${(d.providerEarningsCents / 100).toFixed(2)}
                              </div>
                              <div
                                className="ip-bar w-full"
                                style={{ height: `${Math.max(4, pct)}%` }}
                                title={`${new Date(d.day).toLocaleDateString()}: $${(d.providerEarningsCents / 100).toFixed(2)}`}
                              />
                              <div className="text-[9px] text-[var(--lp-dim)] mt-1 truncate max-w-[40px]">
                                {new Date(d.day).toLocaleDateString(undefined, { day: 'numeric' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lp-reveal lp-d5">
                    <div className="ip-stat p-6">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)] mb-2">Paid Jobs</div>
                      <div className="font-serif text-[2rem] leading-none">{earnings.summary.paidJobs}</div>
                      <div className="text-[12px] text-[var(--lp-dim)] mt-2">Jobs with captured payments this month</div>
                    </div>
                    <div className="ip-stat p-6">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)] mb-2">Paid Orders</div>
                      <div className="font-serif text-[2rem] leading-none">{earnings.summary.paidOrders}</div>
                      <div className="text-[12px] text-[var(--lp-dim)] mt-2">Some orders may contain multiple jobs</div>
                    </div>
                    <div className="ip-stat p-6">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)] mb-2">Platform Take Rate</div>
                      <div className="font-serif text-[2rem] leading-none">
                        {earnings.summary.grossRevenueCents > 0
                          ? `${((earnings.summary.platformFeesCents / earnings.summary.grossRevenueCents) * 100).toFixed(1)}%`
                          : '\u2014'}
                      </div>
                      <div className="text-[12px] text-[var(--lp-dim)] mt-2">Fees as a share of total customer spend this month</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Reviews Tab ── */}
          {activeTab === 'reviews' && (
            <div className="tab-content">
              {reviewsLoading && (
                <div className="text-center py-16 text-[var(--lp-secondary)]">Loading reviews&hellip;</div>
              )}
              {reviewsError && (
                <div className="text-center py-4 text-red-600 text-sm">{reviewsError}</div>
              )}

              {reviewsSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="ip-stat-accent p-6 lp-reveal lp-d1">
                    <div className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-2">Average Rating</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-[2.5rem] leading-none">{reviewsSummary.avgRating.toFixed(2)}</span>
                      <span className="text-[16px] text-white/60">/ 5</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={idx < Math.round(reviewsSummary.avgRating) ? 'text-amber-400' : 'text-white/30'}
                          style={{ fontSize: '16px' }}
                        >
                          &#9733;
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ip-stat-accent p-6 lp-reveal lp-d2">
                    <div className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-2">Total Reviews</div>
                    <div className="font-serif text-[2.5rem] leading-none">{reviewsSummary.reviewCount}</div>
                    <div className="text-[12px] text-white/60 mt-3">
                      Last review: {reviewsSummary.lastReviewAt ? new Date(reviewsSummary.lastReviewAt).toLocaleDateString() : '\u2014'}
                    </div>
                  </div>
                </div>
              )}

              <div className="ip-card-static overflow-hidden lp-reveal lp-d3">
                <div className="px-7 py-5 border-b border-[var(--lp-border)]">
                  <h3 className="font-semibold text-[16px]">Customer Reviews</h3>
                </div>
                {reviews.length === 0 && !reviewsLoading ? (
                  <div className="px-7 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--lp-surface)] flex items-center justify-center mx-auto mb-4 text-[var(--lp-dim)]">
                      {icons.star}
                    </div>
                    <p className="text-[var(--lp-secondary)] text-[15px] mb-1">No reviews yet</p>
                    <p className="text-[var(--lp-dim)] text-[13px]">Once consumers complete jobs and leave feedback, their comments will appear here.</p>
                  </div>
                ) : (
                  <div>
                    {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                      <div key={review.id} className="ip-row">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-[14px]">
                                {review.consumerDisplayName || review.consumerEmail?.split('@')[0] || 'Customer'}
                              </span>
                              <span className="text-[12px] text-[var(--lp-dim)]">{review.consumerEmail}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={idx < review.rating ? 'text-amber-400' : 'text-gray-300'}
                                  style={{ fontSize: '14px' }}
                                >
                                  &#9733;
                                </span>
                              ))}
                              <span className="ml-2 text-[12px] text-[var(--lp-dim)]">{review.rating}/5</span>
                            </div>
                            {review.comment && (
                              <p className="text-[13px] text-[var(--lp-secondary)]">{review.comment}</p>
                            )}
                          </div>
                          <div className="text-right text-[11px] text-[var(--lp-dim)] whitespace-nowrap shrink-0">
                            {review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}
                            <div className="mt-1 font-mono text-[10px]">
                              Order: {review.orderId}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {reviews.length > 3 && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllReviews((prev) => !prev)}
                    className="btn-secondary"
                  >
                    {showAllReviews ? 'Show Less' : 'View All Reviews'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Knowledge Base Tab ── */}
          {activeTab === 'knowledge' && (
            <div className="tab-content space-y-8">
              {/* Hero - Download Section */}
              <div className="ip-dark-section p-8 md:p-12 lp-reveal lp-d1">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-[13px] font-medium mb-4">
                      {icons.zap}
                      Quick Start Guide
                    </div>
                    <h2 className="font-serif text-[2rem] md:text-[2.5rem] text-white mb-4">
                      OpenGPU Provider Agent
                    </h2>
                    <p className="text-[15px] text-white/70 mb-6 max-w-xl">
                      Transform your Windows machine into a GPU computing powerhouse. Start earning by sharing your GPU resources with the OpenGPU network.
                    </p>
                    <a
                      href="https://github.com/GPUMarketplace-Core/providers-agent/releases/latest/download/GPU.Marketplace.Provider.Setup.1.0.0.exe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center gap-3 px-8 py-4 text-[15px]"
                    >
                      {icons.download}
                      Download for Windows
                      <span className="text-[12px] font-normal text-white/60 ml-1">v1.0.0</span>
                    </a>
                    <p className="text-white/40 text-[12px] mt-3">Windows 10/11 • 64-bit • ~405 MB</p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-40 h-40 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <rect x="8" y="8" width="8" height="8" rx="1"/>
                        <line x1="4" y1="2" x2="4" y2="4"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="16" y1="2" x2="16" y2="4"/><line x1="20" y1="2" x2="20" y2="4"/>
                        <line x1="4" y1="20" x2="4" y2="22"/><line x1="8" y1="20" x2="8" y2="22"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="16" y1="20" x2="16" y2="22"/><line x1="20" y1="20" x2="20" y2="22"/>
                        <line x1="2" y1="4" x2="4" y2="4"/><line x1="2" y1="8" x2="4" y2="8"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="2" y1="16" x2="4" y2="16"/><line x1="2" y1="20" x2="4" y2="20"/>
                        <line x1="20" y1="4" x2="22" y2="4"/><line x1="20" y1="8" x2="22" y2="8"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="20" y1="16" x2="22" y2="16"/><line x1="20" y1="20" x2="22" y2="20"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installation Steps */}
              <div className="lp-reveal lp-d2">
                <h3 className="font-serif text-[1.5rem] mb-6 flex items-center gap-3">
                  Installation Guide
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Step 1 */}
                  <div className="ip-card p-6 flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[var(--lp-accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-lg font-serif">1</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[15px] mb-2">Download the Installer</h4>
                      <p className="text-[13px] text-[var(--lp-secondary)] mb-3">
                        Click the download button above to get the OpenGPU Provider Agent installer. The file will be saved to your Downloads folder.
                      </p>
                      <div className="flex items-center gap-2 text-[12px] text-[var(--lp-accent)]">
                        {icons.info}
                        <span>File: GPU.Marketplace.Provider.Setup.1.0.0.exe</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="ip-card p-6 flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[var(--lp-accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-lg font-serif">2</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[15px] mb-2">Run the Installer</h4>
                      <p className="text-[13px] text-[var(--lp-secondary)] mb-3">
                        Double-click the downloaded file to launch the installation wizard. Follow the on-screen prompts to complete the installation.
                      </p>
                      <div className="bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-amber-500 mt-0.5">{icons.warning}</span>
                          <div className="text-[13px] text-[var(--lp-secondary)]">
                            <span className="font-medium">Windows SmartScreen:</span> If Windows shows a security warning, click &quot;More info&quot; &rarr; &quot;Run anyway&quot; to proceed with the installation.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="ip-card p-6 flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[var(--lp-accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-lg font-serif">3</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[15px] mb-2">Get Your Provider Agent Token</h4>
                      <p className="text-[13px] text-[var(--lp-secondary)] mb-3">
                        Navigate to the <button onClick={() => setActiveTab('settings')} className="text-[var(--lp-accent)] font-medium hover:underline">Settings</button> tab in this dashboard. You&apos;ll find your unique Provider Agent Token in the &quot;Provider Agent Token&quot; section.
                      </p>
                      <div className="bg-[var(--lp-ink)] rounded-xl p-4 font-mono text-[13px] overflow-x-auto">
                        <div className="flex items-center justify-between gap-4">
                          <code className="text-emerald-400 whitespace-nowrap">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code>
                          <span className="text-white/40 text-[11px] whitespace-nowrap">&larr; Your token looks like this</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="ip-card p-6 flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[var(--lp-accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-lg font-serif">4</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[15px] mb-2">Configure the Provider Agent</h4>
                      <p className="text-[13px] text-[var(--lp-secondary)] mb-3">
                        Launch the OpenGPU Provider Agent from your desktop or Start menu. Go to Settings within the client and paste your Provider Agent Token to authenticate.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[var(--lp-accent)]">{icons.settings}</span>
                            <span className="font-medium text-[13px]">Open Settings</span>
                          </div>
                          <p className="text-[12px] text-[var(--lp-dim)]">Click the gear icon in the client</p>
                        </div>
                        <div className="bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[var(--lp-accent)]">{icons.copy}</span>
                            <span className="font-medium text-[13px]">Paste Token</span>
                          </div>
                          <p className="text-[12px] text-[var(--lp-dim)]">Paste your token and save</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="ip-card p-6 flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-[var(--lp-accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-lg font-serif">5</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[15px] mb-2">Start Earning!</h4>
                      <p className="text-[13px] text-[var(--lp-secondary)] mb-3">
                        Once authenticated, click &quot;Start&quot; to begin sharing your GPU. Your node will appear on the Dashboard, and you&apos;ll start receiving jobs from consumers.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <span className="ip-badge bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                          Node Online
                        </span>
                        <span className="ip-badge bg-blue-50 text-blue-700">
                          {icons.chart}
                          Earning Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Requirements & FAQ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lp-reveal lp-d3">
                {/* System Requirements */}
                <div className="ip-card-static p-7">
                  <h3 className="font-serif text-[1.25rem] mb-6">System Requirements</h3>
                  <div className="space-y-0">
                    {[
                      { icon: icons.monitor, label: 'Operating System', value: 'Windows 10/11 (64-bit)' },
                      { icon: icons.gpu, label: 'GPU', value: 'NVIDIA GTX 1060 or higher (6GB+ VRAM)' },
                      { icon: icons.memory, label: 'RAM', value: '16GB minimum (32GB recommended)' },
                      { icon: icons.wifi, label: 'Network', value: 'Stable internet connection (50+ Mbps)' },
                    ].map((req) => (
                      <div key={req.label} className="ip-row flex items-center gap-4 !px-0">
                        <div className="w-10 h-10 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                          {req.icon}
                        </div>
                        <div>
                          <div className="font-medium text-[14px]">{req.label}</div>
                          <div className="text-[12px] text-[var(--lp-dim)]">{req.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                <div className="ip-card-static p-7">
                  <h3 className="font-serif text-[1.25rem] mb-6">Frequently Asked Questions</h3>
                  <div className="space-y-3">
                    {[
                      {
                        q: 'How do I get paid?',
                        a: 'Earnings are automatically transferred to your connected Stripe account. Set up your payout account in Settings to receive payments.',
                      },
                      {
                        q: 'Can I use my PC while providing?',
                        a: 'Yes! The agent runs in the background. However, GPU-intensive tasks may affect job performance. For best earnings, dedicate your GPU to OpenGPU.',
                      },
                      {
                        q: 'Is my data secure?',
                        a: 'Absolutely. All job data is encrypted and sandboxed. Your personal files are never accessible to jobs running on your machine.',
                      },
                      {
                        q: 'Where do I set my pricing?',
                        a: 'Once your node is online, go to the Dashboard tab and click "Update Pricing" on your node card to set hourly rates for each GPU.',
                      },
                    ].map((faq) => (
                      <details key={faq.q} className="ip-accordion">
                        <summary>
                          <span>{faq.q}</span>
                          {icons.chevronDown}
                        </summary>
                        <div className="px-5 pb-4 text-[13px] text-[var(--lp-secondary)]">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </div>

              {/* Need Help Banner */}
              <div className="ip-dark-section p-8 lp-reveal lp-d4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      {icons.help}
                    </div>
                    <div>
                      <h4 className="text-[17px] font-semibold text-white">Need Help?</h4>
                      <p className="text-[13px] text-white/60">Our support team is ready to assist you</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a href="mailto:support@opengpu.io" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                      {icons.mail}
                      Email Support
                    </a>
                    <a href="https://discord.gg/opengpu" target="_blank" rel="noopener noreferrer" className="btn-primary">
                      Join Discord
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Settings Tab ── */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="ip-card-static p-8 mb-6 lp-reveal lp-d1">
                <h2 className="font-serif text-[1.25rem] mb-6">Profile Information</h2>
                {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
                {provider ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Email', value: provider.email },
                      { label: 'Display Name', value: provider.display_name || '-' },
                      { label: 'Company', value: provider.company_name || '-' },
                      { label: 'Status', value: provider.status, capitalize: true },
                      { label: 'Rating', value: `${provider.rating_avg} (${provider.rating_count} reviews)` },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">{field.label}</label>
                        <div className={`text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5 ${field.capitalize ? 'capitalize' : ''}`}>
                          {field.value}
                        </div>
                      </div>
                    ))}

                    {/* Payout Account */}
                    <div className="md:col-span-2">
                      <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Payout Account</label>
                      <div className="bg-[var(--lp-surface)] rounded-xl p-4 border border-[var(--lp-border)]">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {provider.payout_account_id ? (
                              <div className="space-y-2">
                                <div className="text-[13px] font-mono">
                                  {showPayoutDetails ? provider.payout_account_id : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                                </div>
                                {payoutDetails && showPayoutDetails && (
                                  <div className="text-[12px] text-[var(--lp-dim)] space-y-1 mt-2 pt-2 border-t border-[var(--lp-border)]">
                                    <div>Email: {payoutDetails.email || '-'}</div>
                                    {payoutDetails.externalAccount && (
                                      <>
                                        <div>Bank: {payoutDetails.externalAccount.bankName || 'Not set'}</div>
                                        <div>Account: &bull;&bull;&bull;&bull;{payoutDetails.externalAccount.last4}</div>
                                        <div className="mt-1">
                                          <span className={`ip-badge ${payoutDetails.payoutsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {payoutDetails.payoutsEnabled ? 'Payouts Enabled' : 'Setup Incomplete'}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[13px] text-[var(--lp-secondary)]">No payout account configured</div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {provider.payout_account_id && (
                              <button
                                onClick={handleViewPayoutDetails}
                                disabled={payoutLoading}
                                className="btn-secondary btn-sm disabled:opacity-50"
                              >
                                {payoutLoading ? 'Loading...' : showPayoutDetails ? 'Hide' : 'View'}
                              </button>
                            )}
                            <button
                              onClick={handleEditPayoutAccount}
                              className="btn-primary btn-sm"
                            >
                              {provider.payout_account_id ? 'Edit' : 'Setup'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] text-[var(--lp-secondary)]">Loading profile...</div>
                )}
              </div>

              {/* Provider Agent Token */}
              <div className="ip-card-static p-8 lp-reveal lp-d2">
                <h2 className="font-serif text-[1.25rem] mb-4">Provider Agent Token</h2>
                <p className="text-[13px] text-[var(--lp-secondary)] mb-4">
                  Use this token to authenticate your Provider Agent CLI.
                  <span className="text-red-600 font-medium ml-1">Do not share this token with anyone.</span>
                </p>
                <div className="relative">
                  <div className="bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-xl p-4 font-mono text-[13px] text-[var(--lp-secondary)] break-all pr-24">
                    {accessToken}
                  </div>
                  <button
                    onClick={() => {
                      if (accessToken) {
                        navigator.clipboard.writeText(accessToken);
                        alert('Token copied to clipboard!');
                      }
                    }}
                    className="absolute top-3 right-3 btn-secondary btn-sm"
                  >
                    {icons.copy}
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Pricing Modal ── */}
      {pricingModal.show && (
        <PricingModal
          node={pricingModal.node}
          onClose={() => setPricingModal({ show: false, node: null })}
          accessToken={accessToken}
          onSuccess={() => {
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

      {/* ── Job Details Modal ── */}
      {jobDetailsModal.show && (
        <JobDetailsModal
          job={jobDetailsModal.job}
          onClose={() => setJobDetailsModal({ show: false, job: null })}
        />
      )}
    </div>
  );
}

// ── Job Details Modal ──
function JobDetailsModal({ job, onClose }: {
  job: any;
  onClose: () => void;
}) {
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
    <div className="ip-modal-overlay">
      <div className="ip-modal p-8 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-[1.4rem]">Job Details</h3>
          <button onClick={onClose} className="text-[var(--lp-dim)] hover:text-[var(--lp-ink)] transition-colors">
            {icons.close}
          </button>
        </div>

        <div className="space-y-5">
          {/* Job Title */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Job Title</label>
            <div className="text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5">{job.title}</div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Status</label>
            <span className={`ip-badge ${statusBadge(job.status)}`}>{job.status}</span>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Submitted At</label>
              <div className="text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5">
                {new Date(job.submitted_at).toLocaleString()}
              </div>
            </div>
            {job.started_at && (
              <div>
                <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Started At</label>
                <div className="text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5">
                  {new Date(job.started_at).toLocaleString()}
                </div>
              </div>
            )}
            {job.finished_at && (
              <div>
                <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Finished At</label>
                <div className="text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5">
                  {new Date(job.finished_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <label className="block text-[12px] font-medium text-[var(--lp-dim)] uppercase tracking-wider mb-1.5">Description</label>
              <div className="text-[14px] bg-[var(--lp-surface)] rounded-xl p-3.5">{job.description}</div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-[var(--lp-accent)] mt-0.5">{icons.info}</span>
              <div className="text-[13px] text-[var(--lp-secondary)]">
                <p className="font-medium mb-1">Provider Information</p>
                <p>This view shows job details from the provider perspective. Consumer personal information is not displayed for privacy reasons.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pricing Modal ──
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
      <div className="ip-modal-overlay">
        <div className="ip-modal p-8 w-full max-w-md mx-4">
          <h3 className="font-serif text-[1.4rem] mb-4">Update Pricing</h3>
          <p className="text-[13px] text-red-600 mb-4">No GPU specifications found for this node. Please add node specs first.</p>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ip-modal-overlay">
      <div className="ip-modal p-8 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-[1.4rem]">Update Pricing &mdash; {node.name || 'Unnamed Node'}</h3>
          <button onClick={onClose} className="text-[var(--lp-dim)] hover:text-[var(--lp-ink)] transition-colors">
            {icons.close}
          </button>
        </div>

        {error && (
          <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {node.specs.gpus.map((gpu: any, index: number) => (
            <div key={index} className="bg-[var(--lp-surface)] border border-[var(--lp-border)] rounded-xl p-5">
              <div className="font-semibold text-[14px] mb-1">GPU {index + 1}</div>
              <div className="text-[13px] text-[var(--lp-dim)] mb-3">
                Model: {gpu.model || 'Unknown'} &middot; Memory: {gpu.memory_gb || 'Unknown'}GB
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-medium text-[var(--lp-secondary)]">Hourly Price ($):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices[index] || '0.00'}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  className="border border-[var(--lp-border)] rounded-xl px-4 py-2.5 text-[14px] w-28 focus:ring-2 focus:ring-[var(--lp-accent)] focus:border-transparent outline-none transition-shadow"
                  disabled={loading}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary flex-1 justify-center disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Pricing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
