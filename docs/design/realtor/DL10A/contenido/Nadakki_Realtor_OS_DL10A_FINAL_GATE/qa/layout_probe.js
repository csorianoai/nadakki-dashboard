// Mide la geometría REAL del Geo Explorer con desplazamiento real de la ventana (sin transformaciones).
// Devuelve {ok, w, h, headerPos, headerH, rows:[{id, ok, detail}]}
(async () => {
  const D = window.__nadakkiDemo, sleep = ms => new Promise(r => { const t0 = performance.now(), ch = new MessageChannel(); ch.port1.onmessage = () => performance.now() - t0 >= ms ? r() : ch.port2.postMessage(0); ch.port2.postMessage(0); }), q = id => document.querySelector(`[data-qa="${id}"]`) || document.getElementById(id);
  const hdr = document.querySelector('[data-qa="app-header"]') || (document.querySelector('[data-qa="menu-toggle"], [data-qa="context"]') || {}).closest?.('div[style*="z-index: 20"]');
  const reveal = D.reveal ? id => D.reveal(id) : id => { const el = q(id); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 20); }; // build anterior: mismo desplazamiento que usaba la app (-20 px)
  const hb = () => { if (!hdr) return 0; const cs = getComputedStyle(hdr); return (cs.position === 'sticky' || cs.position === 'fixed') ? Math.max(0, hdr.getBoundingClientRect().bottom) : 0; };
  const rows = [], add = (id, ok, detail) => rows.push({ id, ok, detail });
  const vis = (id, label) => { const el = q(id); if (!el) return add(label || id, false, 'no existe');
    const r = el.getBoundingClientRect(), top = hb(), W = window.innerWidth, H = window.innerHeight;
    const under = r.top < top - 0.5, below = r.bottom > H + 0.5, sideways = r.left < -0.5 || r.right > W + 0.5;
    add(label || id, !under && !below && !sideways, `top ${Math.round(r.top)} · bottom ${Math.round(r.bottom)} · cabecera fija hasta ${Math.round(top)} · alto vista ${H}` + (under ? (top > 0 && r.bottom > 0 ? ' · TAPADO POR CABECERA' : ' · FUERA DE VISTA (arriba)') : '') + (below ? ' · FUERA DE VISTA' : '') + (sideways ? ' · DESBORDA' : '')); };
  D.doReset(); await sleep(150); D.ui({ toast: null }); D.go(3); await sleep(250);
  // 1) Flujo de la app: «Coincidencias en el mapa» desde Clientes desplaza al explorador
  D.go(1); await sleep(150); q('client-geo').click(); await sleep(600); vis('geo-title', 'flujo Clientes → título del explorador visible');
  // 2) Controles usando el desplazamiento propio de la app (D.reveal)
  for (const id of ['geo-state', 'geo-zip', 'geo-add', 'geo-areas', 'geo-min', 'geo-status', 'geo-draw-poly', 'geo-map', 'geo-zoom-in', 'geo-zoom-out', 'geo-save-name', 'geo-save']) { reveal(id); await sleep(120); vis(id); }
  // 3) «Ver en el mapa» desde la lista deja el mapa completo a la vista
  const it = document.querySelector('[data-qa^="geo-locate-"]'); if (it) { reveal(it.dataset.qa); await sleep(100); it.click(); await sleep(400); vis('geo-map', '«Ver en el mapa» → mapa visible'); }
  // 4) «Abrir ficha» desde el mapa deja la ficha a la vista
  const pin = document.querySelector('[data-qa^="geo-pin-"]'); if (pin) { pin.click(); await sleep(150); const o = q('geo-pop-open'); if (o) { o.click(); await sleep(500); vis('pw-detail-title', '«Abrir ficha» → ficha visible'); } }
  // 5) Área visible del mapa: al menos 280 px de alto útil y sin solaparse con la cabecera
  reveal('geo-map'); await sleep(150); const m = q('geo-map').getBoundingClientRect(), useful = Math.min(m.bottom, innerHeight) - Math.max(m.top, hb());
  add('área útil del mapa', useful >= 280, `${Math.round(useful)} px visibles de ${Math.round(m.height)}`);
  const res = { ok: rows.every(r => r.ok), w: innerWidth, h: innerHeight, headerPos: hdr ? getComputedStyle(hdr).position : 'sin data-qa', headerH: hdr ? Math.round(hdr.getBoundingClientRect().height) : 0, rows };
  D.doReset(); await sleep(150); window.scrollTo(0, 0); return res;
})()
