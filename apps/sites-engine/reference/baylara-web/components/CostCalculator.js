'use client';
import { useState } from 'react';

const num = (v) => { const n = Number(String(v).replace(/[^\d.]/g, '')); return Number.isFinite(n) && String(v).trim() !== '' ? n : null; };
const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');

// Monthly cost calculator. Starts from the listing's real values when present; empty otherwise (no estimates invented).
export default function CostCalculator({ hoa, tax, s }) {
  const [v, setV] = useState({ hoa: hoa ?? '', tax: tax ?? '', ins: '' });
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const h = num(v.hoa), tx = num(v.tax), i = num(v.ins);
  const total = h != null && tx != null && i != null ? h + tx / 12 + i / 12 : null;
  const field = (k, label) => (
    <div className="f">
      <label htmlFor={`calc-${k}`}>{label}</label>
      <input id={`calc-${k}`} className="input" inputMode="decimal" value={v[k]} onChange={set(k)} placeholder="$" />
    </div>
  );
  return (
    <div className="calc">
      <div className="fields" style={{ '--min': '180px' }}>
        {field('hoa', s.calc_hoa)}
        {field('tax', s.calc_tax)}
        {field('ins', s.calc_ins)}
      </div>
      <div className="calc-total" aria-live="polite">
        <span className="eyebrow" style={{ color: 'var(--muted)' }}>{s.calc_total}</span>
        <span className="price">{total != null ? usd(total) : '—'}</span>
        {total == null && <span className="small">{s.calc_empty}</span>}
      </div>
      <p className="small">{s.calc_note}</p>
    </div>
  );
}
