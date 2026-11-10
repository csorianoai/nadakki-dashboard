// Property pages: listing detail, new-development detail and the developments index.
// Detail structure (same for listings and developments, ES/EN), in this order:
//  1. full-screen photo carousel (arrows, counter, GALLERY / REQUEST INFORMATION)
//  2. two columns: status tags, title, address, description | fixed colour panel with the key figures
//     (under the panel: renderings credit, price notice, developer disclaimer)
//  3. collapsible sections (+/-): key features table, interior, exterior & amenities, location
//  4. share (Facebook, X, LinkedIn, WhatsApp, email)
//  5. gallery mosaic → full-screen viewer
//  6. final block: navy "Interested in <name>" form | "Your agent" card with the brokerage office
import Link from 'next/link';
import { path } from '../lib/routes';
import { getSite, getPage, getListings, getListing, getDevelopments, getDevelopment, getBuilding, getZones, L, V, t as tt, formatPrice, pending, telHref, isProduction } from '../lib/content';
import { cardView, devCardView, cardStrings, buildingView, zoneName, listingPhotos, developmentPhotos } from '../lib/view';
import { zoneMedia, agentMedia } from '../lib/media';
import Media from './Media';
import ListingCard from './ListingCard';
import CostCalculator from './CostCalculator';
import SavedSearch from './SavedSearch';
import Gallery, { GalleryOpen } from './Gallery';
import HeroCarousel from './HeroCarousel';
import Lead from './Lead';
import { Icon, wa } from './Shell';

const fill = (s, map) => Object.keys(map).reduce((a, k) => a.replaceAll(`{${k}}`, map[k]), s || '');
const pick = (t, keys) => Object.fromEntries(keys.map((k) => [k, t[k]]));
const GAL = ['gallery', 'close', 'prev', 'next_img', 'of_n', 'request_info_btn', 'sample_note'];
const mapsHref = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const has = (v) => v != null && v !== '' && !(Array.isArray(v) && !v.length);
const siteBase = () => process.env.NEXT_PUBLIC_SITE_URL || getSite().siteUrl;

/* ---------- Shared blocks ---------- */
// Brokerage office (Florida 61J2-10.025: brokerage name next to the contact points).
export function OfficeLine({ lang }) {
  const site = getSite();
  const t = tt(lang);
  const b = site.brokerage;
  const name = b.nameVerified ? b.name : null;
  return (
    <address className="office" data-broker>
      <span className="office-label">{t.office}</span>
      <strong>{pending(name, lang)}</strong>
      {b.address && <span>{b.address}</span>}
      {b.address && <a href={mapsHref(`${name || ''} ${b.address}`)} target="_blank" rel="noopener">{t.directions} →</a>}
    </address>
  );
}

