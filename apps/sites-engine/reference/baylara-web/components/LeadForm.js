'use client';
import { useEffect, useState } from 'react';
import { trackLead } from './track';

// Short, intent-aware lead form.
// mode: buyer | tenant | seller (3 steps) | consult | property | alerts | market | saved
// `chooser` shows the buyer/seller/tenant selector (contact page). `hidden` adds context fields (building, listing, search).
// Works without React: the form is a real POST to /api/lead (never GET), and the API answers a native post
// with a redirect to a success or error page. Until the page is ready the submit button is disabled; a
// <noscript> button covers JavaScript turned off, and a small inline timer re-enables the button if the
// scripts never arrive, so the visitor can always fall back to the native post.
export default function LeadForm({ lang, mode: initial = 'buyer', chooser = false, id = 'lf', s, o, waLink, privacyHref, hidden = {} }) {
  const [mode, setMode] = useState(initial);
  const [step, setStep] = useState(0);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [values, setValues] = useState({});
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const remember = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const needsPhoneConsent = !['market'].includes(mode);
  // Before the page is ready (or without JavaScript) the seller form shows all its fields on one page.
  const steps = mode === 'seller' && ready ? 3 : 1;

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { ...values, ...Object.fromEntries(fd.entries()), ...hidden };
    data.intent = mode;
    data.consent = fd.get('consent') === 'on' || values.consent === true;
    data.lang = lang;
    data.page = location.pathname;
    if (steps > 1 && step < steps - 1) { setValues(data); setStep(step + 1); return; }
    const hasContact = String(data.email || '').trim() || String(data.phone || '').trim();
    if ((mode !== 'market' && !String(data.name || '').trim()) || !hasContact) { setError(s.need_contact); return; }
    setState('sending'); setError('');
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(String(res.status));
      trackLead(mode, lang);
      setState('sent');
    } catch {
      setState('error'); setError(s.send_error);
    }
  }

  if (state === 'sent') {
    return (
      <div className="form" role="status">
        <span className="rule" style={{ width: 40, background: 'var(--gold)' }} />
        <p className="h3">{s.thanks}</p>
        <p className="body">{s.thanks_text}</p>
      </div>
    );
  }

  const F = (name, label, type = 'text', auto, extra = {}) => (
    <div className={`f${extra.full ? ' full' : ''}`}>
      <label htmlFor={`${id}-${name}`}>{label}</label>
      <input id={`${id}-${name}`} name={name} type={type} autoComplete={auto} className="input" defaultValue={values[name] || ''} onChange={remember} min={extra.min} />
    </div>
  );
  const S = (name, label, list, extra = {}) => (
    <div className={`f${extra.full ? ' full' : ''}`}>
      <label htmlFor={`${id}-${name}`}>{label}</label>
      <select id={`${id}-${name}`} name={name} className="input" defaultValue={values[name] || list[0]} onChange={remember}>
        {list.map((x) => <option key={x}>{x}</option>)}
      </select>
    </div>
  );
  const contact = (
    <>
      {mode !== 'market' && F('name', s.f_name, 'text', 'name')}
      {F('email', s.f_email, 'email', 'email')}
      {mode !== 'market' && F('phone', s.f_phone, 'tel', 'tel')}
    </>
  );
  const today = new Date().toISOString().slice(0, 10);

  let fields;
  if (mode === 'buyer') fields = <>{S('timeline', s.f_timeline, o.timeline)}{S('payment', s.f_payment, o.payment)}{F('country', s.f_country, 'text', 'country-name')}{contact}</>;
  else if (mode === 'tenant') fields = <>{S('area', s.f_area, o.zones)}{S('rentBudget', s.f_rent, o.rent)}{F('moveIn', s.f_move, 'month')}{contact}</>;
  else if (mode === 'consult') fields = <>{F('date', s.f_date, 'date', undefined, { min: today })}{S('time', s.f_time, o.times)}{S('topic', s.f_topic, o.topics)}{contact}</>;
  else if (mode === 'property') fields = (
    <>
      {F('name', s.f_first, 'text', 'given-name')}
      {F('lastName', s.f_lastname, 'text', 'family-name')}
      {F('email', s.f_email, 'email', 'email')}
      {F('phone', s.f_phone, 'tel', 'tel')}
      <div className="f full">
        <label htmlFor={`${id}-message`}>{s.f_message}</label>
        <textarea id={`${id}-message`} name="message" rows={4} className="input textarea" defaultValue={values.message || ''} onChange={remember} />
      </div>
    </>
  );
  else if (mode === 'alerts' || mode === 'saved') fields = <>{S('channel', s.f_channel, o.channels)}{contact}</>;
  else if (mode === 'market') fields = <>{S('area', s.f_area, o.zones)}{contact}</>;
  else if (mode === 'seller') {
    fields = [
      <>{F('address', s.f_address, 'text', 'street-address', { full: true })}{F('building', s.f_building)}{S('propertyType', s.f_ptype, o.ptype)}</>,
      <>{S('goal', s.f_goal, o.goal)}{S('timeline', s.f_timeline, o.timeline)}{F('country', s.f_country, 'text', 'country-name')}</>,
      contact
    ];
    fields = steps === 1 ? <>{fields}</> : fields[step];
  }
  const submitLabel = steps > 1 && step < steps - 1 ? s.next : s[`submit_${mode}`] || s.submit_buyer;
  const last = step === steps - 1;

  return (
    <form className="form" method="post" action="/api/lead" onSubmit={submit} noValidate aria-label={s.form_label} data-lead data-ready={ready ? '' : undefined}>
      {!chooser && <input type="hidden" name="intent" value={mode} />}
      <input type="hidden" name="lang" value={lang} />
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v ?? ''} />)}
      {chooser && (
        <fieldset className="intents">
          <legend>{s.form_iam}</legend>
          <div className="chips">
            {['buyer', 'seller', 'tenant'].map((k) => (
              <label key={k}><input type="radio" name="intent" value={k} checked={mode === k} onChange={() => { setMode(k); setStep(0); }} style={{ accentColor: 'var(--navy)', margin: 0 }} /><span>{s[`intent_${k}`]}</span></label>
            ))}
          </div>
        </fieldset>
      )}
      {steps > 1 && (
        <div className="stepper" aria-live="polite">
          <span>{s.step} {step + 1} {s.of} {steps} · {[s.step_property, s.step_goal, s.step_contact][step]}</span>
          <span className="stepper-bar"><span style={{ width: `${((step + 1) / steps) * 100}%` }} /></span>
        </div>
      )}
      <div className="fields" key={`${mode}-${step}`}>{fields}</div>
      <div className="hp" aria-hidden="true"><label htmlFor={`${id}-website`}>Website</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" /></div>
      {last && needsPhoneConsent && (
        <div className="consent">
          <input id={`${id}-consent`} name="consent" type="checkbox" defaultChecked={false} />
          <label htmlFor={`${id}-consent`}>{s.consent} <a href={privacyHref}>{s.nav_privacy}</a></label>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="btn-row">
        {step > 0 && <button type="button" className="btn btn-outline" onClick={() => setStep(step - 1)}>{s.back}</button>}
        <button type="submit" className="btn btn-primary" data-wait disabled={!ready || state === 'sending'} suppressHydrationWarning>{state === 'sending' ? s.sending : submitLabel}</button>
        <noscript><button type="submit" className="btn btn-primary">{submitLabel}</button><style>{'form[data-lead] button[data-wait]{display:none}'}</style></noscript>
        {last && waLink && mode !== 'market' && <a href={waLink} className="btn btn-outline" data-track="whatsapp">{s.write_whatsapp}</a>}
      </div>
      {last && <p className="small" style={{ fontSize: 11.5 }}>{s.form_note}</p>}
      {/* If the scripts have not taken over after 8 s, re-enable the button: the native POST still delivers the contact. */}
      <script dangerouslySetInnerHTML={{ __html: `setTimeout(function(){document.querySelectorAll('form[data-lead]:not([data-ready]) button[data-wait]').forEach(function(b){b.disabled=false})},8000)` }} />
    </form>
  );
}
