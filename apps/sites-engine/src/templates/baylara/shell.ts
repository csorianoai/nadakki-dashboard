// Shell de Baylara (Shell.js:1-142) por manifiesto: nombre, contacto, idiomas y rutas por slug. Contactos legales, EHO y
// licencia NO se pintan aqui: los inyecta el renderizador (render/legal.ts) tras cualquier plantilla.
import { createElement as h, type ReactNode } from 'react';
import Link from 'next/link';
import type { Lang, Manifest } from '@/core/types';
import { pathFor, type Route } from '@/render/site';

const NAV = ['listings', 'developments', 'buildings', 'areas', 'international', 'sell', 'market', 'about', 'rentals', 'contact'];
const LABEL: Record<Lang, Record<string, string>> = {
  es: { listings: 'Propiedades', developments: 'Proyectos', buildings: 'Edificios', areas: 'Zonas', international: 'Internacional', sell: 'Vender', market: 'Mercado', about: 'Sobre mí', rentals: 'Alquileres', contact: 'Contacto' },
  en: { listings: 'Listings', developments: 'Developments', buildings: 'Buildings', areas: 'Areas', international: 'International', sell: 'Sell', market: 'Market', about: 'About', rentals: 'Rentals', contact: 'Contact' },
};
const UI = { es: { skip: 'Saltar al contenido', menu: 'Menú', nav: 'Navegación principal', lang: 'Idioma', quick: 'Contacto rápido', call: 'Llamar' },
  en: { skip: 'Skip to content', menu: 'Menu', nav: 'Main navigation', lang: 'Language', quick: 'Quick contact', call: 'Call' } } as const;
const digits = (p: string) => p.replace(/\D/g, '');

export interface ShellProps { manifest: Manifest; lang: Lang; route: Route; children?: ReactNode }

export function Shell({ manifest: m, lang, route, children }: ShellProps) {
  const u = UI[lang];
  const name = m.name[lang] ?? m.name.es;
  const page = (k: string) => m.routes.find((r) => r.kind === 'page' && r.key === k);
  const home = page('home');
  const links = NAV.flatMap((k) => { const r = page(k); return r ? [{ k, href: pathFor(m, lang, r), label: LABEL[lang][k] }] : []; });
  const contactPage = page('contact');
  const wa = m.contact.whatsapp ? `https://wa.me/${digits(m.contact.whatsapp)}` : contactPage ? pathFor(m, lang, contactPage) : undefined;
  const tel = m.contact.phone ? `tel:${m.contact.phone}` : contactPage ? pathFor(m, lang, contactPage) : undefined;
  const broker = m.legal.dba ? `${m.legal.brokerage_legal_name} (${m.legal.dba})` : m.legal.brokerage_legal_name;
  const current = (k: string) => (route.kind === 'page' && route.key === k ? 'page' : undefined);
  const navLinks = (cur: boolean) => links.map((n) => h(Link, { key: n.k, href: n.href, 'aria-current': cur ? current(n.k) : undefined }, n.label));
  const langs = m.languages.map((l) => l === lang
    ? h('span', { key: l, className: 'on', 'aria-current': 'true' }, l.toUpperCase())
    : h(Link, { key: l, href: pathFor(m, l, route), hrefLang: l, lang: l }, l.toUpperCase()));
  return h('div', { 'data-template': 'baylara', lang },
    h('a', { className: 'skip', href: '#main' }, u.skip),
    h('div', { className: 'utility' }, h('div', { className: 'utility-in' }, h('span', null, m.legal.agent_registered_last_name), h('span', { 'aria-hidden': 'true' }, '·'), h('span', null, broker))),
    h('header', { className: 'header' }, h('div', { className: 'header-in' },
      h(Link, { href: home ? pathFor(m, lang, home) : '/', className: 'logo' }, h('span', { className: 'logo-word' }, name)),
      h('nav', { className: 'nav', 'aria-label': u.nav }, ...navLinks(true)),
      h('div', { className: 'header-actions' },
        h('div', { className: 'langs', role: 'group', 'aria-label': u.lang }, ...langs),
        wa ? h('a', { className: 'btn btn-primary btn-wa', href: wa, 'data-track': 'whatsapp' }, 'WhatsApp') : null,
        h('details', { className: 'menu' }, h('summary', { 'aria-label': u.menu }, '☰'), h('nav', { className: 'menu-panel', 'aria-label': u.nav }, ...navLinks(false)))))),
    h('main', { id: 'main' }, children),
    h('footer', { className: 'footer' }, h('div', { className: 'container footer-grid' },
      h('div', { className: 'footer-col' }, h('span', { className: 'logo-word' }, name)),
      h('nav', { className: 'footer-col', 'aria-label': u.nav }, ...navLinks(false)))),
    wa || tel ? h('nav', { className: 'stickybar', 'aria-label': u.quick },
      h('span', { className: 'stickybar-broker', 'data-broker-sticky': '' }, broker),
      wa ? h('a', { href: wa, 'data-track': 'whatsapp' }, 'WhatsApp') : null,
      tel ? h('a', { href: tel, 'data-track': 'call' }, u.call) : null) : null);
}
