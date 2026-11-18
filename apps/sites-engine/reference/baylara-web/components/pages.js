import Link from 'next/link';
import Image from 'next/image';
import { path } from '../lib/routes';
import { getSite, getPage, getLegal, getListings, getListing, getDevelopments, getZones, getZone, getBuildings, getBuilding, buildingCompleteness, getReports, getReport, L, V, t as tt, formatPrice, pending, monthLabel, waHref, telHref, isProduction } from '../lib/content';
import { cardView, devCardView, developmentPhotos, cardStrings, buildingView, buildingStrings, zoneName, indicators } from '../lib/view';
import ListingCard from './ListingCard';
import BuildingCard from './BuildingCard';
import ListingsBrowser from './ListingsBrowser';
import BuildingDirectory from './BuildingDirectory';
import SavedSearch from './SavedSearch';
import HeroVideo from './HeroVideo';
import HeroSlides from './HeroSlides';
import { ListingPage, DevelopmentsIndex, DevelopmentPage, OfficeLine } from './property';
import Lead from './Lead';
import Media from './Media';
import { Icon, wa } from './Shell';
import { slot, zoneMedia, buildingMedia, agentMedia } from '../lib/media';

const fill = (s, map) => Object.keys(map).reduce((a, k) => a.replaceAll(`{${k}}`, map[k]), s || '');

