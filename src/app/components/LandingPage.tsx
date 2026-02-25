'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

/* ─── Inline Icons ─── */
const icons = {
  arrow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
    </svg>
  ),
  gpu: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <rect x="6.5" y="8" width="11" height="8" rx="1.5" />
      <line x1="9.5" y1="8" x2="9.5" y2="16" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="14.5" y1="8" x2="14.5" y2="16" />
      <line x1="6.5" y1="11" x2="17.5" y2="11" />
      <line x1="6.5" y1="13.5" x2="17.5" y2="13.5" />
    </svg>
  ),
  zap: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  wallet: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  ),
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
    </svg>
  ),
  upload: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  download: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
};

/* ─── Mock Node Data ─── */
const LIVE_NODES = [
  { id: 'N-7A3F', name: 'RTX 4090', vram: '24 GB', rate: '$0.85', status: 'online', provider: 'lambda_gpu', rating: 4.9, jobs: 342 },
  { id: 'N-2B1C', name: 'A100 80GB', vram: '80 GB', rate: '$2.40', status: 'online', provider: 'compute_hq', rating: 4.8, jobs: 891 },
  { id: 'N-9D4E', name: 'RTX 3090', vram: '24 GB', rate: '$0.55', status: 'online', provider: 'ml_nodes', rating: 4.7, jobs: 156 },
];

const FEATURES = [
  {
    icon: icons.globe,
    title: 'Live Marketplace',
    desc: 'Real-time node availability with heartbeat monitoring. Browse specs, compare rates, and select from providers worldwide.',
    tag: 'Discovery',
  },
  {
    icon: icons.upload,
    title: 'One-Click Jobs',
    desc: 'Upload .blend, .zip, or any workload up to 500 MB. Select a node, submit, and track progress from your dashboard.',
    tag: 'Compute',
  },
  {
    icon: icons.wallet,
    title: 'Pay-Per-Use',
    desc: 'Charged only for actual GPU runtime. Transparent 10% platform fee. Secure payment capture via Stripe on completion.',
    tag: 'Billing',
  },
  {
    icon: icons.chart,
    title: 'Provider Analytics',
    desc: 'Earnings breakdowns by day, week, and month. Customer reviews, node performance metrics, and payout history.',
    tag: 'Insights',
  },
  {
    icon: icons.shield,
    title: 'OAuth & Role-Based Access',
    desc: 'Sign in with Google or GitHub. Separate dashboards and permissions for consumers and providers.',
    tag: 'Security',
  },
  {
    icon: icons.zap,
    title: 'Instant Payouts',
    desc: 'Providers receive earnings directly to their bank via Stripe Connect. No manual invoicing, no delays.',
    tag: 'Payouts',
  },
];

