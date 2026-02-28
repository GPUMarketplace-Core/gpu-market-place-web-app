'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

/* ─── Inline SVG Icons ─── */
const icons = {
  arrow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
    </svg>
  ),
  monitor: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  dollar: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  rocket: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  helm: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  cloud: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  ),
  eye: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

/* ─── Fade-in on scroll hook ─── */
function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function FadeSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useFadeInOnScroll();
  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: 0, transform: 'translateY(28px)', transition: 'opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)' }}
    >
      {children}
    </div>
  );
}

/* ─── Dashboard Illustration (SVG/CSS) ─── */
function DashboardMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[var(--lp-border)] shadow-sm overflow-hidden">
      {/* Window chrome */}
      <div className="px-5 py-3 border-b border-[var(--lp-border)] flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[10px] text-[var(--lp-dim)] font-mono">gpu-dashboard</span>
      </div>
      <div className="p-5">
        {/* Top stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total GPU Spend', value: '$47.2K', color: 'text-[var(--lp-accent)]' },
            { label: 'Avg Utilization', value: '43%', color: 'text-amber-500' },
            { label: 'Potential Savings', value: '$18.9K', color: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--lp-surface)] rounded-xl p-3">
              <div className="text-[9px] text-[var(--lp-dim)] uppercase tracking-wider mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        {/* Utilization heatmap mockup */}
        <div className="bg-[var(--lp-surface)] rounded-xl p-4 mb-4">
          <div className="text-[9px] text-[var(--lp-dim)] uppercase tracking-wider mb-3">GPU Utilization Heatmap</div>
          <div className="grid grid-cols-12 gap-1">
            {[85, 20, 60, 90, 45, 15, 70, 30, 95, 55, 10, 75, 40, 80, 25, 65, 50, 35, 88, 22, 72, 42, 92, 58].map((v, i) => (
              <div
                key={i}
                className="aspect-square rounded-sm"
                style={{
                  backgroundColor: v > 70 ? '#059669' : v > 40 ? '#f59e0b' : '#ef4444',
                  opacity: 0.3 + (v / 100) * 0.7,
                }}
              />
            ))}
          </div>
        </div>
        {/* Cloud provider row */}
        <div className="flex items-center justify-between bg-[var(--lp-surface)] rounded-xl p-3">
          <div className="flex items-center gap-3">
            {['AWS', 'GCP', 'Azure'].map((p) => (
              <span key={p} className="px-2.5 py-1 text-[10px] font-medium bg-white rounded-lg border border-[var(--lp-border)] text-[var(--lp-secondary)]">{p}</span>
            ))}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Vision Page Component ─── */
