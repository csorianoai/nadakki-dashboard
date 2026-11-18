'use client';
import { useEffect, useRef, useState } from 'react';

// Desktop-only hero video. Nothing is requested until the page has finished loading and the browser is idle,
// so the still image stays the first (LCP) content. Skipped on narrow screens, reduced motion and Save-Data.
export default function HeroVideo({ src }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!src) return;
    const ok = window.matchMedia('(min-width: 1024px)').matches
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !navigator.connection?.saveData;
    if (!ok) return;
    let t;
    const start = () => { t = setTimeout(() => (window.requestIdleCallback || ((f) => f()))(() => setOn(true)), 600); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('load', start); };
  }, [src]);

  useEffect(() => {
    if (on && ref.current) ref.current.play().catch(() => {});
  }, [on]);

  if (!on) return null;
  return (
    <video
      ref={ref}
      className={`hero-video${ready ? ' is-ready' : ''}`}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setReady(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