/* ─── Component ─── */
export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(user.role === 'provider' ? '/providers' : '/consumers');
    }
  }, [user, router]);

  if (user) return null;

  return (
    <div className="landing-page min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="max-w-[1240px] mx-auto px-6 lg:px-10 flex items-center justify-between h-[72px]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-[var(--lp-ink)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <span className="text-[10px] font-bold text-[var(--lp-bg)] font-serif">OG</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">OpenGPU</span>
        </Link>

        <div className="hidden md:flex items-center gap-9 text-[14px] text-[var(--lp-secondary)]">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#marketplace" className="lp-nav-link">Marketplace</a>
          <a href="#how" className="lp-nav-link">How It Works</a>
          <a href="#providers" className="lp-nav-link">Providers</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline-flex text-[14px] text-[var(--lp-secondary)] lp-nav-link">
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 text-[13px] font-medium text-white bg-[var(--lp-accent)] rounded-full hover:bg-[var(--lp-accent-hover)] transition-colors duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-[1240px] mx-auto px-6 lg:px-10 pt-20 sm:pt-28 pb-24 sm:pb-32">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-16 lg:gap-20 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-7 lp-reveal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
              Network Live — Nodes Available
            </div>

            <h1 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-[1.08] tracking-[-0.02em] mb-7 lp-reveal lp-d1">
              GPU compute,<br />
              <span className="italic text-[var(--lp-accent)]">without the cloud tax.</span>
            </h1>

            <p className="text-[var(--lp-secondary)] text-[17px] leading-[1.65] max-w-[480px] mb-10 lp-reveal lp-d2">
              A peer-to-peer marketplace where researchers rent community GPUs by the hour,
              and hardware owners earn from idle capacity. No contracts. No reserved instances.
              Just compute.
            </p>

            <div className="flex flex-wrap items-center gap-4 lp-reveal lp-d3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-medium text-white bg-[var(--lp-accent)] rounded-full hover:bg-[var(--lp-accent-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/15"
              >
                Start Renting GPUs {icons.arrow}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-medium text-[var(--lp-ink)] border border-[var(--lp-border)] rounded-full hover:border-[var(--lp-ink)] transition-colors duration-200"
              >
                List Your Hardware
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-10 text-xs text-[var(--lp-dim)] lp-reveal lp-d4">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Stripe-secured
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                OAuth with Google
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /></svg>
                Global network
              </span>
            </div>
          </div>

          {/* Right — Live node preview cards */}
          <div className="relative lp-scale lp-d2">
            <div className="space-y-4">
              {LIVE_NODES.map((node, i) => (
                <div
                  key={node.id}
                  className={`node-card p-5 lp-slide-right lp-d${i + 3}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-secondary)]">
                        {icons.gpu}
                      </div>
                      <div>
                        <div className="font-semibold text-[15px]">{node.name}</div>
                        <div className="text-xs text-[var(--lp-dim)] font-mono">{node.id} &middot; {node.vram} VRAM</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                      <span className="text-xs text-emerald-600 font-medium capitalize">{node.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-[var(--lp-dim)]">
                      <span><strong className="text-[var(--lp-ink)]">{node.rate}</strong>/hr</span>
                      <span>{node.jobs} jobs run</span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {node.rating}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--lp-dim)]">@{node.provider}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtle label */}
            <div className="text-center mt-5 text-xs text-[var(--lp-dim)] lp-fade lp-d6">
              Live marketplace preview &middot; Refreshes every 10s
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker Strip ── */}
      <div className="border-y border-[var(--lp-border)] py-4 overflow-hidden">
        <div className="flex lp-ticker-track whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...Array(2)].map((_, copy) => (
            <div key={copy} className="flex items-center gap-12 px-6 text-sm text-[var(--lp-dim)]">
              <span>RTX 4090 &middot; $0.85/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>A100 80GB &middot; $2.40/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>RTX 3090 &middot; $0.55/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>H100 SXM &middot; $3.10/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>RTX A6000 &middot; $1.20/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>L40S &middot; $1.75/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>RTX 4080 &middot; $0.65/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
              <span>V100 32GB &middot; $0.90/hr</span>
              <span className="text-[var(--lp-border)]">/</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
        <div className="max-w-[560px] mb-16">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Platform</p>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] mb-5">
            Built for the way compute<br className="hidden sm:block" /> should work.
          </h2>
          <p className="text-[var(--lp-secondary)] text-[16px] leading-[1.6]">
            Everything you need to rent GPU power or monetize your hardware — in one clean platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card p-7 group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-secondary)] group-hover:text-[var(--lp-accent)] transition-colors duration-300">
                  {f.icon}
                </div>
                <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)]">{f.tag}</span>
              </div>
              <h3 className="font-semibold text-[16px] mb-2.5">{f.title}</h3>
              <p className="text-[14px] text-[var(--lp-secondary)] leading-[1.6]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Marketplace Preview ── */}
      <section id="marketplace" className="bg-[var(--lp-surface)]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Marketplace</p>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] mb-6">
                A real-time feed of community GPU nodes.
              </h2>
              <p className="text-[var(--lp-secondary)] text-[16px] leading-[1.6] mb-8">
                Every node shows live status, hardware specs, hourly rate, and provider reputation.
                Filter by GPU model, VRAM, price range, or rating. Auto-refreshing dashboards
                keep you connected to the network pulse.
              </p>
              <div className="space-y-4">
                {[
                  'Heartbeat monitoring — see which nodes are actually online',
                  'Provider profiles with verified ratings from real jobs',
                  'Sort by price, performance, or availability',
                  'Auto-refresh every 10 seconds with live indicators',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[var(--lp-accent)] mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[15px] text-[var(--lp-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual — stylized marketplace UI */}
            <div className="bg-white rounded-2xl border border-[var(--lp-border)] shadow-sm overflow-hidden">
              {/* Header bar */}
              <div className="px-6 py-4 border-b border-[var(--lp-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm">Available Nodes</span>
                  <span className="text-xs text-[var(--lp-dim)] bg-[var(--lp-surface)] px-2 py-0.5 rounded-full">3 online</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--lp-dim)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
                  Live
                </div>
              </div>
              {/* Node rows */}
              {LIVE_NODES.map((node, i) => (
                <div key={node.id} className={`px-6 py-4 flex items-center justify-between ${i < LIVE_NODES.length - 1 ? 'border-b border-[var(--lp-border)]' : ''} hover:bg-[var(--lp-surface)]/50 transition-colors`}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-dim)]">
                      {icons.gpu}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{node.name}</div>
                      <div className="text-xs text-[var(--lp-dim)]">{node.vram} &middot; @{node.provider}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--lp-accent)]">{node.rate}<span className="text-[var(--lp-dim)] font-normal">/hr</span></div>
                    <div className="flex items-center gap-1 justify-end">
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      <span className="text-xs text-[var(--lp-dim)]">{node.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Bottom bar */}
              <div className="px-6 py-3 bg-[var(--lp-surface)]/50 text-center">
                <span className="text-xs text-[var(--lp-dim)]">Browse all nodes in the marketplace &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
        <div className="text-center mb-20">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Process</p>
          <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] max-w-[600px] mx-auto">
            From signup to results in three steps.
          </h2>
        </div>

        {/* Consumer flow */}
        <div className="mb-20">
          <div className="flex items-center gap-2 mb-10">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-[var(--lp-accent)]">Consumer</span>
            <span className="text-sm text-[var(--lp-dim)]">Rent GPU compute</span>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Browse & choose',
                desc: 'Explore the live marketplace. Filter by GPU model, VRAM, price, and provider rating. Every node shows real-time availability.',
                icon: icons.globe,
              },
              {
                num: '02',
                title: 'Upload & submit',
                desc: 'Upload your files — .blend, .zip, or any compute payload up to 500 MB. Select a node, configure your job, and launch.',
                icon: icons.upload,
              },
              {
                num: '03',
                title: 'Track & download',
                desc: 'Watch progress in real time with auto-refreshing status. When complete, download your artifacts and pay for actual runtime only.',
                icon: icons.download,
              },
            ].map((step) => (
              <div key={step.num} className="step-group group">
                <div className="step-num mb-4">{step.num}</div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-[var(--lp-dim)] group-hover:text-[var(--lp-accent)] transition-colors">{step.icon}</span>
                  <h3 className="font-semibold text-[17px]">{step.title}</h3>
                </div>
                <p className="text-[14px] text-[var(--lp-secondary)] leading-[1.6]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Provider flow */}
        <div>
          <div className="flex items-center gap-2 mb-10">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Provider</span>
            <span className="text-sm text-[var(--lp-dim)]">Monetize your hardware</span>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Register nodes',
                desc: 'Add your GPU hardware with specs and set your hourly rate. Your nodes go live on the marketplace instantly.',
                icon: icons.gpu,
              },
              {
                num: '02',
                title: 'Accept jobs',
                desc: 'Jobs are matched to your available nodes automatically. Monitor status, track active workloads, and manage your fleet in real time.',
                icon: icons.zap,
              },
              {
                num: '03',
                title: 'Earn & withdraw',
                desc: 'Track earnings by day, week, or month. Get rated by consumers. Payouts flow directly to your bank via Stripe Connect.',
                icon: icons.wallet,
              },
            ].map((step) => (
              <div key={step.num} className="step-group group">
                <div className="step-num mb-4" style={{ color: 'var(--lp-border)' }}>{step.num}</div>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-[var(--lp-dim)] group-hover:text-emerald-600 transition-colors">{step.icon}</span>
                  <h3 className="font-semibold text-[17px]">{step.title}</h3>
                </div>
                <p className="text-[14px] text-[var(--lp-secondary)] leading-[1.6]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Provider Section ── */}
      <section id="providers" className="bg-[var(--lp-ink)] text-white">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-400 mb-3">For Providers</p>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] mb-6">
                Your idle GPU is someone else&apos;s breakthrough.
              </h2>
              <p className="text-gray-400 text-[16px] leading-[1.6] mb-10">
                Join a growing network of hardware owners turning spare compute into revenue.
                Full control over pricing, visibility into every job, and direct bank payouts.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-medium bg-white text-[var(--lp-ink)] rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                Become a Provider {icons.arrow}
              </Link>
            </div>

            {/* Provider dashboard mock */}
            <div className="bg-[#1e1e32] rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700/50 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-gray-500 font-mono">provider-dashboard</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'This Month', value: '$2,847', change: '+12%' },
                    { label: 'Active Nodes', value: '4', change: 'Online' },
                    { label: 'Jobs Completed', value: '891', change: '99.2% uptime' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#252540] rounded-xl p-4">
                      <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
                      <div className="text-xl font-bold">{stat.value}</div>
                      <div className="text-xs text-emerald-400 mt-1">{stat.change}</div>
                    </div>
                  ))}
                </div>
                {/* Earnings mini chart */}
                <div className="bg-[#252540] rounded-xl p-5">
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-4">Weekly Earnings</div>
                  <div className="flex items-end gap-2 h-20">
                    {[35, 52, 48, 70, 85, 62, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-indigo-500/70 hover:bg-indigo-400 transition-colors cursor-pointer"
                        style={{ height: `${h}%` }}
                        title={`$${(h * 4.2).toFixed(0)}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-b border-[var(--lp-border)]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { value: '10x', label: 'cheaper than major cloud providers' },
              { value: '500 MB', label: 'max file upload per job' },
              { value: '<3s', label: 'live status refresh interval' },
              { value: '24/7', label: 'global node availability' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-serif text-[clamp(2rem,3.5vw,2.8rem)] text-[var(--lp-ink)] leading-none mb-2">{stat.value}</div>
                <div className="text-[13px] text-[var(--lp-dim)] leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
        <div className="bg-[var(--lp-surface)] rounded-3xl p-12 sm:p-16 text-center">
          <h2 className="font-serif text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] mb-4">
            Ready to compute?
          </h2>
          <p className="text-[var(--lp-secondary)] text-[16px] leading-[1.6] max-w-[440px] mx-auto mb-8">
            Whether you need GPU power or have it to spare — OpenGPU connects you in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-medium text-white bg-[var(--lp-accent)] rounded-full hover:bg-[var(--lp-accent-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/15"
            >
              Get Started Free {icons.arrow}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-[1240px] mx-auto px-6 lg:px-10 border-t border-[var(--lp-border)]">
        <div className="flex flex-col sm:flex-row items-center justify-between py-8 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[var(--lp-ink)] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[var(--lp-bg)] font-serif">OG</span>
            </div>
            <span className="text-sm text-[var(--lp-dim)]">&copy; {new Date().getFullYear()} OpenGPU</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-[var(--lp-dim)]">
            <a href="#" className="hover:text-[var(--lp-ink)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--lp-ink)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--lp-ink)] transition-colors">Docs</a>
            <Link href="/login" className="hover:text-[var(--lp-ink)] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
