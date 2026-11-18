'use client';
import { useEffect, useState } from 'react';

// Counts viewed listings (this browser only) and, from the Nth view, shows an inline offer
// to save the search. Never a popup, never on first visit. `children` is the server-rendered form.
export default function SavedSearch({ slug, threshold = 2, title, text, dismissLabel, children }) {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('bl_saved_dismissed')) return;
      const seen = new Set(JSON.parse(localStorage.getItem('bl_viewed') || '[]'));
      if (slug) { seen.add(slug); localStorage.setItem('bl_viewed', JSON.stringify([...seen].slice(-50))); }
      if (seen.size >= threshold) setShow(true);
    } catch { /* storage unavailable: offer stays hidden */ }
  }, [slug, threshold]);
  if (!show) return null;
  return (
    <aside className="saved" aria-label={title}>
      <div className="stack" style={{ gap: 6, flex: '1 1 320px' }}>
        <p className="h3" style={{ fontSize: 24 }}>{title}</p>
        <p className="body" style={{ fontSize: 15 }}>{text}</p>
      </div>
      {!open ? (
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{title}</button>
          <button type="button" className="btn btn-outline" onClick={() => { try { localStorage.setItem('bl_saved_dismissed', '1'); } catch {} setShow(false); }}>{dismissLabel}</button>
        </div>
      ) : <div style={{ flex: '1 1 100%' }}>{children}</div>}
    </aside>
  );
}