function AgentCard({ lang, waText }) {
  const site = getSite();
  const t = tt(lang);
  const a = site.agent;
  const b = site.brokerage;
  const tel = telHref();
  const photo = agentMedia(lang, a.name) || (a.photo ? { type: 'image', src: a.photo, alt: a.name } : null);
  const initials = (a.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  return (
    <div className="final-agent">
      <p className="final-k">{t.your_agent}</p>
      <div className="final-agent-in">
        <div className="agent-photo">
          {photo ? <Media m={photo} alt={a.name || ''} sizes="180px" /> : <span className="serif" aria-hidden="true">{initials}</span>}
        </div>
        <div className="stack" style={{ gap: 10 }}>
          <p className="serif agent-name">{pending(a.name, lang)}</p>
          <p className="small" style={{ fontSize: 14 }}>{L(a.title, lang)}</p>
          <div className="agent-links">
            {tel && <a href={tel} data-track="call"><Icon name="phone" size={16} />{site.contact.phone}</a>}
            <a href={wa(lang, waText)} data-track="whatsapp"><Icon name="wa" size={16} />WhatsApp</a>
            {site.contact.publicEmail && <a href={`mailto:${site.contact.publicEmail}`}>{site.contact.publicEmail}</a>}
          </div>
          <p className="agent-broker" data-broker>{pending(b.nameVerified ? b.name : null, lang)}{b.address ? ` – ${b.address}` : ''}</p>
          <Link className="btn btn-outline agent-profile" href={path(lang, 'about')}>{t.view_profile}</Link>
        </div>
      </div>
    </div>
  );
}

function Crumbs({ items, t }) {
  return (
    <nav aria-label={t.breadcrumbs} className="crumbs small">
      {items.map(([href, label], k) => (
        <span key={k}>{href ? <Link href={href}>{label}</Link> : <span>{label}</span>}{k < items.length - 1 && <span aria-hidden="true"> / </span>}</span>
      ))}
    </nav>
  );
}

// Fixed colour panel: large figure, small label under it. Only the figures that exist.
function Panel({ figures, t, notes }) {
  return (
    <aside className="side dside" aria-label={t.request_info}>
      <div className="sticky-side stack" style={{ gap: 16 }}>
        <dl className="dpanel">{figures.filter(([, v]) => has(v)).map(([k, v]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}</dl>
        <a className="btn btn-primary dpanel-cta" href="#info">{t.request_info_btn}</a>
        {notes}
      </div>
    </aside>
  );
}

function Acc({ title, open, children }) {
  return (
    <details className="acc" open={open}>
      <summary><span>{title}</span><span className="acc-sign" aria-hidden="true" /></summary>
      <div className="acc-body">{children}</div>
    </details>
  );
}

function Table({ rows }) {
  const r = rows.filter(([, v]) => has(v));
  if (!r.length) return null;
  return <dl className="kv">{r.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>;
}

const Ticks = ({ list }) => <ul className="ticks grid" style={{ '--min': '240px', gap: '0 32px' }}>{list.map((f) => <li key={f}>{f}</li>)}</ul>;

function ShareLinks({ lang, url, title }) {
  const t = tt(lang);
  const u = encodeURIComponent(url);
  const x = encodeURIComponent(title);
  const links = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ['X', `https://twitter.com/intent/tweet?url=${u}&text=${x}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ['WhatsApp', `https://wa.me/?text=${x}%20${u}`],
    ['Email', `mailto:?subject=${x}&body=${u}`]
  ];
  return (
    <div className="dshare">
      <p className="final-k">{t.share}</p>
      <ul>{links.map(([n, href]) => <li key={n}><a href={href} target={n === 'Email' ? undefined : '_blank'} rel="noopener" aria-label={fill(t.share_on, { n })}>{n}</a></li>)}</ul>
    </div>
  );
}

function GallerySection({ name, photos, t }) {
  if (!photos.length) return null;
  return (
    <section className="gsec" aria-label={t.gallery}>
      <div className="container">
        <p className="gsec-name">{name}</p>
        <h2 className="gsec-title">{t.gallery}</h2>
        <div className="mosaic">
          {photos.map((m, k) => (
            <GalleryOpen key={k} index={k} className="mosaic-item" label={fill(t.photo_n, { i: k + 1, n: photos.length })}>
              <Media m={m} decorative sizes="(max-width: 767px) 100vw, 50vw" />
            </GalleryOpen>
          ))}
        </div>
      </div>
    </section>
  );
}

function Final({ lang, name, hidden, waText }) {
  const t = tt(lang);
  return (
    <section id="info" className="final">
      <div className="final-form navy">
        <p className="final-k">{t.interested}</p>
        <h2 className="final-title">{name}</h2>
        <Lead lang={lang} mode="property" id="pi" waText={waText} hidden={hidden} />
      </div>
      <AgentCard lang={lang} waText={waText} />
    </section>
  );
}

function Tags({ list }) {
  return <ul className="dtags">{list.filter(Boolean).map((x) => <li key={x}>{x}</li>)}</ul>;
}

/* ---------- Listing detail ---------- */
export function ListingPage({ lang, slug }) {
  const x = getListing(slug);
  const t = tt(lang);
  const v = cardView(x, lang);
  const b = x.building ? getBuilding(x.building) : null;
  const zone = getZones().find((z) => z.slug === x.zone);
  const photos = listingPhotos(x, lang);
  const waText = fill(t.wa_listing, { p: `${v.title} (${v.price})` });
  const backKey = x.kind === 'rent' ? 'rentals' : x.zone === 'punta-cana' ? 'puntacana' : 'listings';
  const sqft = x.sqft != null ? `${Number(x.sqft).toLocaleString('en-US')} sq ft` : null;
  const desc = L(x.description, lang) || [];
  const feats = L(x.features, lang) || [];
  const interior = L(x.interior, lang) || [];
  const exterior = [...(L(x.exterior, lang) || []), ...(L(x.amenities, lang) || [])];
  const loc = x.address || v.area;
  const similar = getListings().filter((y) => y.kind === x.kind && y.slug !== x.slug && (y.zone === 'punta-cana') === (x.zone === 'punta-cana')).slice(0, 3);
  const calcS = { calc_hoa: t.calc_hoa, calc_tax: t.calc_tax, calc_ins: t.calc_ins, calc_total: t.calc_total, calc_note: t.calc_note, calc_empty: t.calc_empty };
  const bv = b ? buildingView(b, lang) : null;
  const status = x.status === 'sold' ? t.tag_sold : x.status === 'preconstruction' ? t.tag_preconstruction : x.kind === 'rent' ? t.tag_for_rent : t.tag_for_sale;
  const listingNo = x.listingId || x.mlsNumber || (isProduction ? null : pending(null, lang));
  const typeLabel = t[`type_${x.type}`] || x.type;

  return (
    <>
      <HeroCarousel items={photos} s={pick(t, GAL)} sample={x.sample} />

      <section className="section dmain">
        <div className="container row">
          <div className="grow stack-lg" style={{ gap: 36 }}>
            <Crumbs t={t} items={[[path(lang, backKey), t[`nav_${backKey}`]], ...(b ? [[path(lang, 'buildings', b.slug), b.name]] : []), [null, v.title]]} />
            <div className="stack" style={{ gap: 18 }}>
              <Tags list={[status, x.exclusive ? (lang === 'es' ? 'Exclusiva' : 'Exclusive') : null]} />
              <h1 className="dtitle">{v.title}</h1>
              <p className="daddr">{loc}</p>
            </div>
            {desc.length > 0 && <div className="stack">{desc.map((d, k) => <p key={k} className="body body-lg">{d}</p>)}</div>}

            <div className="accs">
              <Acc title={t.sec_main} open>
                <Table rows={[[t.f_zone, v.zoneLabel], [t.f_type, typeLabel], [t.listing_number, listingNo], [t.f_year, x.yearBuilt ?? (b ? V(b.summary?.yearBuilt) : null)], [t.f_view, L(x.view, lang)], [t.f_terrace, x.terraceSqft != null ? `${Number(x.terraceSqft).toLocaleString('en-US')} sq ft` : null], [t.f_parking, L(x.parking, lang)], [t.f_hoa, x.hoaMonthly != null ? formatPrice(x.hoaMonthly, lang) : null]]} />
                {feats.length > 0 && <Ticks list={feats} />}
              </Acc>
              {interior.length > 0 && <Acc title={t.sec_interior}><Ticks list={interior} /></Acc>}
              {exterior.length > 0 && <Acc title={t.sec_ext_amen}><Ticks list={exterior} /></Acc>}
              {has(loc) && (
                <Acc title={t.location}>
                  <p className="body">{[loc, zone ? zoneName(zone, lang) : null].filter(Boolean).join(' · ')}</p>
                  {bv && <Link href={path(lang, 'buildings', b.slug)} className="building-link"><span className="stack" style={{ gap: 4 }}><span className="eyebrow">{t.nav_buildings}</span><span className="serif" style={{ fontSize: 26 }}>{b.name}</span><span className="small">{[bv.rentalTag, bv.petsLabel, V(b.summary?.yearBuilt)].filter(Boolean).join(' · ')}</span></span><span className="link" style={{ border: 0 }}>{t.building_link} →</span></Link>}
                  <a className="link" style={{ alignSelf: 'flex-start' }} href={x.geo ? `https://www.google.com/maps/search/?api=1&query=${x.geo.lat},${x.geo.lng}` : mapsHref(loc)} target="_blank" rel="noopener">{t.open_map}</a>
                  {x.tourUrl && <a className="btn btn-outline" href={x.tourUrl} target="_blank" rel="noopener" style={{ alignSelf: 'flex-start' }}>{t.start_tour}</a>}
                </Acc>
              )}
              {x.kind === 'sale' && <Acc title={t.sec_costs}><CostCalculator hoa={x.hoaMonthly} tax={x.taxesAnnual} s={calcS} /></Acc>}
            </div>
            <ShareLinks lang={lang} url={siteBase() + path(lang, 'listings', slug)} title={v.title} />
          </div>
          <Panel
            t={t}
            figures={[[t.f_price, v.price], [t.f_bedrooms, x.beds], [t.f_bathrooms, x.baths], [t.f_sqft, sqft], [t.f_type, typeLabel]]}
            notes={<p className="dnote">{x.listingBrokerage ? `${t.courtesy} ${x.listingBrokerage}. ` : ''}{t.reliable}</p>}
          />
        </div>
      </section>

      <GallerySection name={v.title} photos={photos} t={t} />
      <Final lang={lang} name={v.title} waText={waText} hidden={{ listing: `${v.title} · ${v.price} · ${slug}` }} />
      <div className="container">
        <SavedSearch slug={slug} threshold={2} title={t.saved_title} text={t.saved_text} dismissLabel={t.dismiss}>
          <Lead lang={lang} mode="saved" id="saved" hidden={{ search: `${v.area} · ${v.title}` }} />
        </SavedSearch>
      </div>
      {similar.length > 0 && (
        <section className="section">
          <div className="container stack-lg"><h2 className="h2">{t.similar}</h2>
            <div className="pgrid">{similar.map((y) => <ListingCard key={y.slug} item={cardView(y, lang)} strings={cardStrings(lang)} />)}</div>
          </div>
        </section>
      )}
      <Gallery items={photos} s={pick(t, GAL)} />
    </>
  );
}

/* ---------- New development detail ---------- */
export function DevelopmentPage({ lang, slug }) {
  const d = getDevelopment(slug);
  const t = tt(lang);
  const v = devCardView(d, lang);
  const zone = getZones().find((z) => z.slug === d.zone);
  const photos = developmentPhotos(d, lang);
  const renders = photos.length > 0;
  if (!photos.length && zoneMedia(zone, lang)) photos.push(zoneMedia(zone, lang));
  const waText = fill(t.wa_listing, { p: `${d.name} (${v.price})` });
  const desc = L(d.description, lang) || [];
  const feats = L(d.features, lang) || [];
  const interior = L(d.interior, lang) || [];
  const extAmen = [...(L(d.exterior, lang) || []), ...(L(d.amenities, lang) || [])];
  const units = d.unitTypes || [];
  const loc = (lang === 'en' && d.addressEn) || d.address || (zone ? `${zoneName(zone, lang)}, FL` : '');
  const others = getDevelopments().filter((y) => y.slug !== d.slug).slice(0, 3);
  const year = d.deliveryYear || (String(L(d.delivery, lang) || '').match(/20\d\d/) || [])[0];
  const typeLabel = d.devType ? t[`type_${d.devType === 'condo' ? 'condo_dev' : d.devType}`] : t.type_development;
  const tags = [d.status === 'preconstruction' ? t.tag_preconstruction : d.status === 'construction' ? t.tag_construction : null, year ? fill(t.tag_delivery, { y: year }) : null, d.soldOut ? t.tag_sold : null];

  return (
    <>
      <HeroCarousel items={photos} s={pick(t, GAL)} sample={d.sample} />

      <section className="section dmain">
        <div className="container row">
          <div className="grow stack-lg" style={{ gap: 36 }}>
            <Crumbs t={t} items={[[path(lang, 'developments'), t.nav_developments], [null, d.name]]} />
            <div className="stack" style={{ gap: 18 }}>
              <Tags list={tags} />
              <h1 className="dtitle">{d.name}</h1>
              {loc && <p className="daddr">{loc}</p>}
            </div>
            {desc.length > 0 && <div className="stack">{desc.map((p, k) => <p key={k} className="body body-lg">{p}</p>)}</div>}

            <div className="accs">
              <Acc title={t.sec_main} open>
                <Table rows={[[t.f_zone, v.zoneLabel], [t.f_type, typeLabel], [t.developer, d.developer], [t.architect, d.architect], [t.interior_design, d.interiorDesigner], [t.landscape, d.landscape], [t.delivery_year, year || L(d.delivery, lang)]]} />
                {units.length > 0 && (
                  <div className="table-wrap"><table className="table">
                    <caption className="sr">{t.sec_units}</caption>
                    <thead><tr><th scope="col">{t.sec_units}</th><th scope="col">{t.f_sqft}</th><th scope="col">{t.price_from}</th></tr></thead>
                    <tbody>{units.map((u, k) => <tr key={k}><th scope="row">{L(u.type, lang)}</th><td>{u.sqft ? `${u.sqft} sq ft` : '—'}</td><td>{u.priceFrom != null ? formatPrice(u.priceFrom, lang) : t.price_on_request}</td></tr>)}</tbody>
                  </table></div>
                )}
                {feats.length > 0 && <Ticks list={feats} />}
              </Acc>
              {interior.length > 0 && <Acc title={t.sec_interior}><Ticks list={interior} /></Acc>}
              {extAmen.length > 0 && <Acc title={t.sec_ext_amen}><Ticks list={extAmen} /></Acc>}
              {has(loc) && (
                <Acc title={t.location}>
                  <p className="body">{loc}</p>
                  <a className="link" style={{ alignSelf: 'flex-start' }} href={d.geo ? `https://www.google.com/maps/search/?api=1&query=${d.geo.lat},${d.geo.lng}` : mapsHref(loc)} target="_blank" rel="noopener">{t.open_map}</a>
                </Acc>
              )}
            </div>
            <ShareLinks lang={lang} url={siteBase() + path(lang, 'developments', slug)} title={d.name} />
          </div>
          <Panel
            t={t}
            figures={[
              [d.priceFrom != null ? t.price_from : t.f_price, d.priceFrom != null ? formatPrice(d.priceFrom, lang) : t.price_on_request],
              [t.f_bedrooms, L(d.beds, lang)], [t.f_bathrooms, d.baths], [t.f_sqft, d.sqft ? `${d.sqft} sq ft` : null],
              [t.f_units, d.units], [t.f_floors, d.floors], [t.f_delivery, year || L(d.delivery, lang)], [t.f_type, typeLabel]
            ]}
            notes={
              <div className="stack" style={{ gap: 10 }}>
                {renders && <p className="dcredit">{t.renders_credit}</p>}
                <p className="dnote">{t.price_notice}</p>
                <aside className="disclaimer" aria-label={t.dev_disclaimer_title}>
                  <p className="panel-k">{t.dev_disclaimer_title}</p>
                  <p>{t.dev_disclaimer_generic}</p>
                </aside>
              </div>
            }
          />
        </div>
      </section>

      <GallerySection name={d.name} photos={photos} t={t} />
      <Final lang={lang} name={d.name} waText={waText} hidden={{ listing: `${d.name} (${t.new_development}) · ${v.price} · ${slug}` }} />
      {others.length > 0 && (
        <section className="section">
          <div className="container stack-lg"><h2 className="h2">{t.nav_developments}</h2>
            <div className="pgrid">{others.map((y) => <ListingCard key={y.slug} item={devCardView(y, lang)} strings={cardStrings(lang)} />)}</div>
          </div>
        </section>
      )}
      <Gallery items={photos} s={pick(t, GAL)} />
    </>
  );
}

/* ---------- Developments index ---------- */
export function DevelopmentsIndex({ lang, Hero }) {
  const p = getPage('developments');
  const t = tt(lang);
  const items = getDevelopments().map((d) => devCardView(d, lang));
  const s = cardStrings(lang);
  return (
    <>
      <Hero eyebrow={L(p.eyebrow, lang)} title={L(p.title, lang)} lead={L(p.lead, lang)} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container stack-lg">
          {items.length
            ? <div className="pgrid">{items.map((x, k) => <ListingCard key={x.slug} item={x} strings={s} priority={k === 0} />)}</div>
            : <p className="sand" style={{ padding: 40, textAlign: 'center' }}>{L(p.empty, lang)}</p>}
        </div>
      </section>
      <Final lang={lang} name={t.nav_developments} waText={t.wa_default} hidden={{ listing: t.nav_developments }} />
    </>
  );
}
