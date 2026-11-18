'use client';
import Script from 'next/script';
import { useEffect } from 'react';
import { trackClick } from './track';

const GA4 = process.env.NEXT_PUBLIC_GA4_ID;
const GADS = process.env.NEXT_PUBLIC_GADS_ID;

// Loads the Google tag only when at least one ID is configured, after the page is idle.
// Also tracks clicks on any element marked data-track="whatsapp" | "call".
export default function Analytics() {
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest && e.target.closest('[data-track]');
      if (el) trackClick(el.getAttribute('data-track'));
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const first = GA4 || GADS;
  if (!first) return null;
  const configs = [GA4, GADS].filter(Boolean).map((id) => `gtag('config','${id}');`).join('');
  return (
    <>
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${configs}`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${first}`} strategy="lazyOnload" />
    </>
  );
}
