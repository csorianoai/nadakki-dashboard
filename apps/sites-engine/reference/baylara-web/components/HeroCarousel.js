'use client';
import { useState } from 'react';
import Media from './Media';
import { openGallery } from './Gallery';

// Detail-page hero: full-screen photo with arrows and a counter (1 / 12), and two large white buttons
// (Gallery, Request information). Only the first photo is in the initial HTML (it is the LCP);
// the others are requested when the visitor moves through them.
export default function HeroCarousel({ items, s, sample }) {
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(() => new Set([0]));
  const n = items.length;
  const go = (d) => {
    const next = (i + d + n) % n;
    const ahead = (next + d + n) % n;
    setSeen((cur) => new Set([...cur, next, ahead]));
    setI(next);
  };
  return (
    <section className="dhero" aria-roledescription="carousel" aria-label={s.gallery}>
      {items.map((m, k) => seen.has(k) && (
        <div key={k} className={`dhero-slide${k === i ? ' is-on' : ''}`} aria-hidden={k !== i}>
          <Media m={m} priority={k === 0} decorative={k !== i} sizes="100vw" />
        </div>
      ))}
      <div className="dhero-shade" />
      {sample && <p className="badge-sample dhero-sample">{s.sample_note}</p>}
      {n > 1 && (
        <div className="dhero-nav">
          <button type="button" className="dhero-arrow" onClick={() => go(-1)} aria-label={s.prev}><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 5l-7 7 7 7" /></svg></button>
          <span className="dhero-count" aria-live="polite">{i + 1} / {n}</span>
          <button type="button" className="dhero-arrow" onClick={() => go(1)} aria-label={s.next_img}><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5l7 7-7 7" /></svg></button>
        </div>
      )}
      <div className="container dhero-actions">
        <button type="button" className="dhero-btn" onClick={() => openGallery(i)}>{s.gallery}</button>
        <a className="dhero-btn" href="#info">{s.request_info_btn}</a>
      </div>
    </section>
  );
}
