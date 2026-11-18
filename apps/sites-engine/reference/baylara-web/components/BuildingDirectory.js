'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import BuildingCard from './BuildingCard';

const YEARS = { old: [0, 2000], mid: [2000, 2016], new: [2016, 9999] };
const HOA = { low: [0, 1], mid: [1, 1.5], high: [1.5, 99] };

// Directory with search, filters and list / light schematic map views. Items come pre-localized.
export default function BuildingDirectory({ items, zones, s }) {
  const [f, setF] = useState({ q: '', zone: 'all', front: 'all', rental: 'all', pets: 'all', year: 'all', hoa: 'all' });
  const [view, setView] = useState('list');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const list = useMemo(() => items.filter((b) => {
    if (f.q && !b.name.toLowerCase().includes(f.q.toLowerCase())) return false;
    if (f.zone !== 'all' && b.zone !== f.zone) return false;
    if (f.front !== 'all' && String(b.oceanfront) !== f.front) return false;
    if (f.rental !== 'all' && b.rental !== f.rental) return false;
    if (f.pets !== 'all' && String(b.pets) !== f.pets) return false;
    if (f.year !== 'all' && !(b.year >= YEARS[f.year][0] && b.year < YEARS[f.year][1])) return false;
    if (f.hoa !== 'all' && !(b.hoaPsf != null && b.hoaPsf >= HOA[f.hoa][0] && b.hoaPsf < HOA[f.hoa][1])) return false;
    return true;
  }), [items, f]);

  const sel = (k, label, opts) => (
    <div className="f">
      <label htmlFor={`bd-${k}`} className="flabel">{label}</label>
      <select id={`bd-${k}`} className="input" value={f[k]} onChange={set(k)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  // Schematic map: project lat/lng into the box that contains all mapped buildings.
  const pts = list.filter((b) => b.lat != null && b.lng != null);
  const lats = pts.map((b) => b.lat), lngs = pts.map((b) => b.lng);
  const box = pts.length ? { a: Math.min(...lats) - 0.02, b: Math.max(...lats) + 0.02, c: Math.min(...lngs) - 0.02, d: Math.max(...lngs) + 0.02 } : null;
  const pos = (b) => ({ x: 5 + ((b.lng - box.c) / (box.d - box.c)) * 90, y: 5 + ((box.b - b.lat) / (box.b - box.a)) * 90 });

  return (
    <>
      <section className="filters">
        <form className="container filters-in" aria-label={s.filters} onSubmit={(e) => e.preventDefault()}>
          <div className="f"><label htmlFor="bd-q" className="flabel">{s.search}</label><input id="bd-q" className="input" type="search" value={f.q} onChange={set('q')} placeholder={s.searchPh} /></div>
          {sel('zone', s.f_zone, [['all', s.any_zone], ...zones])}
          {sel('front', s.f_front, [['all', s.any_front], ['true', s.oceanfront], ['false', s.other]])}
          {sel('rental', s.f_rental, [['all', s.any], ['30d', s.rent_min_30d], ['6m', s.rent_min_6m], ['1y', s.rent_min_1y], ['none', s.rent_min_none]])}
          {sel('pets', s.f_pets, [['all', s.any], ['true', s.pets_yes], ['false', s.pets_no]])}
          {sel('year', s.f_year, [['all', s.any], ['old', s.y_old], ['mid', s.y_mid], ['new', s.y_new]])}
          {sel('hoa', s.f_hoa_range, [['all', s.any], ['low', s.h_low], ['mid', s.h_mid], ['high', s.h_high]])}
          <div className="seg" role="group" aria-label={s.view_list + ' / ' + s.view_map}>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>{s.view_list}</button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>{s.view_map}</button>
          </div>
        </form>
      </section>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 'var(--section)' }}>
        <p className="small" style={{ fontSize: 14, marginBottom: 24 }} aria-live="polite">{list.length} {s.buildings_count}</p>
        {items.length === 0 ? <p className="sand" style={{ padding: 40, textAlign: 'center' }}>{s.none}</p>
          : list.length === 0 ? <p className="sand" style={{ padding: 40, textAlign: 'center' }}>{s.empty}</p>
          : view === 'list' ? (
            <div className="grid" style={{ '--min': '300px', gap: '44px 28px' }}>{list.map((b) => <BuildingCard key={b.slug} b={b} s={s} />)}</div>
          ) : (
            <div className="stack">
              <div className="schematic" role="img" aria-label={s.mapNote}>
                <span className="schematic-sea">{s.ocean}</span>
                {box && pts.map((b) => { const p = pos(b); return (
                  <Link key={b.slug} href={b.href} className="pin" style={{ left: `${p.x}%`, top: `${p.y}%` }}><span className="pin-dot" />{b.name}</Link>
                ); })}
              </div>
              <p className="small">{s.mapNote}</p>
            </div>
          )}
      </div>
    </>
  );
}
