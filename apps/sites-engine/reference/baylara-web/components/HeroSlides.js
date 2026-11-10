'use client';
import { useEffect, useRef, useState } from 'react';
import Media from './Media';

// Full-screen hero slideshow (crossfade + slow zoom). The first slide is server-rendered and is the LCP image.
// The other slides are only requested on wide screens, after the page has loaded and the browser is idle;
// on mobile, with reduced motion or Save-Data, the first image stays still.
const HOLD = 6500;

export default function HeroSlides({ slides }) {
  const [more, setMore] = useState(false);
  const [i, setI] = useState(0);
  const root = useRef(null);
  const n = slides.length;

  useEffect(() => {
    if (n < 2) return;
    const ok = window.matchMedia('(min-width: 1024px)').matches
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && !navigator.connection?.saveData;
    if (!ok) return;
    let t;
    const start = () => { t = setTimeout(() => (window.requestIdleCallback || ((f) => f()))(() => setMore(true)), 600); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => { clearTimeout(t); window.removeEventListener('load', start); };
  }, [n]);

  useEffect(() => {
    if (!more) return;
    const id = setInterval(() => {
      setI((c) => {
        const next = (c + 1) % n;
        const img = root.current?.querySelectorAll('.slide img')[next];
        return img && !img.complete ? c : next; // wait until the next image is ready
      });
    }, HOLD);
    return () => clearInterval(id);
  }, [more, n]);

  return (
    <div ref={root} className={`slides${more ? ' is-moving' : ''}`} aria-hidden="true">
      {slides.map((m, k) => (k === 0 || more) && (
        <div key={k} className={`slide${k === i ? ' is-on' : ''}`}>
          <Media m={m} priority={k === 0} decorative sizes="100vw" />
        </div>
      ))}
    </div>
  );
}