/* ---------- Shared pieces ---------- */
// Full-width image header with the title over it. The image is the first visible content (preloaded).
function ImageHero({ m, size = 'page', video, top, eyebrow, title, lead, children, titleStyle }) {
  return (
    <section className={`ihero ihero-${size}`}>
      <div className="ihero-media">
        <Media m={m} priority decorative sizes="100vw" />
        {video}
      </div>
      <div className="container ihero-in">
        {top}
        <span className="rule" />
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1 ihero-title" style={titleStyle}>{title}</h1>
        {lead && <p className="sub">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

// Full-bleed image between sections.
function Band({ m }) {
  if (!m) return null;
  return <figure className="band" data-reveal><Media m={m} sizes="100vw" /></figure>;
}

function Hero({ eyebrow, title, lead, navy, children }) {
  return (
    <section className={`page-hero ${navy ? 'navy' : 'sand'}`}>
      <div className="container stack">
        <span className="rule" />
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1" style={{ maxWidth: 940 }}>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

function Head({ eyebrow, title, right }) {
  return (
    <div className="split" data-reveal>
      <div className="stack" style={{ gap: 12, maxWidth: 760 }}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h2">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Cards({ items, lang }) {
  const s = cardStrings(lang);
  return <div className="pgrid">{items.map((x) => <ListingCard key={x.slug} item={cardView(x, lang)} strings={s} />)}</div>;
}

function BCards({ items, lang }) {
  const s = buildingStrings(lang);
  return <div className="grid" style={{ '--min': '300px', gap: '44px 28px' }}>{items.map((b) => <BuildingCard key={b.slug} b={buildingView(b, lang)} s={s} />)}</div>;
}

// "Fuente: X · fecha: Y" for a block, or for a single datum that carries its own source.
function Src({ d, lang }) {
  if (!d || !d.source) return null;
  const t = tt(lang);
  return <p className="src">{t.source}: {d.source}{d.date ? ` · ${t.as_of} ${d.date}` : ''}</p>;
}
function Datum({ d, lang }) {
  const v = V(d);
  if (v == null) return null;
  const own = d && typeof d === 'object' && 'value' in d && d.source;
  return <>{L(v, lang)}{own && <span className="src-inline"> ({d.source}{d.date ? `, ${d.date}` : ''})</span>}</>;
}

function Steps({ items, lang, navy }) {
  return (
    <ol className="boxed" style={{ '--min': '320px' }}>
      {items.map((s, i) => (
        <li key={i}>
          <span className="num">{String(i + 1).padStart(2, '0')}</span>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{L(s.h, lang)}</h3>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: navy ? 'var(--on-navy)' : 'var(--text)' }}>{L(s.p, lang)}</p>
        </li>
      ))}
    </ol>
  );
}

function ContactBlock({ lang, title, text, mode = 'buyer', id, chooser, navy, waText, hidden }) {
  const t = tt(lang);
  const site = getSite();
  return (
    <section id="contact-form" className={`section ${navy ? 'navy' : 'sand'}`}>
      <div className="container row">
        <div className="side stack" style={{ gap: 20 }}>
          <span className="rule" />
          <h2 className="h2">{title}</h2>
          {text && <p className="lead">{text}</p>}
          <div className="btn-row">
            <a className={`btn ${navy ? 'btn-sand' : 'btn-primary'}`} href={wa(lang, waText)} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
            {site.contact.bookingUrl
              ? <a className={`btn ${navy ? 'btn-outline-light' : 'btn-outline'}`} href={site.contact.bookingUrl} target="_blank" rel="noopener"><Icon name="cal" />{t.book_title}</a>
              : <a className={`btn ${navy ? 'btn-outline-light' : 'btn-outline'}`} href={path(lang, 'contact') + '#book'}><Icon name="cal" />{t.book_title}</a>}
          </div>
        </div>
        <div className="grow"><Lead lang={lang} mode={mode} id={id} chooser={chooser} waText={waText} hidden={hidden} /></div>
      </div>
    </section>
  );
}

function Report({ r, lang, zoneFilter, compact }) {
  const t = tt(lang);
  const zones = (r.zones || []).filter((z) => !zoneFilter || z.zone === zoneFilter);
  return (
    <div className="stack" style={{ gap: 24 }}>
      {r.sample && <span className="badge-sample">{t.sample_block}</span>}
      <div className="grid" style={{ '--min': '280px', gap: 20 }}>
        {zones.map((z) => {
          const zn = getZones().find((x) => x.slug === z.zone);
          const ind = indicators(z, lang).slice(0, 3);
          if (!ind.length) return null;
          return (
            <div key={z.zone} className="kpi">
              <p className="eyebrow" style={{ color: 'var(--navy)' }}>{zoneName(zn, lang) || z.zone}</p>
              <dl>{ind.map((i) => <div key={i.k}><dt>{i.label}</dt><dd>{i.value}</dd></div>)}</dl>
            </div>
          );
        })}
      </div>
      {!compact && r.buildings?.length > 0 && (
        <div className="table-wrap"><table className="table">
          <caption className="sr">{lang === 'es' ? 'Indicadores por edificio' : 'Indicators by building'}</caption>
          <thead><tr><th scope="col">{lang === 'es' ? 'Edificio' : 'Building'}</th>{['closedSales', 'pricePerSqft', 'activeListings', 'daysOnMarket'].map((k) => <th key={k} scope="col">{t[`ind_${k}`]}</th>)}</tr></thead>
          <tbody>{r.buildings.map((b) => { const bd = getBuilding(b.building); const ind = Object.fromEntries(indicators(b, lang).map((i) => [i.k, i.value])); return (
            <tr key={b.building}><th scope="row">{bd ? <Link href={path(lang, 'buildings', bd.slug)}>{bd.name}</Link> : b.building}</th>{['closedSales', 'pricePerSqft', 'activeListings', 'daysOnMarket'].map((k) => <td key={k}>{ind[k] ?? '—'}</td>)}</tr>
          ); })}</tbody>
        </table></div>
      )}
      <Src d={r} lang={lang} />
    </div>
  );
}

/* ---------- Home ---------- */
export function Home({ lang }) {
  const p = getPage('home');
  const t = tt(lang);
  const site = getSite();
  const heroImg = slot('home.hero', lang);
  const heroVideo = slot('home.heroVideo', lang);
  // Slideshow of authorized project renders (in production getDevelopments only returns authorized projects).
  // Order: Sunny Isles, Bal Harbour, Surfside, Miami Beach (incl. South Beach); one render per project, marked heroImages.
  const HERO_AREAS = ['Sunny Isles Beach', 'Bal Harbour', 'Surfside', 'Miami Beach', 'South Beach'];
  const slides = getDevelopments()
    .filter((d) => d.heroImages?.length && (d.sample || HERO_AREAS.includes(d.area)))
    .sort((a, b) => HERO_AREAS.indexOf(a.area) - HERO_AREAS.indexOf(b.area))
    .flatMap((d) => developmentPhotos({ ...d, images: d.heroImages.slice(0, 1) }, lang))
    .slice(0, 6);
  const allB = getBuildings();
  const featuredB = allB.filter((b) => b.featured).slice(0, 6);
  const sale = getListings().filter((x) => x.kind === 'sale' && x.zone !== 'punta-cana');
  const exclusive = sale.filter((x) => x.exclusive).slice(0, 3);
  const props = exclusive.length ? exclusive : sale.filter((x) => x.featured).slice(0, 3);
  const report = getReports()[0];
  const reviews = site.googleReviews?.items || [];
  const brokerName = site.brokerage.nameVerified ? site.brokerage.name : null;
  const trust = [
    L(p.trust.bilingual, lang),
    L(p.trust.license, lang),
    pending(brokerName, lang),
    L(p.trust.specialist, lang),
    site.trust?.countriesServed ? fill(L(p.trust.countries, lang), { n: site.trust.countriesServed }) : null,
    site.trust?.whatsappResponseHours ? fill(L(p.trust.response, lang), { n: site.trust.whatsappResponseHours }) : null
  ].filter(Boolean);

  return (
    <>
      <ImageHero
        m={slides.length > 1 ? null : heroImg}
        size="home"
        video={slides.length > 1 ? <HeroSlides slides={slides} /> : <HeroVideo src={heroVideo?.src} />}
        eyebrow={p.eyebrow}
        title={L(p.title, lang)}
        lead={L(p.sub, lang)}
      >
        <div className="paths">
          {p.paths.map((x) => (
            <Link key={x.key} href={path(lang, x.key)} className="path">
              <span className="path-label">{L(x.label, lang)}</span>
              <span className="path-text">{L(x.text, lang)}</span>
              <Icon name="arrow" size={22} />
            </Link>
          ))}
        </div>
        <Link href={path(lang, 'rentals')} className="hero-rent">{L(p.rentLink, lang)} → {t.nav_rentals}</Link>
      </ImageHero>

      <section className="trust" aria-label={lang === 'es' ? 'Datos de confianza' : 'Trust facts'}>
        <ul className="container trust-in">{trust.map((x) => <li key={x} data-reveal>{x}</li>)}</ul>
      </section>

      {featuredB.length > 0 && (
        <section className="section section-xl">
          <div className="container stack-lg">
            <Head eyebrow={L(p.bEyebrow, lang)} title={L(p.bTitle, lang)} right={<Link className="link" href={path(lang, 'buildings')}>{fill(L(p.bAll, lang), { n: allB.length })}</Link>} />
            <BCards items={featuredB} lang={lang} />
          </div>
        </section>
      )}

      <Band m={slot('home.band.water', lang)} />

      {props.length > 0 && (
        <section className="section sand">
          <div className="container stack-lg">
            <Head eyebrow={exclusive.length ? L(p.pExclusive, lang) : L(p.pMonth, lang)} title={L(p.pTitle, lang)} right={<Link className="link" href={path(lang, 'listings')}>{t.view_all}</Link>} />
            <Cards items={props} lang={lang} />
            {!exclusive.length && <p className="small">{t.mls_attr} {L(site.mlsDisclaimer, lang) || ''}</p>}
          </div>
        </section>
      )}

      <section className="section section-xl navy">
        <div className="container stack-lg">
          <Head eyebrow={L(p.iEyebrow, lang)} title={L(p.iTitle, lang)} />
          <div className="boxed" style={{ '--min': '280px' }}>
            {p.iBlocks.map((b, i) => (
              <div key={i}><span className="num">{String(i + 1).padStart(2, '0')}</span><h3 className="h3" style={{ fontSize: 24 }}>{L(b.h, lang)}</h3><p style={{ color: 'var(--on-navy)', lineHeight: 1.7 }}>{L(b.p, lang)}</p></div>
            ))}
          </div>
          <div className="btn-row">
            <Link className="btn btn-sand" href={path(lang, 'international')}>{L(p.iMore, lang)}</Link>
            {L(site.downloads?.buyerGuide, lang) && <a className="btn btn-outline-light" href={L(site.downloads.buyerGuide, lang)} download><Icon name="download" />{t.download}</a>}
          </div>
        </div>
      </section>

      <Band m={slot('home.band.international', lang)} />

      {report && (
        <section className="section section-xl">
          <div className="container stack-lg">
            <Head eyebrow={`${L(p.mEyebrow, lang)} · ${monthLabel(report.month, lang)}`} title={L(report.title, lang)} right={<Link className="link" href={path(lang, 'market', report.slug)}>{L(p.mMore, lang)}</Link>} />
            <Report r={report} lang={lang} compact />
          </div>
        </section>
      )}

      <section className="section sand">
        <div className="container row" style={{ alignItems: 'center' }}>
          {agentMedia(lang, site.agent.name) && <div className="portrait"><Media m={agentMedia(lang, site.agent.name)} alt={site.agent.name || ''} sizes="(max-width: 767px) 100vw, 480px" /></div>}
          <div className="grow stack" style={{ gap: 20 }}>
            <p className="eyebrow">{L(p.aEyebrow, lang)}</p>
            <h2 className="h2">{pending(site.agent.name, lang)}</h2>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{L(site.agent.title, lang)} · {pending(brokerName, lang)}</p>
            <p className="body">{L(site.agent.story, lang) || L(p.aText, lang)}</p>
            <div className="chips">{site.agent.languages.map((l) => <span key={l} className="chip static">{l}</span>)}{getZones().slice(0, 3).map((z) => <Link key={z.slug} className="chip" href={path(lang, 'areas', z.slug)}>{zoneName(z, lang)}</Link>)}</div>
            <Link className="link" href={path(lang, 'about')}>{L(p.aMore, lang)}</Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="section">
          <div className="container stack-lg">
            <Head eyebrow={L(p.rEyebrow, lang)} title={L(p.rTitle, lang)} right={site.googleReviews.profileUrl && <a className="link" href={site.googleReviews.profileUrl} target="_blank" rel="noopener">Google</a>} />
            <div className="grid" style={{ '--min': '300px', gap: 24 }}>
              {reviews.map((q, i) => (
                <figure key={i} className="review"><blockquote className="serif">{q.text}</blockquote><figcaption className="small">{q.author} · Google · {q.date}</figcaption></figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <Band m={slot('home.band.contact', lang)} />

      <ContactBlock lang={lang} title={L(p.cTitle, lang)} text={L(p.cText, lang)} id="home" navy />
    </>
  );
}

/* ---------- Listings / rentals ---------- */
function browserStrings(lang) {
  const t = tt(lang);
  return { ...cardStrings(lang), filters: lang === 'es' ? 'Filtrar propiedades' : 'Filter properties', f_zone: t.f_zone, f_type: t.f_type, f_price: t.f_price, f_beds: t.f_beds, f_sort: t.f_sort, any_zone: t.any_zone, any_type: t.any_type, any_price: t.any_price, any: t.any, sort_new: t.sort_new, sort_asc: t.sort_asc, sort_desc: t.sort_desc, type_condo: t.type_condo, type_house: t.type_house, type_penthouse: t.type_penthouse, type_development: t.type_development, p_u1: lang === 'es' ? 'Hasta $1M' : 'Up to $1M', results: t.results, no_results: t.no_results, no_listings: t.no_listings };
}

function Saved({ lang, slug, search }) {
  const t = tt(lang);
  return (
    <SavedSearch slug={slug} threshold={2} title={t.saved_title} text={t.saved_text} dismissLabel={t.dismiss}>
      <Lead lang={lang} mode="saved" id="saved" hidden={{ search: search || '' }} />
    </SavedSearch>
  );
}

export function Listings({ lang }) {
  const p = getPage('listings');
  const site = getSite();
  const t = tt(lang);
  const raw = getListings().filter((x) => x.kind === 'sale' && x.zone !== 'punta-cana');
  // Order: our exclusives, then new developments, then the IDX/MLS feed (any listing that is not ours).
  const items = [
    ...raw.filter((x) => x.exclusive).map((x) => cardView(x, lang)),
    ...getDevelopments().map((d) => devCardView(d, lang)),
    ...raw.filter((x) => !x.exclusive).map((x) => cardView(x, lang))
  ];
  const zones = getZones().map((z) => [z.slug, zoneName(z, lang)]);
  return (
    <>
      <Hero eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)} />
      <ListingsBrowser items={items} strings={browserStrings(lang)} zones={zones} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container stack-lg">
          <Saved lang={lang} search={t.nav_listings} />
          <p className="small">{t.mls_attr} {L(site.mlsDisclaimer, lang) || ''}</p>
        </div>
      </section>
    </>
  );
}

export function Rentals({ lang }) {
  const p = getPage('rentals');
  const items = getListings().filter((x) => x.kind === 'rent').map((x) => cardView(x, lang));
  const zones = getZones().map((z) => [z.slug, zoneName(z, lang)]);
  return (
    <>
      <Hero eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)}>
        <a className="btn btn-primary" href="#contact-form" style={{ alignSelf: 'flex-start' }}>{L(p.helpBtn, lang)}</a>
      </Hero>
      <ListingsBrowser items={items} strings={browserStrings(lang)} zones={zones} />
      <div className="container" style={{ padding: '32px var(--pad) 64px' }}><p className="small">{L(p.note, lang)}</p></div>
      <ContactBlock lang={lang} title={L(p.formTitle, lang)} text={L(p.formText, lang)} mode="tenant" id="rent" navy />
    </>
  );
}

/* ---------- Listing / development detail (components/property.js) ---------- */
export function ListingDetail({ lang, slug }) {
  return <ListingPage lang={lang} slug={slug} />;
}
export function Developments({ lang }) {
  return <DevelopmentsIndex lang={lang} Hero={Hero} />;
}
export function Development({ lang, slug }) {
  return <DevelopmentPage lang={lang} slug={slug} />;
}

/* ---------- Buildings ---------- */
export function Buildings({ lang }) {
  const p = getPage('buildings');
  const items = getBuildings().map((b) => buildingView(b, lang));
  const zones = getZones().map((z) => [z.slug, zoneName(z, lang)]);
  const s = { ...buildingStrings(lang), searchPh: L(p.searchPh, lang), empty: L(p.empty, lang), none: L(p.none, lang), mapNote: L(p.mapNote, lang) };
  return (
    <>
      <ImageHero m={slot('page.buildings', lang)} eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)} />
      <BuildingDirectory items={items} zones={zones} s={s} />
    </>
  );
}

export function Building({ lang, slug }) {
  const p = getPage('buildings');
  const b = getBuilding(slug);
  const t = tt(lang);
  const bv = buildingView(b, lang);
  const B = p.blocks;
  const comp = buildingCompleteness(b);
  const missing = ['summary', 'hoa', 'rules', 'structural'].filter((k) => !comp[k]).map((k) => L(B[k], lang));
  const waText = fill(L(p.waMsg, lang), { b: b.name });
  const units = getListings().filter((x) => x.building === slug);
  const sm = b.summary || {};
  const sample = b.sample ? <span className="badge-sample">{t.sample_block}</span> : null;
  const stLabel = (st) => (st ? t[`st_${V(st)}`] || V(st) : null);
  const blocks = [
    ['summary', sm.yearBuilt != null || sm.floors != null],
    ['hoa', b.hoa?.rows?.length],
    ['rules', b.rules],
    ['structural', b.structural],
    ['amenities', L(b.amenities?.items, lang)?.length],
    ['lines', b.lines?.rows?.length],
    ['sales', b.sales?.rows?.length],
    ['available', units.length],
    ['faq', b.faq?.length]
  ].filter(([, ok]) => ok).map(([k]) => k);

  const Block = ({ k, src, children }) => (
    <section id={k} className="dossier">
      <div className="dossier-head">
        <h2 className="h3">{L(B[k], lang)}</h2>
        {sample}
        <Src d={src} lang={lang} />
      </div>
      <div className="dossier-body">{children}</div>
    </section>
  );

  const sales = (b.sales?.rows || []).map((r) => ({ ...r, psf: r.price && r.sqft ? Math.round(r.price / r.sqft) : null }));
  const psfs = sales.map((r) => r.psf).filter(Boolean).sort((a, c) => a - c);
  const median = psfs.length ? psfs[Math.floor(psfs.length / 2)] : null;

  return (
    <>
      <ImageHero
        m={buildingMedia(b, getZone(b.zone), lang)}
        top={<>
          {!isProduction && !comp.publishable && <p className="incomplete incomplete-over">{fill(L(p.incomplete, lang), { x: missing.join(', ') })}</p>}
          <nav aria-label={t.breadcrumbs} className="small crumbs"><Link href={path(lang, 'buildings')}>{t.nav_buildings}</Link> / {b.name}</nav>
        </>}
        eyebrow={`${bv.zoneName}${b.oceanfront ? ` · ${t.oceanfront}` : ''}`}
        title={b.name}
        titleStyle={{ fontSize: 'clamp(44px, 7vw, 96px)' }}
      >
          {b.sample && <span className="badge-sample">{t.sample_block}</span>}
          <div className="hero-facts">
            {bv.year && <span><strong>{bv.year}</strong>{t.year_built}</span>}
            {bv.floors && <span><strong>{bv.floors}</strong>{t.floors}</span>}
            {V(sm.units) != null && <span><strong>{V(sm.units)}</strong>{t.units}</span>}
            {bv.priceRange && <span><strong>{bv.priceRange}</strong>{t.price_range}</span>}
          </div>
          <div className="btn-row">
            <a className="btn btn-sand" href={wa(lang, waText)} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
            <a className="btn btn-outline-light" href="#alerts">{L(p.alertsTitle, lang)}</a>
          </div>
      </ImageHero>

      <nav className="container tabs anchors" aria-label={b.name}>{blocks.map((k) => <a key={k} href={`#${k}`}>{L(B[k], lang)}</a>)}</nav>

      <div className="container dossiers">
        {blocks.includes('summary') && (
          <Block k="summary" src={sm}>
            <dl className="facts">
              {[[t.year_built, sm.yearBuilt], [t.floors, sm.floors], [t.units, sm.units], [t.architect, sm.architect], [t.developer, sm.developer]].filter(([, d]) => V(d) != null).map(([k, d]) => <div key={k}><dt>{k}</dt><dd><Datum d={d} lang={lang} /></dd></div>)}
            </dl>
          </Block>
        )}
        {blocks.includes('hoa') && (
          <Block k="hoa" src={b.hoa}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th scope="col">{t.unit_size}</th><th scope="col">{t.monthly}</th></tr></thead>
              <tbody>{b.hoa.rows.map((r, i) => <tr key={i}><th scope="row">{L(r.size, lang)}</th><td>{r.monthly}</td></tr>)}</tbody>
            </table></div>
            {L(b.hoa.includes, lang)?.length > 0 && <p className="body" style={{ fontSize: 15 }}><strong>{t.includes}:</strong> {L(b.hoa.includes, lang).join(' · ')}</p>}
          </Block>
        )}
        {blocks.includes('rules') && (
          <Block k="rules" src={b.rules}>
            <dl className="facts">
              {V(b.rules.rental?.minimumTerm) && <div><dt>{t.min_term}</dt><dd>{t[`rent_min_${V(b.rules.rental.minimumTerm)}`]}</dd></div>}
              {V(b.rules.rental?.timesPerYear) != null && <div><dt>{t.times_year}</dt><dd><Datum d={b.rules.rental.timesPerYear} lang={lang} /></dd></div>}
              {V(b.rules.rental?.approvalRequired) != null && <div><dt>{t.approval}</dt><dd>{V(b.rules.rental.approvalRequired) ? t.yes : t.no}</dd></div>}
              {V(b.rules.pets?.allowed) != null && <div><dt>{t.pets}</dt><dd>{V(b.rules.pets.allowed) ? t.pets_yes : t.pets_no}</dd></div>}
            </dl>
            {[b.rules.rental?.notes, b.rules.pets?.notes].map((n, i) => L(n, lang) && <p key={i} className="body" style={{ fontSize: 15 }}>{L(n, lang)}</p>)}
          </Block>
        )}
        {blocks.includes('structural') && (
          <Block k="structural" src={b.structural}>
            <dl className="facts">
              {stLabel(b.structural.milestoneInspection?.status) && <div><dt>{t.milestone}</dt><dd>{stLabel(b.structural.milestoneInspection.status)}{L(b.structural.milestoneInspection.phase, lang) ? ` · ${L(b.structural.milestoneInspection.phase, lang)}` : ''}{b.structural.milestoneInspection.completedOn ? ` · ${b.structural.milestoneInspection.completedOn}` : ''}</dd></div>}
              {stLabel(b.structural.sirs?.status) && <div><dt>{t.sirs}</dt><dd>{stLabel(b.structural.sirs.status)}{b.structural.sirs.completedOn ? ` · ${b.structural.sirs.completedOn}` : ''}</dd></div>}
              {L(b.structural.specialAssessment, lang) && <div><dt>{t.special_assessment}</dt><dd>{L(b.structural.specialAssessment, lang)}</dd></div>}
            </dl>
            <p className="small">{L(p.structuralNote, lang)}</p>
          </Block>
        )}
        {blocks.includes('amenities') && (
          <Block k="amenities" src={b.amenities}><ul className="ticks grid" style={{ '--min': '220px', gap: '0 32px' }}>{L(b.amenities.items, lang).map((a) => <li key={a}>{a}</li>)}</ul></Block>
        )}
        {blocks.includes('lines') && (
          <Block k="lines" src={b.lines}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th scope="col">{t.line}</th><th scope="col">{t.beds}</th><th scope="col">sq ft</th><th scope="col">{t.orientation}</th><th scope="col">{t.views}</th></tr></thead>
              <tbody>{b.lines.rows.map((r) => <tr key={r.line}><th scope="row">{r.line}</th><td>{r.beds ?? '—'}</td><td>{r.sqft ?? '—'}</td><td>{L(r.orientation, lang) ?? '—'}</td><td>{L(r.views, lang) ?? '—'}</td></tr>)}</tbody>
            </table></div>
          </Block>
        )}
        {blocks.includes('sales') && (
          <Block k="sales" src={b.sales}>
            {median && <p className="kpi-inline"><span>{t.median_psf}</span><strong>{formatPrice(median, lang)}</strong></p>}
            <div className="table-wrap"><table className="table">
              <thead><tr><th scope="col">{t.month}</th><th scope="col">{t.line}</th><th scope="col">{t.beds}</th><th scope="col">sq ft</th><th scope="col">{t.f_price}</th><th scope="col">{t.price_psf}</th></tr></thead>
              <tbody>{sales.map((r, i) => <tr key={i}><th scope="row">{monthLabel(r.month, lang)}</th><td>{r.line ?? '—'}</td><td>{r.beds ?? '—'}</td><td>{r.sqft ? Number(r.sqft).toLocaleString('en-US') : '—'}</td><td>{formatPrice(r.price, lang) ?? '—'}</td><td>{r.psf ? formatPrice(r.psf, lang) : '—'}</td></tr>)}</tbody>
            </table></div>
          </Block>
        )}
        {blocks.includes('available') && <Block k="available"><Cards items={units} lang={lang} /></Block>}
        {blocks.includes('faq') && (
          <Block k="faq"><div className="faq">{b.faq.map((q, i) => <details key={i} open={i === 0}><summary>{L(q.q, lang)}</summary><p className="body" style={{ fontSize: 15 }}>{L(q.a, lang)}</p></details>)}</div></Block>
        )}
      </div>

      <section id="alerts" className="section navy">
        <div className="container row">
          <div className="side stack" style={{ gap: 20 }}>
            <span className="rule" />
            <h2 className="h2">{L(p.alertsTitle, lang)}</h2>
            <p className="lead">{L(p.alertsText, lang)}</p>
            <a className="btn btn-sand" style={{ alignSelf: 'flex-start' }} href={wa(lang, waText)} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
          </div>
          <div className="grow"><Lead lang={lang} mode="alerts" id="ba" waText={waText} hidden={{ building: b.name }} /></div>
        </div>
      </section>
    </>
  );
}

/* ---------- Areas ---------- */
export function Areas({ lang }) {
  const p = getPage('areas');
  return (
    <>
      <ImageHero m={slot('page.areas', lang)} eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)} />
      <section className="section section-xl"><div className="container grid" style={{ '--min': '300px', gap: 28 }}>
        {getZones().map((z) => (
          <Link key={z.slug} href={path(lang, 'areas', z.slug)} className="card zone-tile" data-reveal>
            <div className="ph ph-over">
              <Media m={zoneMedia(z, lang)} decorative sizes="(max-width: 767px) 100vw, (max-width: 1240px) 50vw, 420px" />
              <div className="over">
                <span className="zone-name">{zoneName(z, lang)}</span>
                <span className="over-sub">{L(z.short, lang)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div></section>
    </>
  );
}

export function Zone({ lang, slug }) {
  const p = getPage('areas');
  const z = getZone(slug);
  const t = tt(lang);
  const zn = zoneName(z, lang);
  const items = getListings().filter((x) => x.zone === slug).slice(0, 3);
  const buildings = getBuildings().filter((b) => b.zone === slug);
  const report = getReports().find((r) => (r.zones || []).some((x) => x.zone === slug));
  const waText = fill(t.wa_zone, { z: zn });
  return (
    <>
      <ImageHero m={zoneMedia(z, lang)} eyebrow={L(p.zoneEyebrow, lang)} title={zn} lead={L(z.lead, lang)} titleStyle={{ fontSize: 'clamp(44px, 7vw, 96px)' }}>
        {V(z.priceRange) && <div className="hero-facts"><span><strong>{L(V(z.priceRange), lang)}</strong>{t.price_range}</span></div>}
      </ImageHero>
      <nav className="container tabs" aria-label={t.nav_areas}>
        {getZones().map((o) => <Link key={o.slug} href={path(lang, 'areas', o.slug)} aria-current={o.slug === slug ? 'page' : undefined}>{zoneName(o, lang)}</Link>)}
      </nav>
      <section className="section">
        <div className="container row">
          <div className="grow stack" style={{ gap: 20 }}>
            <h2 className="h2">{L(p.life, lang)}</h2>
            <p className="body">{L(z.body, lang)}</p>
            <ul className="ticks">{L(z.places, lang).map((pl) => <li key={pl}>{pl}</li>)}</ul>
            {z.priceRange && <Src d={z.priceRange} lang={lang} />}
          </div>
          {(z.schools?.rows?.length > 0 || z.distances?.rows?.length > 0) && (
            <div className="side stack" style={{ gap: 32 }}>
              {z.schools?.rows?.length > 0 && <div className="stack"><h3 className="h3">{t.schools}</h3><ul className="ticks">{z.schools.rows.map((s, i) => <li key={i}>{s.name} · {L(s.type, lang)} · {s.grades} · {s.distance}</li>)}</ul><Src d={z.schools} lang={lang} /></div>}
              {z.distances?.rows?.length > 0 && <div className="stack"><h3 className="h3">{t.distances}</h3><ul className="ticks">{z.distances.rows.map((d, i) => <li key={i}>{L(d.to, lang)} · {d.time}</li>)}</ul><Src d={z.distances} lang={lang} /></div>}
            </div>
          )}
        </div>
      </section>
      {buildings.length > 0 && <section className="section sand"><div className="container stack-lg"><Head title={`${t.buildings_in} ${zn}`} right={<Link className="link" href={path(lang, 'buildings')}>{t.nav_buildings}</Link>} /><BCards items={buildings} lang={lang} /></div></section>}
      {report && <section className="section"><div className="container stack-lg"><Head eyebrow={`${t.report_month} · ${monthLabel(report.month, lang)}`} title={zn} right={<Link className="link" href={path(lang, 'market', report.slug)}>{t.nav_market}</Link>} /><Report r={report} lang={lang} zoneFilter={slug} compact /></div></section>}
      {items.length > 0 && <section className="section sand"><div className="container stack-lg"><Head title={`${L(p.inTitle, lang)} ${zn}`} right={<Link className="link" href={path(lang, 'listings')}>{t.view_all}</Link>} /><Cards items={items} lang={lang} /></div></section>}
      <ContactBlock lang={lang} title={L(p.ctaTitle, lang)} text={L(p.ctaText, lang)} id="zone" waText={waText} navy />
    </>
  );
}

/* ---------- International ---------- */
export function International({ lang }) {
  const p = getPage('international');
  const site = getSite();
  const t = tt(lang);
  const guide = L(site.downloads?.buyerGuide, lang);
  return (
    <>
      <Hero eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)}>
        <p className="notice">{L(p.notice, lang)}</p>
        <div className="btn-row">
          <a className="btn btn-primary" href="#contact-form">{L(p.cta, lang)}</a>
          {guide && <a className="btn btn-outline" href={guide} download><Icon name="download" />{L(p.download, lang)}</a>}
        </div>
      </Hero>
      <nav className="container tabs anchors" aria-label={L(p.eyebrow, lang)}>{p.sections.map((s) => <a key={s.id} href={`#${s.id}`}>{L(s.h, lang).replace(/^\d+\.\s*/, '')}</a>)}</nav>
      <div className="container dossiers">
        {p.sections.map((s) => (
          <section key={s.id} id={s.id} className="dossier">
            <div className="dossier-head"><h2 className="h3">{L(s.h, lang)}</h2></div>
            <div className="dossier-body"><p className="body">{L(s.p, lang)}</p><ul className="ticks">{L(s.list, lang).map((x) => <li key={x}>{x}</li>)}</ul></div>
          </section>
        ))}
        <p className="notice">{L(p.notice, lang)}</p>
      </div>
      <section className="section sand"><div className="container narrow stack-lg" style={{ gap: 28 }}>
        <h2 className="h2">{L(p.faqTitle, lang)}</h2>
        <div className="faq" style={{ borderTop: '1px solid var(--navy)' }}>{p.faq.map((q, i) => <details key={i} open={i === 0}><summary>{L(q.q, lang)}</summary><p className="body" style={{ fontSize: 15 }}>{L(q.a, lang)}</p></details>)}</div>
      </div></section>
      <ContactBlock lang={lang} title={L(p.formTitle, lang)} text={L(p.formText, lang)} id="intl" navy />
    </>
  );
}

/* ---------- Sell ---------- */
export function Sell({ lang }) {
  const p = getPage('sell');
  const site = getSite();
  return (
    <>
      <section className="section navy">
        <div className="container row">
          <div className="side stack" style={{ gap: 20, paddingTop: 16 }}>
            <span className="rule" />
            <p className="eyebrow">{L(p.eyebrow, lang)}</p>
            <h1 className="h1">{L(p.title, lang)}</h1>
            <p className="lead">{L(p.lead, lang)}</p>
            <ul className="ticks">{L(p.promises, lang).map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
          <div className="grow"><Lead lang={lang} mode="seller" id="val" /></div>
        </div>
      </section>
      <section className="section"><div className="container stack-lg">
        <Head eyebrow={L(p.howEyebrow, lang)} title={L(p.howTitle, lang)} />
        <ol className="grid" style={{ '--min': '240px', gap: '40px 32px' }}>
          {p.how.map((s, i) => <li key={i} className="topline"><span className="num" style={{ fontSize: 40 }}>{String(i + 1).padStart(2, '0')}</span><h3 style={{ fontSize: 18, fontWeight: 600 }}>{L(s.h, lang)}</h3><p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>{L(s.p, lang)}</p></li>)}
        </ol>
      </div></section>
      <section className="section sand"><div className="container row">
        <div className="side stack"><p className="eyebrow">{L(p.mktEyebrow, lang)}</p><h2 className="h2">{L(p.mktTitle, lang)}</h2><p className="body">{L(p.mktText, lang)}</p></div>
        <div className="grow boxed" style={{ '--min': '240px' }}>
          {p.marketing.map((m, i) => <div key={i} style={{ padding: '26px 24px', gap: 8 }}><h3 style={{ fontSize: 16, fontWeight: 600 }}>{L(m.h, lang)}</h3><p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>{L(m.p, lang)}</p></div>)}
        </div>
      </div></section>
      <section className="section"><div className="container grid" style={{ '--min': '340px', gap: 32 }}>
        <div className="panel"><h2 className="h3" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>{L(p.abroadTitle, lang)}</h2><p className="body" style={{ fontSize: 16 }}>{L(p.abroadText, lang)}</p></div>
        <div className="panel"><h2 className="h3" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>{L(p.rentTitle, lang)}</h2><p className="body" style={{ fontSize: 16 }}>{L(p.rentText, lang)}</p></div>
        <div className="panel"><h2 className="h3" style={{ fontSize: 'clamp(26px, 3vw, 36px)' }}>{L(p.feeTitle, lang)}</h2><p className="body" style={{ fontSize: 16 }}>{L(p.feeText, lang)}</p></div>
      </div></section>
      {site.soldListings?.length > 0 && <section className="section sand"><div className="container stack-lg"><h2 className="h2">{L(p.soldTitle, lang)}</h2><Cards items={site.soldListings} lang={lang} /></div></section>}
    </>
  );
}

/* ---------- Market ---------- */
export function Market({ lang }) {
  const p = getPage('market');
  const t = tt(lang);
  const reports = getReports();
  const latest = reports[0];
  return (
    <>
      <Hero eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)} />
      {latest ? (
        <section className="section"><div className="container stack-lg">
          <Head eyebrow={monthLabel(latest.month, lang)} title={L(latest.title, lang)} right={<Link className="link" href={path(lang, 'market', latest.slug)}>{lang === 'es' ? 'Ver informe' : 'View report'}</Link>} />
          <Report r={latest} lang={lang} />
          {reports.length > 0 && (
            <div className="stack"><h2 className="h3">{L(p.archive, lang)}</h2>
              <ul className="ticks">{reports.map((r) => <li key={r.slug}><Link href={path(lang, 'market', r.slug)}>{monthLabel(r.month, lang)} · {L(r.title, lang)}</Link>{r.sample ? ` · ${t.sample_block}` : ''}</li>)}</ul>
            </div>
          )}
        </div></section>
      ) : <section className="section"><div className="container"><p className="sand" style={{ padding: 40, textAlign: 'center' }}>{L(p.none, lang)}</p></div></section>}
      <ContactBlock lang={lang} title={L(p.subTitle, lang)} text={L(p.subText, lang)} mode="market" id="mk" navy />
    </>
  );
}

