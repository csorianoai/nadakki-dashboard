import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estado',
  robots: { index: false, follow: false }, // noindex
};

export default function HealthPage() {
  return <main>ok</main>;
}
