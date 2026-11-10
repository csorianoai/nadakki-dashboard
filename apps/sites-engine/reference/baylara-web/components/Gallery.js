'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Media from './Media';

// Full-screen gallery: arrows, thumbnails, keyboard (← → Esc), swipe. Opened by any <GalleryOpen>.
const EVT = 'baylara:gallery';

export function openGallery(index = 0) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: index }));
}

export function GalleryOpen({ index = 0, className = 'btn btn-outline-light', children, label }) {
  return <button type="button" className={className} aria-label={label} onClick={() => window.dispatchEvent(new CustomEvent(EVT, { detail: index }))}>{children}</button>;
}

export default function Gallery({ items, s }) {
  const [i, setI] = useState(-1);
  const box = useRef(null);
  const back = useRef(null);
  const touch = useRef(null);
  const n = items.length;
  const go = useCallback((d) => setI((c) => (c + d + n) % n), [n]);
  const close = useCallback(() => setI(-1), []);

  useEffect(() => {
    const open = (e) => { back.current = document.activeElement; setI(Number(e.detail) || 0); };
    window.addEventListener(EVT, open);
    return () => window.removeEventListener(EVT, open);
  }, []);

  useEffect(() => {
    if (i < 0) { back.current?.focus?.(); return; }
    document.documentElement.classList.add('no-scroll');
    box.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); document.documentElement.classList.remove('no-scroll'); };
  }, [i, go, close]);

  if (i < 0 || !n) return null;
  const m = items[i];
  return (
    <div
      ref={box}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${s.gallery} · ${i + 1} ${s.of_n} ${n}`}
      tabIndex={-1}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - (touch.current ?? 0); if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}
    >
      <div className="lb-top">
        <span className="lb-count" aria-live="polite">{i + 1} / {n}</span>
        <button type="button" className="lb-btn" onClick={close} aria-label={s.close}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>
      </div>
      <div className="lb-stage">
        {n > 1 && <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label={s.prev}><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 5l-7 7 7 7" /></svg></button>}
        <figure className="lb-img" key={i}><Media m={m} priority sizes="100vw" className="media" /></figure>
        {n > 1 && <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label={s.next_img}><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 5l7 7-7 7" /></svg></button>}
      </div>
      {n > 1 && (
        <div className="lb-thumbs">
          {items.map((t, k) => (
            <button key={k} type="button" className={`lb-thumb${k === i ? ' is-on' : ''}`} aria-label={`${k + 1} ${s.of_n} ${n}`} aria-current={k === i ? 'true' : undefined} onClick={() => setI(k)}>
              <Media m={t} decorative sizes="120px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