export function MarketReport({ lang, slug }) {
  const p = getPage('market');
  const r = getReport(slug);
  return (
    <article>
      <Hero eyebrow={`${L(p.eyebrow, lang)} · ${monthLabel(r.month, lang)}`} title={L(r.title, lang)} lead={L(r.summary, lang)} />
      <section className="section"><div className="container stack-lg">
        <Report r={r} lang={lang} />
        <div className="narrow stack" style={{ padding: 0 }}>{(L(r.body, lang) || []).map((x, i) => <p key={i} className="body">{x}</p>)}</div>
      </div></section>
      <ContactBlock lang={lang} title={L(p.subTitle, lang)} text={L(p.subText, lang)} mode="market" id="mr" navy />
    </article>
  );
}

/* ---------- Punta Cana ---------- */
export function PuntaCana({ lang }) {
  const p = getPage('puntacana');
  const items = getListings().filter((x) => x.zone === 'punta-cana');
  return (
    <>
      <section className="hero"><div className="container hero-in" style={{ paddingTop: 120, paddingBottom: 64 }}>
        <span className="rule" />
        <p className="eyebrow" style={{ color: 'var(--gold-light)' }}>{L(p.eyebrow, lang)}</p>
        <h1 className="h1" style={{ maxWidth: 860 }}>{L(p.title, lang)}</h1>
        <p className="sub">{L(p.lead, lang)}</p>
        <a className="btn btn-sand" href="#contact-form" style={{ alignSelf: 'flex-start' }}>{L(p.cta, lang)}</a>
      </div></section>
      <section className="section"><div className="container stack-lg">
        <Head eyebrow={L(p.areasEyebrow, lang)} title={L(p.areasTitle, lang)} />
        <div className="grid" style={{ '--min': '280px', gap: 32 }}>{p.areas.map((a) => <div key={a.n} className="topline"><h3 className="h3" style={{ fontSize: 30 }}>{a.n}</h3><p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>{L(a.p, lang)}</p></div>)}</div>
      </div></section>
      {items.length > 0 && <section className="section sand"><div className="container stack-lg"><h2 className="h2">{L(p.propsTitle, lang)}</h2><Cards items={items} lang={lang} /></div></section>}
      <section className="section"><div className="container stack-lg">
        <Head eyebrow={L(p.procEyebrow, lang)} title={L(p.procTitle, lang)} />
        <Steps items={p.steps} lang={lang} />
        <div className="grid" style={{ '--min': '300px', gap: 24 }}>{p.notes.map((n, i) => <div key={i} className="sand stack" style={{ padding: 28, gap: 10 }}><h3 style={{ fontSize: 16, fontWeight: 600 }}>{L(n.h, lang)}</h3><p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{L(n.p, lang)}</p></div>)}</div>
        <p className="notice">{L(p.disclaimer, lang)}</p>
      </div></section>
      <ContactBlock lang={lang} title={L(p.formTitle, lang)} text={L(p.formText, lang)} id="pc" navy />
    </>
  );
}

