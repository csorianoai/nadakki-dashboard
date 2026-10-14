// T29 · reproducción aislada: 40 ciclos abrir diálogo → Escape → comprobar foco, la mitad justo después de navegar.
(async () => {
  const D = window.__nadakkiDemo, q = id => document.querySelector(`[data-qa="${id}"]`);
  const mc = ms => new Promise(r => { const t0 = performance.now(), ch = new MessageChannel(); ch.port1.onmessage = () => performance.now() - t0 >= ms ? r() : ch.port2.postMessage(0); ch.port2.postMessage(0); });
  const tick = () => mc(0), raf = () => new Promise(r => { requestAnimationFrame(() => r()); mc(50).then(r); });
  // Modo «rAF retrasado»: reproduce lo que hace el navegador cuando el documento está oculto o sin pintar (los callbacks de requestAnimationFrame se acumulan y se ejecutan más tarde, ya cerrado el diálogo).
  const nativeRaf = window.requestAnimationFrame.bind(window), queue = []; let delayed = false;
  window.requestAnimationFrame = cb => { if (delayed) { queue.push(cb); return 900000 + queue.length; } return nativeRaf(cb); };
  const nativeCancel = window.cancelAnimationFrame.bind(window); window.cancelAnimationFrame = id => { if (id > 900000) queue[id - 900001] = null; else nativeCancel(id); };
  const flush = () => { const q2 = queue.splice(0); q2.forEach(cb => cb && cb(performance.now())); };
  let fails = 0, detail = [], dFails = 0; const rafLive = await new Promise(r => { requestAnimationFrame(() => r(true)); mc(200).then(() => r(false)); });
  for (let i = 0; i < 40; i++) {
    delayed = i >= 20; if (i % 2) { D.go(i % 4 === 1 ? 1 : 0); await tick(); }
    const r = q('reset'); r.focus(); r.click(); await tick(); await raf();
    const inDlg = document.activeElement && document.activeElement.id === 'confirm-ok';
    document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await tick(); if (delayed) flush(); await mc(30); if (delayed) flush(); await mc(30);
    const ok = inDlg && !q('confirm') && document.activeElement === q('reset');
    if (!ok) { fails++; if (delayed) dFails++; if (detail.length < 3) detail.push('ciclo ' + i + ' → ' + (document.activeElement.id || document.activeElement.dataset.qa || document.activeElement.tagName)); }
  }
  delayed = false; flush(); window.requestAnimationFrame = nativeRaf; window.cancelAnimationFrame = nativeCancel; D.go(0);
  return { cycles: 40, fails, detail, rafLive, hidden: document.hidden, normal: 20 - (fails - dFails), delayedOk: 20 - dFails };
})();
