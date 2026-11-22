import Link from 'next/link';
import { path } from '../lib/routes';
import { getSite, t as tt, L, pending, waHref, telHref, isProduction } from '../lib/content';
import Motion from './Motion';

const NAV = ['listings', 'developments', 'buildings', 'areas', 'international', 'sell', 'market', 'about'];
const MENU_EXTRA = ['rentals', 'puntacana', 'contact'];

export function Icon({ name, size = 18 }) {
  const p = { 'aria-hidden': 'true', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 };
  if (name === 'phone') return <svg {...p}><path d="M5 3h4l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z" /></svg>;
  if (name === 'wa') return <svg {...p}><path d="M4 20l1.3-4A8 8 0 1112 20a8 8 0 01-4-1.1L4 20z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" /></svg>;
  if (name === 'cal') return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
  if (name === 'arrow') return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  if (name === 'download') return <svg {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>;
  return null;
}

// WhatsApp link with a page-specific prefilled message; falls back to the contact page.
export function wa(lang, text) {
  return waHref(text || tt(lang).wa_default) || path(lang, 'contact');
}

function Val({ v, lang }) {
  if (v) return <>{v}</>;
  return <span className="pending">{pending(null, lang)}</span>;
}

// `overlay`: the page opens with a full-width image hero, so the header sits transparent over it.
export default function Shell({ lang, active, alt, waText, overlay = false, children }) {
  const t = tt(lang);
  const site = getSite();
  const other = lang === 'es' ? 'en' : 'es';
  const waLink = wa(lang, waText);
  const tel = telHref() || path(lang, 'contact');
  const label = (k) => (k === 'international' ? t.nav_international_short : k === 'developments' ? t.nav_developments_short : t[`nav_${k}`]);
  const nav = NAV.map((k) => ({ k, href: path(lang, k), label: label(k) }));
  const menu = [...NAV, ...MENU_EXTRA].map((k) => ({ k, href: path(lang, k), label: t[`nav_${k}`] }));
  const brokerName = site.brokerage.nameVerified ? site.brokerage.name : null;

  return (
    <>
      <a className="skip" href="#main">{lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
      {!isProduction && <div className="preview-bar">{t.preview_banner}</div>}
      <div className="utility">
        <div className="utility-in">
          <span><Val v={site.agent.name} lang={lang} /></span>
          <span aria-hidden="true">·</span>
          <span><Val v={brokerName} lang={lang} /></span>
        </div>
      </div>
      <header className={overlay ? 'header header-overlay' : 'header'}>
        <div className="header-in">
          <Link href={path(lang, 'home')} className="logo">
            <span className="logo-word">BAYLARA</span>
            <span className="logo-sub">REAL ESTATE</span>
          </Link>
          <nav className="nav" aria-label={t.main_nav}>
            {nav.map((n) => <Link key={n.k} href={n.href} aria-current={active === n.k ? 'page' : undefined}>{n.label}</Link>)}
          </nav>
          <div className="header-actions">
            <div className="langs" role="group" aria-label={lang === 'es' ? 'Idioma' : 'Language'}>
              {['en', 'es'].map((l) => l === lang
                ? <span key={l} className="on" aria-current="true">{l.toUpperCase()}</span>
                : <Link key={l} href={alt} hrefLang={other} lang={other}>{l.toUpperCase()}</Link>)}
            </div>
            <a className="btn btn-primary btn-wa" href={waLink} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
            <details className="menu">
              <summary aria-label={t.menu}>
                <svg className="ic-open" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
                <svg className="ic-close" aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19" /></svg>
              </summary>
              <nav className="menu-panel" aria-label={t.main_nav}>
                {menu.map((n) => <Link key={n.k} href={n.href} aria-current={active === n.k ? 'page' : undefined}>{n.label}</Link>)}
                <a className="btn btn-primary" href={waLink} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main id="main" className={overlay ? 'under-header' : undefined}>{children}</main>
      <Motion />

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-col" style={{ gap: 16 }}>
            <span className="logo-word" style={{ fontSize: 30 }}>BAYLARA</span>
            <span className="rule" style={{ width: 40 }} />
            <p style={{ color: 'var(--on-navy-2)', lineHeight: 1.65 }}>{t.footer_tag}</p>
          </div>
          <nav className="footer-col" aria-label={t.explore}>
            <h2>{t.explore}</h2>
            {menu.map((n) => <Link key={n.k} href={n.href}>{n.label}</Link>)}
          </nav>
          <div className="footer-col">
            <h2>{t.nav_contact}</h2>
            {/* Florida 61J2-10.025: the brokerage name goes with every contact point. */}
            <a href={waLink} data-track="whatsapp">WhatsApp · <Val v={site.contact.whatsapp} lang={lang} /><span className="via" data-broker><Val v={brokerName} lang={lang} /></span></a>
            <a href={tel} data-track="call">{t.phone} · <Val v={site.contact.phone} lang={lang} /><span className="via" data-broker><Val v={brokerName} lang={lang} /></span></a>
            {site.contact.publicEmail && <a href={`mailto:${site.contact.publicEmail}`}>{site.contact.publicEmail}<span className="via" data-broker><Val v={brokerName} lang={lang} /></span></a>}
            {site.brokerage.address && (
              <address className="footer-office">
                <span className="footer-office-k">{t.office}</span>
                <strong><Val v={brokerName} lang={lang} /></strong>
                <span>{site.brokerage.address}</span>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${brokerName || ''} ${site.brokerage.address}`)}`} target="_blank" rel="noopener">{t.directions} →</a>
              </address>
            )}
          </div>
          <div className="footer-col">
            <h2>{t.legal}</h2>
            <Link href={path(lang, 'privacy')}>{t.nav_privacy}</Link>
            <Link href={path(lang, 'terms')}>{t.nav_terms}</Link>
            <Link href={path(lang, 'accessibility')}>{t.nav_accessibility}</Link>
          </div>
        </div>
        <div className="footer-legal">
          <div className="container footer-legal-in">
            <div className="eho">
              <svg role="img" aria-label="Equal Housing Opportunity" width="52" height="52" viewBox="0 0 44 44" fill="none"><path d="M4 21 L22 5 L40 21 V39 H4 Z" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" /><rect x="13" y="20" width="18" height="4.2" fill="currentColor" /><rect x="13" y="28" width="18" height="4.2" fill="currentColor" /></svg>
              <span>EQUAL HOUSING<br />OPPORTUNITY</span>
            </div>
            <div className="footer-text">
              <p><strong>{t.agent_label}: </strong><Val v={site.agent.name} lang={lang} /> · {L(site.agent.title, lang)}</p>
              <p><strong>{t.brokerage}: </strong><Val v={brokerName} lang={lang} />{site.brokerage.licenseNumber ? ` · ${t.license} ${site.brokerage.licenseNumber}` : ''} · <Val v={site.brokerage.address} lang={lang} />{site.brokerage.phone ? ` · ${site.brokerage.phone}` : ''}</p>
              <p>{t.eho_text}</p>
              <p>{t.listing_disclaimer} {L(site.mlsDisclaimer, lang) || ''}{site.drPartnerBrokerage ? ` ${t.pc_partner} ${site.drPartnerBrokerage}.` : ''}</p>
              <p>© {new Date().getFullYear()} Baylara</p>
            </div>
          </div>
        </div>
      </footer>

      <nav className="stickybar" aria-label={lang === 'es' ? 'Contacto rápido' : 'Quick contact'}>
        <span className="stickybar-broker" data-broker-sticky><Val v={brokerName} lang={lang} /></span>
        <a href={waLink} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
        <a href={tel} data-track="call"><Icon name="phone" />{t.call}</a>
      </nav>
    </>
  );
}