/* ---------- About ---------- */
export function About({ lang }) {
  const p = getPage('misc').about;
  const site = getSite();
  const t = tt(lang);
  const story = L(site.agent.story, lang) || L(site.agent.bio, lang);
  return (
    <>
      <section className="section"><div className="container row" style={{ alignItems: 'center' }}>
        {agentMedia(lang, site.agent.name) && <div className="portrait"><Media m={agentMedia(lang, site.agent.name)} alt={site.agent.name || ''} priority sizes="(max-width: 767px) 100vw, 480px" /></div>}
        <div className="grow stack" style={{ gap: 20 }}>
          <p className="eyebrow">{L(p.eyebrow, lang)}</p>
          <h1 className="h1">{pending(site.agent.name, lang)}</h1>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>{L(site.agent.title, lang)} · {pending(site.brokerage.nameVerified ? site.brokerage.name : null, lang)}</p>
          {story && <p className="body" style={{ fontSize: 18 }}>{story}</p>}
          <div className="btn-row"><a className="btn btn-primary" href={wa(lang)} data-track="whatsapp"><Icon name="wa" />WhatsApp</a><Link className="btn btn-outline" href={path(lang, 'contact') + '#book'}>{t.book_title}</Link></div>
        </div>
      </div></section>
      <section className="section sand"><div className="container grid" style={{ '--min': '300px', gap: 48 }}>
        {site.agent.background?.length > 0 && <div className="stack"><h2 className="h3" style={{ fontSize: 34 }}>{L(p.careerTitle, lang)}</h2><ul className="ticks">{site.agent.background.map((b, i) => <li key={i}>{L(b, lang)}</li>)}</ul></div>}
        <div className="stack"><h2 className="h3" style={{ fontSize: 34 }}>{L(p.langTitle, lang)}</h2><div className="chips">{site.agent.languages.map((l) => <span key={l} className="chip static">{l}</span>)}</div></div>
        <div className="stack"><h2 className="h3" style={{ fontSize: 34 }}>{L(p.zonesTitle, lang)}</h2><div className="chips">{getZones().map((z) => <Link key={z.slug} className="chip" href={path(lang, 'areas', z.slug)}>{zoneName(z, lang)}</Link>)}<Link className="chip" href={path(lang, 'puntacana')}>Punta Cana</Link></div></div>
      </div></section>
      <section className="section"><div className="container stack-lg">
        <h2 className="h2">{L(p.howTitle, lang)}</h2>
        <div className="grid" style={{ '--min': '280px', gap: '40px 32px' }}>{p.values.map((v, i) => <div key={i} className="topline"><h3 className="h3">{L(v.h, lang)}</h3><p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>{L(v.p, lang)}</p></div>)}</div>
      </div></section>
    </>
  );
}

