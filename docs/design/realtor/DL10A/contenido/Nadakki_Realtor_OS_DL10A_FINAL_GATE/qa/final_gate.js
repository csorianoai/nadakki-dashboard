// Final gate DL10A · ejecutar dentro de qa/harness.html: (0,eval)(await (await fetch('final_gate.js')).text()); await finalGate();
window.finalGate = async function (only) {
  const REC = 'recibido/DL10A_recibido_autonomo.html', FIX = '../Nadakki_Realtor_OS_DL10A_autonomo.html';
  const VP = [[390, 844], [768, 1024], [1024, 768], [1440, 900]], REP = 3;
  const t29 = await (await fetch('t29_repro.js?' + Date.now())).text();
  const suiteSrc = await (await fetch('run_tests.js?' + Date.now())).text();
  const R = { t29: [], iso: null, suites: [] };
  log('T29 · reproducción automática (eventos sintéticos) · ' + REP + ' repeticiones × 40 ciclos por viewport y versión');
  if (only !== 'iso') for (const [w, h] of VP) for (const [tag, src] of [['RECIBIDO', REC], ['FINAL', FIX]]) {
    const row = { w, tag, runs: [] };
    for (let k = 0; k < REP; k++) { const f = await frame(w, h, src); const r = await f.contentWindow.eval(t29); row.runs.push(r); f.remove(); }
    R.t29.push(row);
    log(`  ${tag.padEnd(8)} ${w}×${h} · rAF normal ${row.runs.map(r => r.normal + '/20').join(' ')} · rAF retrasado ${row.runs.map(r => r.delayedOk + '/20').join(' ')} · fallos ${row.runs.reduce((a, r) => a + r.fails, 0)}/${40 * REP}${row.runs.find(r => r.detail.length) ? ' · ' + row.runs.find(r => r.detail.length).detail[0] : ''}`);
  }
  // Aislamiento: el HTML autónomo cargado como Blob, sin acceso a la carpeta del proyecto (rutas relativas no resolverían).
  const html = await (await fetch(FIX + '?' + Date.now())).text();
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const f = await frame(1024, 768, url); const W = f.contentWindow;
  const ents = W.performance.getEntriesByType('resource').map(e => e.name);
  const outside = ents.filter(n => !/^(data|blob):/.test(n));
  W.__qaSrc = suiteSrc; W.__layoutSrc = await (await fetch('layout_probe.js?' + Date.now())).text(); const res = await W.eval(suiteSrc); W.document.getElementById('qa-results')?.remove();
  R.iso = { base: W.location.protocol, outside, pass: res.filter(r => r.ok === true).length, fail: res.filter(r => r.ok === false), ne: res.filter(r => r.ok === null).length, total: res.length, t29: (res.find(r => r.id === 'T29') || {}).ok };
  log(`AISLADO (Blob ${W.location.protocol}, sin carpeta del proyecto) 1024×768 · recursos fuera de data:/blob: ${outside.length}${outside.length ? ' → ' + outside.slice(0, 3).join(', ') : ''} · suite ${R.iso.pass} PASS · ${R.iso.fail.length} FAIL · ${R.iso.ne} NE / ${R.iso.total} · T29 ${R.iso.t29}`);
  R.iso.fail.forEach(r => log('   FAIL ' + r.id + ' ' + r.detail));
  f.remove(); URL.revokeObjectURL(url);
  if (only !== 'iso') for (const [w, h] of VP) { const g = await frame(w, h, FIX); g.contentWindow.__qaSrc = suiteSrc; const s = await g.contentWindow.eval(suiteSrc); g.remove();
    const o = { w, pass: s.filter(r => r.ok === true).length, fail: s.filter(r => r.ok === false), ne: s.filter(r => r.ok === null), t29: (s.find(r => r.id === 'T29') || {}).ok }; R.suites.push(o);
    log(`REGRESIÓN FINAL ${w}×${h} · ${o.pass} PASS · ${o.fail.length} FAIL · ${o.ne.length} NOT_EXECUTED · T29 ${o.t29 ? 'PASS' : 'FAIL'}${o.ne.length ? ' · NE ' + o.ne.map(r => r.id).join(',') : ''}`);
    o.fail.forEach(r => log('   FAIL ' + r.id + ' ' + r.detail)); }
  window.__fg = R; log('FIN ' + new Date().toISOString()); return R;
};
