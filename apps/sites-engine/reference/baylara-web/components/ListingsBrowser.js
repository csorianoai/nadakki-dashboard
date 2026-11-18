'use client';
import { useEffect, useMemo, useState } from 'react';
import ListingCard from './ListingCard';

const RANGES = { all: [0, Infinity], u1: [0, 1e6], '1to3': [1e6, 3e6], '3to5': [3e6, 5e6], o5: [5e6, Infinity] };

// Client-side filters over a small, pre-localized list. When an IDX feed is connected, swap the
// data source for the feed's search endpoint and keep this UI.
export default function ListingsBrowser({ items, strings, zones, initialZone = 'all' }) {
  const [f, setF] = useState({ zone: initialZone, type: 'all', price: 'all', beds: '0', sort: 'new' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Accept filters from the home-page search (?zone=&type=&price=).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const next = {};
    for (const k of ['zone', 'type', 'price', 'beds']) if (q.get(k)) next[k] = q.get(k);
    if (Object.keys(next).length) setF((cur) => ({ ...cur, ...next }));
  }, []);

  const list = useMemo(() => {
    const r = RANGES[f.price] || RANGES.all;
    let out = items.filter((x) =>
      (f.zone === 'all' || x.zone === f.zone) &&
      (f.type === 'all' || x.type === f.type) &&
      (x.priceValue == null || (x.priceValue >= r[0] && x.priceValue < r[1])) &&
      (x.beds == null || x.beds >= Number(f.beds))
    );
    if (f.sort === 'asc') out = [...out].sort((a, b) => (a.priceValue ?? 0) - (b.priceValue ?? 0));
    if (f.sort === 'desc') out = [...out].sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0));
    return out;
  }, [items, f]);

  const S = strings;
  const field = (k, label, opts) => (
    <div className="f">
      <label htmlFor={`f-${k}`} className="label" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</label>
      <select id={`f-${k}`} className="input" value={f[k]} onChange={set(k)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <>
      <section className="filters">
        <form className="container filters-in" aria-label={S.filters} onSubmit={(e) => e.preventDefault()}>
          {field('zone', S.f_zone, [['all', S.any_zone], ...zones])}
          {field('type', S.f_type, [['all', S.any_type], ['condo', S.type_condo], ['penthouse', S.type_penthouse], ['house', S.type_house], ...(items.some((x) => x.kind === 'development') ? [['development', S.type_development]] : [])])}
          {field('price', S.f_price, [['all', S.any_price], ['u1', S.p_u1], ['1to3', '$1M – $3M'], ['3to5', '$3M – $5M'], ['o5', '$5M +']])}
          {field('beds', S.f_beds, [['0', S.any], ['1', '1+'], ['2', '2+'], ['3', '3+'], ['4', '4+']])}
          {field('sort', S.f_sort, [['new', S.sort_new], ['asc', S.sort_asc], ['desc', S.sort_desc]])}
        </form>
      </section>
      <div className="container" style={{ paddingTop: 40 }}>
        <p className="small" style={{ fontSize: 14, marginBottom: 24 }} aria-live="polite">{list.length} {S.results}</p>
        {list.length ? (
          <div className="pgrid">
            {list.map((x, i) => <ListingCard key={x.slug} item={x} strings={S} priority={i === 0} />)}
          </div>
        ) : (
          <p className="sand" style={{ padding: 40, textAlign: 'center' }}>{items.length ? S.no_results : S.no_listings}</p>
        )}
      </div>
    </>
  );
}