/* ---------- Contact ---------- */
export function Contact({ lang }) {
  const p = getPage('misc').contact;
  const site = getSite();
  const t = tt(lang);
  const tel = telHref();
  return (
    <>
      <Hero eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)}>
        <div className="btn-row">
          <a className="btn btn-primary" href={wa(lang)} data-track="whatsapp"><Icon name="wa" />WhatsApp · {pending(site.contact.whatsapp, lang)}</a>
          {tel && <a className="btn btn-outline" href={tel} data-track="call"><Icon name="phone" />{site.contact.phone}</a>}
          {site.contact.publicEmail && <a className="btn btn-outline" href={`mailto:${site.contact.publicEmail}`}>{site.contact.publicEmail}</a>}
        </div>
        {/* Florida 61J2-10.025: brokerage name next to the contact points. */}
        <p className="contact-broker" data-broker>{pending(site.brokerage.nameVerified ? site.brokerage.name : null, lang)}{site.brokerage.address ? ` · ${site.brokerage.address}` : ''}</p>
      </Hero>
      <section id="book" className="section"><div className="container row">
        <div className="side stack" style={{ gap: 16 }}>
          <span className="rule" />
          <h2 className="h2">{t.book_title}</h2>
          <p className="lead">{t.book_text}</p>
          {site.contact.bookingUrl && <a className="btn btn-outline" href={site.contact.bookingUrl} target="_blank" rel="noopener"><Icon name="cal" />{t.book_title}</a>}
          <OfficeLine lang={lang} />
          <p className="small" style={{ fontSize: 14 }}>{L(site.contact.hours, lang) ? `${L(site.contact.hours, lang)} · ` : ''}{L(p.byAppointment, lang)}</p>
        </div>
        <div className="grow"><Lead lang={lang} mode="consult" id="bk" /></div>
      </div></section>
      <ContactBlock lang={lang} title={t.or_form} mode="buyer" chooser id="ct" />
    </>
  );
}

