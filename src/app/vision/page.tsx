import type { Metadata } from 'next';
import VisionPage from './VisionPage';

export const metadata: Metadata = {
  title: 'ComputeX Vision — GPU Intelligence Platform',
  description:
    'ComputeX is evolving into the cost intelligence layer for enterprise GPU infrastructure. Monitor, optimize, and manage GPU spend across every cloud.',
  openGraph: {
    title: 'ComputeX Vision — GPU Intelligence Platform',
    description:
      'Monitor, optimize, and manage GPU spend across every cloud — from a single dashboard.',
    type: 'website',
  },
};

export default function Page() {
  return <VisionPage />;
}