export default function VisionPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="max-w-[1240px] mx-auto px-6 lg:px-10 flex items-center justify-between h-[72px]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-[var(--lp-ink)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <span className="text-[10px] font-bold text-[var(--lp-bg)] font-serif">CX</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">ComputeX</span>
        </Link>

        <div className="hidden md:flex items-center gap-9 text-[14px] text-[var(--lp-secondary)]">
          <Link href="/vision" className="lp-nav-link text-[var(--lp-accent)] flex items-center gap-1.5">
            Vision
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-[var(--lp-accent)] text-white rounded-full leading-none">New</span>
          </Link>
          <Link href="/#features" className="lp-nav-link">Features</Link>
          <Link href="/#marketplace" className="lp-nav-link">Marketplace</Link>
          <Link href="/#how" className="lp-nav-link">How It Works</Link>
          <Link href="/#providers" className="lp-nav-link">Providers</Link>
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

      {/* ── In Development Banner ── */}
      <div className="bg-[#FEF3C7] border-y border-[#F6D96B]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-3 flex items-center gap-3 text-[14px] text-[#92400E]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M2 20h20L12 4 2 20z" />
            <line x1="12" y1="10" x2="12" y2="14" />
            <circle cx="12" cy="17" r="0.5" fill="#92400E" />
          </svg>
          <p>
            <strong>In Development</strong> — This product is currently being built. What you see below is our product vision and roadmap. The existing GPU marketplace remains fully operational.
          </p>
        </div>
      </div>

      {/* ── Section 1: Hero ── */}
      <section className="max-w-[1240px] mx-auto px-6 lg:px-10 pt-20 sm:pt-28 pb-24 sm:pb-32">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-16 lg:gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-[var(--lp-accent)] text-xs font-medium mb-7 lp-reveal">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--lp-accent)]" style={{ animation: 'lp-pulse-dot 2s infinite' }} />
              Product Vision
            </div>

            <h1 className="font-serif text-[clamp(2.4rem,5vw,4rem)] leading-[1.08] tracking-[-0.02em] mb-7 lp-reveal lp-d1">
              The GPU Intelligence<br />
              <span className="italic text-[var(--lp-accent)]">Platform.</span>
            </h1>

            <p className="text-[var(--lp-secondary)] text-[17px] leading-[1.65] max-w-[500px] mb-10 lp-reveal lp-d2">
              We&apos;re evolving from a GPU marketplace into the cost intelligence layer for enterprise GPU infrastructure. Monitor, optimize, and manage GPU spend across every cloud — from a single dashboard.
            </p>

            <div className="flex flex-wrap items-center gap-4 lp-reveal lp-d3">
              <a
                href="mailto:hello@computex.space?subject=Vision%20Waitlist"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-medium text-white bg-[var(--lp-accent)] rounded-full hover:bg-[var(--lp-accent-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/15"
              >
                Join the Waitlist {icons.arrow}
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-medium text-[var(--lp-ink)] border border-[var(--lp-border)] rounded-full hover:border-[var(--lp-ink)] transition-colors duration-200"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="lp-scale lp-d2">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── Section 2: The Problem ── */}
      <section className="bg-[var(--lp-surface)]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
          <FadeSection>
            <div className="max-w-[560px] mb-16">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Challenge</p>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] mb-5">
                The Problem We&apos;re Solving
              </h2>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-5.5 1.92 0 3 1.5 3 3.5 0 1.4-.5 2.57-1 3.5-.5.93-1 1.86-1 3.5a2.5 2.5 0 005 0" /><path d="M12 22v-2" /></svg>,
                stat: '75%',
                text: 'of organizations run GPUs below 70% utilization. Enterprises waste billions annually on idle GPU compute they\u2019re paying for but not using.',
                label: 'Massive Waste',
              },
              {
                icon: icons.eye,
                stat: '$85K/mo',
                text: 'average enterprise AI compute budget — yet only 51% can evaluate ROI. Teams don\u2019t know which workloads cost what, or which GPUs are sitting idle.',
                label: 'Cost Blind Spots',
              },
              {
                icon: icons.cloud,
                stat: '5x',
                text: 'price spread for identical GPU compute across providers. An H100 costs $1.45/hr on one platform and $6.98/hr on another. No tool surfaces this automatically.',
                label: 'Multi-Cloud Chaos',
              },
              {
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
                stat: '$700M',
                text: 'NVIDIA paid to acquire Run:ai, the leading GPU orchestration tool. Enterprises now need a vendor-neutral alternative they control.',
                label: 'Vendor Lock-in',
              },
            ].map((card, i) => (
              <FadeSection key={card.label}>
                <div className="feature-card p-7 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-secondary)]">
                      {card.icon}
                    </div>
                    <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)]">{card.label}</span>
                  </div>
                  <div className="font-serif text-[clamp(2rem,3.5vw,2.8rem)] text-[var(--lp-accent)] leading-none mb-3">
                    {card.stat}
                  </div>
                  <p className="text-[14px] text-[var(--lp-secondary)] leading-[1.6]">{card.text}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: What We're Building ── */}
      <section className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
        <FadeSection>
          <div className="max-w-[700px] mb-16">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Platform</p>
            <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] mb-6">
              What ComputeX Is Becoming
            </h2>
            <p className="text-[var(--lp-secondary)] text-[16px] leading-[1.6]">
              ComputeX is pivoting from a peer-to-peer GPU marketplace into a vendor-neutral GPU intelligence platform. Think of it as Datadog meets Kayak — but for GPU infrastructure. We monitor your GPUs, analyze your costs across every cloud provider, and tell you exactly where you&apos;re wasting money and how to fix it.
            </p>
          </div>
        </FadeSection>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: icons.monitor,
              title: 'Universal GPU Monitoring',
              desc: 'A lightweight open-source agent that installs in your Kubernetes cluster via Helm. Collects real-time GPU metrics — utilization, VRAM, temperature, power, health — across NVIDIA and AMD hardware. Works on any cloud, any cluster, any GPU.',
              tag: 'Monitor',
            },
            {
              icon: icons.dollar,
              title: 'Cross-Cloud Cost Intelligence',
              desc: 'Connect your AWS, GCP, and Azure billing accounts. We normalize GPU costs across providers, attribute spend to teams and projects, and generate Waste Reports showing exactly where your money goes. Chargeback and showback built in.',
              tag: 'Analyze',
            },
            {
              icon: icons.rocket,
              title: 'Smart Recommendations',
              desc: 'Automated optimization suggestions: right-size overprovisioned instances, consolidate idle workloads, switch to cheaper providers for the same GPU class, schedule non-urgent jobs off-peak. Every recommendation includes estimated monthly savings.',
              tag: 'Optimize',
            },
          ].map((col) => (
            <FadeSection key={col.title}>
              <div className="feature-card p-7 h-full">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-accent)]">
                    {col.icon}
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--lp-dim)]">{col.tag}</span>
                </div>
                <h3 className="font-semibold text-[16px] mb-2.5">{col.title}</h3>
                <p className="text-[14px] text-[var(--lp-secondary)] leading-[1.6]">{col.desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── Section 4: How It Works ── */}
      <section className="bg-[var(--lp-surface)]">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
          <FadeSection>
            <div className="text-center mb-20">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Process</p>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12] max-w-[600px] mx-auto">
                Three Steps to GPU Cost Clarity
              </h2>
            </div>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Install the Agent',
                desc: 'Deploy our open-source monitoring agent to your Kubernetes cluster with a single Helm command. It auto-discovers all GPUs and begins collecting metrics in under 5 minutes. Memory footprint under 50MB.',
                icon: icons.helm,
              },
              {
                num: '02',
                title: 'Connect Your Clouds',
                desc: 'Link your cloud billing accounts via OAuth. We pull cost data from AWS, GCP, Azure, and neocloud providers. Your unified dashboard shows GPU utilization overlaid with real dollar costs for the first time.',
                icon: icons.cloud,
              },
              {
                num: '03',
                title: 'See the Waste, Fix It',
                desc: 'Generate a Waste Report in one click. See idle GPU-hours, overprovisioned instances, pricing arbitrage opportunities, and team-level cost attribution. Act on recommendations and watch your GPU bill drop.',
                icon: icons.monitor,
              },
            ].map((step) => (
              <FadeSection key={step.num}>
                <div className="step-group group">
                  <div className="step-num mb-4">{step.num}</div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[var(--lp-dim)] group-hover:text-[var(--lp-accent)] transition-colors">{step.icon}</span>
                    <h3 className="font-semibold text-[17px]">{step.title}</h3>
                  </div>
                  <p className="text-[14px] text-[var(--lp-secondary)] leading-[1.6]">{step.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Who It's For ── */}
      <section className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
        <FadeSection>
          <div className="text-center mb-16">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Audience</p>
            <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12]">
              Built For
            </h2>
          </div>
        </FadeSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
              title: 'ML Platform Teams',
              desc: 'Finally see which team is burning through GPU budget and why.',
            },
            {
              icon: icons.rocket,
              title: 'AI Startups',
              desc: 'Stop guessing which cloud provider is cheapest for your workloads.',
            },
            {
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
              title: 'Infrastructure Leaders',
              desc: 'Justify GPU spend to the CFO with real utilization and ROI data.',
            },
            {
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
              title: 'DevOps / MLOps Engineers',
              desc: 'One dashboard for GPU metrics across every cluster and cloud.',
            },
          ].map((persona) => (
            <FadeSection key={persona.title}>
              <div className="feature-card p-7 text-center h-full">
                <div className="w-12 h-12 rounded-xl bg-[var(--lp-surface)] flex items-center justify-center text-[var(--lp-accent)] mx-auto mb-4">
                  {persona.icon}
                </div>
                <h3 className="font-semibold text-[15px] mb-2">{persona.title}</h3>
                <p className="text-[13px] text-[var(--lp-secondary)] leading-[1.5]">{persona.desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── Section 6: Roadmap ── */}
      <section className="bg-[var(--lp-ink)] text-white">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
          <FadeSection>
            <div className="mb-16">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-indigo-400 mb-3">Roadmap</p>
              <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.12]">
                Where We Are
              </h2>
            </div>
          </FadeSection>

          <div className="space-y-0">
            {[
              {
                status: 'completed',
                emoji: '\u2705',
                label: 'Completed',
                title: 'GPU Marketplace (Live)',
                desc: 'Our peer-to-peer GPU marketplace is live and operational. Rent community GPUs by the hour.',
                link: { text: 'Visit Marketplace \u2192', href: '/' },
                color: 'bg-emerald-500',
              },
              {
                status: 'in-progress',
                emoji: '\uD83D\uDD28',
                label: 'In Progress',
                title: 'GPU Monitoring Agent',
                desc: 'Building the open-source Kubernetes-native agent. Go-based, lightweight, NVIDIA NVML integration. Targeting private beta in Q2 2026.',
                color: 'bg-amber-500',
              },
              {
                status: 'next',
                emoji: '\uD83D\uDCCB',
                label: 'Next',
                title: 'Cost Intelligence Engine',
                desc: 'Multi-cloud billing integration, cost attribution, Waste Report generation. Targeting Q3 2026.',
                color: 'bg-indigo-500',
              },
              {
                status: 'future',
                emoji: '\uD83D\uDD2E',
                label: 'Future',
                title: 'Optimization & Recommendations',
                desc: 'Automated right-sizing, provider arbitrage, scheduling optimization, MIG management. Targeting Q4 2026.',
                color: 'bg-gray-500',
              },
            ].map((item, i) => (
              <FadeSection key={item.title}>
                <div className="flex gap-6 group">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${item.color} shrink-0 mt-1 ring-4 ring-[var(--lp-ink)]`} />
                    {i < 3 && <div className="w-px flex-1 bg-gray-700 min-h-[40px]" />}
                  </div>
                  {/* Content */}
                  <div className="pb-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{item.emoji}</span>
                      <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">{item.label}</span>
                    </div>
                    <h3 className="font-semibold text-[17px] mb-2">{item.title}</h3>
                    <p className="text-[14px] text-gray-400 leading-[1.6] max-w-[520px]">{item.desc}</p>
                    {item.link && (
                      <Link href={item.link.href} className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                        {item.link.text}
                      </Link>
                    )}
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: CTA / Waitlist ── */}
      <section className="max-w-[1240px] mx-auto px-6 lg:px-10 py-24 sm:py-32">
        <FadeSection>
          <div className="bg-[var(--lp-surface)] rounded-3xl p-12 sm:p-16 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--lp-accent)] mb-3">Early Access</p>
            <h2 className="font-serif text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] mb-4">
              Get Early Access
            </h2>
            <p className="text-[var(--lp-secondary)] text-[16px] leading-[1.6] max-w-[540px] mx-auto mb-8">
              We&apos;re onboarding design partners for our private beta. If your team spends $10K+/month on GPU compute and wants to cut waste, we want to talk to you.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <a
                href="mailto:hello@computex.space?subject=Early%20Access%20Request"
                className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-medium text-white bg-[var(--lp-accent)] rounded-full hover:bg-[var(--lp-accent-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/15"
              >
                Join the Waitlist {icons.arrow}
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-medium text-[var(--lp-ink)] border border-[var(--lp-border)] rounded-full hover:border-[var(--lp-ink)] transition-colors duration-200"
              >
                View Current Marketplace
              </Link>
            </div>
            <p className="text-[13px] text-[var(--lp-dim)]">
              No commitment required. We&apos;ll reach out to schedule a free GPU Spend Audit.
            </p>
          </div>
        </FadeSection>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-[1240px] mx-auto px-6 lg:px-10 border-t border-[var(--lp-border)]">
        <div className="flex flex-col sm:flex-row items-center justify-between py-8 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[var(--lp-ink)] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[var(--lp-bg)] font-serif">CX</span>
            </div>
            <span className="text-sm text-[var(--lp-dim)]">&copy; {new Date().getFullYear()} ComputeX</span>
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