/* ---------- Form fallback pages (no-JavaScript submit lands here) ---------- */
// Static pages (no query reading), so the error text stays generic and offers every direct channel.
export function LeadResult({ lang, ok }) {
  const t = tt(lang);
  const site = getSite();
  const tel = telHref();
  return (
    <Hero eyebrow={t.nav_contact} title={ok ? t.msg_sent_title : t.msg_fail_title} lead={ok ? t.msg_sent_text : `${t.msg_fail_missing} ${t.msg_fail_text}`}>
      <div className="btn-row">
        {ok ? <Link className="btn btn-primary" href={path(lang, 'home')}>{t.back_home}</Link> : <Link className="btn btn-primary" href={path(lang, 'contact')}>{t.go_back}</Link>}
        <a className="btn btn-outline" href={wa(lang)} data-track="whatsapp"><Icon name="wa" />WhatsApp</a>
        {!ok && tel && <a className="btn btn-outline" href={tel} data-track="call"><Icon name="phone" />{site.contact.phone}</a>}
        {!ok && site.contact.publicEmail && <a className="btn btn-outline" href={`mailto:${site.contact.publicEmail}`}>{site.contact.publicEmail}</a>}
      </div>
      <p className="contact-broker">{pending(site.brokerage.nameVerified ? site.brokerage.name : null, lang)}{site.brokerage.address ? ` · ${site.brokerage.address}` : ''}</p>
    </Hero>
  );
}

/* ---------- Legal ---------- */
export function Legal({ lang, name }) {
  const doc = getLegal(name);
  const site = getSite();
  const P = (v) => v || pending(null, lang);
  const f = (s) => fill(s, { agent: P(site.agent.name), brokerage: P(site.brokerage.nameVerified ? site.brokerage.name : null), email: P(site.contact.publicEmail), phone: P(site.contact.phone) });
  return (
    <>
      <Hero eyebrow="Legal" title={L(doc.title, lang)} lead={`${lang === 'es' ? 'Última actualización' : 'Last updated'}: ${doc.updated || pending(null, lang)}`} />
      <section className="section"><div className="container narrow stack-lg" style={{ gap: 36 }}>
        {doc.sections.map((s, i) => <div key={i} className="stack" style={{ gap: 10 }}><h2 className="h3">{L(s.h, lang)}</h2><p className="body" style={{ fontSize: 16 }}>{f(L(s.p, lang))}</p></div>)}
      </div></section>
    </>
  );
}
