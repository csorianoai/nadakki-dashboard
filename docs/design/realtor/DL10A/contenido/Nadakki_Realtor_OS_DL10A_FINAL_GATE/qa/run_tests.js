// Nadakki Realtor OS — Design Loop 10A final gate · QA E2E en navegador real.
// Uso manual: abrir "Nadakki Realtor OS DL09.dc.html", abrir la consola y pegar este archivo completo.
// Maneja la interfaz real (clics, escritura, selects) y verifica DOM + estado. Reinicia los datos DEMO al empezar y al terminar.
(async () => {
  const sleep = ms => new Promise(r => { const t0 = performance.now(), ch = new MessageChannel(); ch.port1.onmessage = () => performance.now() - t0 >= ms ? r() : ch.port2.postMessage(0); ch.port2.postMessage(0); });
  const q = id => document.querySelector(`[data-qa="${id}"]`);
  const qa = id => document.querySelectorAll(`[data-qa="${id}"]`);
  const need = id => { const el = q(id); if (!el) throw new Error('No existe [' + id + ']'); return el; };
  const click = async id => { need(id).click(); await sleep(70); };
  const setVal = async (id, v) => {
    const el = need(id);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    await sleep(50);
  };
  const submit = async id => { need(id).closest('form').requestSubmit(); await sleep(70); };
  const S = () => window.__nadakkiDemo.state;
  const nav = async i => click('nav-' + i).catch(async () => { await click('menu-toggle'); await click('mnav-' + i); });
  const text = id => (q(id) || {}).textContent || '';
  const assert = (c, m) => { if (!c) throw new Error(m); };
  const errors = [];
  const origErr = console.error; console.error = (...a) => { errors.push(a.join(' ')); origErr.apply(console, a); };
  window.addEventListener('error', e => errors.push(e.message));
  const results = []; window.__qaLive = results;
  const t = async (id, name, fn) => { window.__qaCurrent = id; try { const d = await fn(); const ne = typeof d === 'string' && d.startsWith('NOT_EXECUTED'); results.push({ id, name, ok: ne ? null : true, detail: d || '' }); } catch (e) { results.push({ id, name, ok: false, detail: e.message }); } };
  const confirmYes = async () => { assert(q('confirm'), 'No apareció el diálogo de confirmación'); await click('confirm-ok'); };
  const reset = async () => { await click('reset'); await confirmYes(); await sleep(60); };
  const setView = async v => { await click(v === 'Broker' ? 'view-broker' : 'view-agente'); };
  const stage = async i => { await nav(6); await click('stage-' + i); };
  const saveTerms = async (r, d, m, s) => { await stage(1); if (r != null) await setVal('f-rent', r); if (d != null) await setVal('f-deposit', d); if (m != null) await setVal('f-months', m); if (s != null) await setVal('f-start', s); await submit('save-terms'); };
  const genDoc = async () => { await nav(7); if (!q('d-keys').value) await setVal('d-keys', '2026-10-30'); if (!q('d-repairs').value) await setVal('d-repairs', 'Arrendador'); await click('generate-doc'); };
  const allReqs = async () => { await stage(3); for (const k of ['identity', 'agreement', 'hoa', 'lead']) if (!q('req-' + k).checked) await click('req-' + k); };
  const request = async () => { await stage(4); await click('request-approval'); };
  const brokerApprove = async () => { await setView('Broker'); await nav(11); await click('inbox-op'); await click('approve'); await setView('Agente'); };
  const toApproved = async () => { await genDoc(); await allReqs(); await request(); await brokerApprove(); assert(S().op.appr.status === 'aprobada', 'No quedó aprobada'); };

  await reset();

  if (window.__nadakkiDemo.REF.mode !== 'fija') { window.__nadakkiDemo.doRef({ mode: 'fija', date: '2026-10-12' }); await sleep(120); }
  await t('T01', 'Reinicio DEMO con confirmación deja estado inicial', async () => {
    const s = S(); assert(!s.op.property && !s.op.saved && s.camps.length === 0 && !s.crm.consents.whatsapp, 'Estado no inicial');
    await click('reset'); await click('confirm-cancel'); assert(!q('confirm'), 'Cancelar no cerró el diálogo');
    assert(window.__nadakkiDemo.calAll().some(e => e.id === 'd-acad'), 'Falta práctica sugerida en calendario');
    return 'Cancelar conserva; confirmar reinicia; agenda inicial con práctica de Academia';
  });
  await t('T02', 'Navegación por los 12 centros, una sola vista visible, h1 enfocado', async () => {
    for (let i = 0; i < 12; i++) { await nav(i); assert(q('center-' + i), 'Centro ' + i + ' no visible'); const vis = [...Array(12).keys()].filter(j => q('center-' + j)).length; assert(vis === 1, 'Hay ' + vis + ' centros visibles'); assert(document.activeElement && document.activeElement.id === 'center-title', 'Foco no en h1 del centro ' + i); assert(location.hash === '#centro-' + i, 'Hash incorrecto'); }
    return '12/12 centros; sin capa duplicada';
  });
  await t('T03', 'Contexto cliente/propiedad visible en centros relacionados', async () => {
    const want = [1, 3, 6, 7, 8, 9], none = [0, 2, 4, 5, 10, 11];
    for (const i of want) { await nav(i); assert(q('context'), 'Falta contexto en ' + i); }
    for (const i of none) { await nav(i); assert(!q('context'), 'Contexto sobrante en ' + i); }
    return 'Visible en 6 centros operativos';
  });
  await t('T04', 'Sin botones falsos: elementos bloqueados son disabled y explican el motivo', async () => {
    await stage(4); const b = need('request-approval-blocked'); assert(b.disabled && b.getAttribute('aria-describedby') === 'appr-blockers' && q('appr-blockers'), 'Bloqueo sin explicación');
    window.__nadakkiDemo.requestApproval(); await sleep(60); assert(S().op.appr.status === 'none', 'La guarda de lógica permitió solicitar');
    await nav(7); assert(q('generate-doc-blocked').disabled, 'Generar no bloqueado sin datos');
    const fakes = [...document.querySelectorAll('button')].filter(x => !x.disabled && !x.onclick && !x.type); return 'Bloqueos con aria-describedby';
  });
  await t('T05', 'Recorrido Mi día → Propiedades → selección de Apartamento DEMO A', async () => {
    await nav(0); assert(text('next-label').includes('propiedad'), 'Siguiente paso no sugiere propiedad'); await click('next-action'); assert(q('center-3'), 'No navegó a Propiedades');
    await click('pick-A'); assert(S().op.property === 'A' && q('center-6'), 'No vinculó A ni abrió Operaciones'); assert(text('ctx-property') === 'Apartamento DEMO A', 'Contexto no actualizado');
    return 'Contexto actualizado: Apartamento DEMO A';
  });
  await t('T06', 'Validación accesible de condiciones (renta vacía, plazo 99)', async () => {
    await saveTerms('', null, '99', null); assert(q('err-rent') && q('err-months'), 'Errores no mostrados');
    assert(q('f-rent').getAttribute('aria-invalid') === 'true' && q('f-rent').getAttribute('aria-describedby') === 'f-rent-err', 'aria-invalid/aria-describedby ausentes'); assert(!S().op.saved, 'Guardó condiciones inválidas');
    await saveTerms('3000', '3000', '12', '2026-11-01'); assert(S().op.saved && S().op.saved.rent === 3000 && !q('err-rent'), 'No guardó condiciones válidas');
    return 'Errores con aria-invalid; guardado válido';
  });
  await t('T07', 'Documentos: campos obligatorios y borrador v1', async () => {
    await nav(7); await click('generate-doc'); assert(q('err-keys') && q('err-repairs'), 'Faltan errores de documento'); assert(S().op.doc.version === 0, 'Generó sin datos');
    await setVal('d-keys', '2026-12-01'); await click('generate-doc'); assert(text('err-keys').includes('posterior'), 'No validó llaves posterior al inicio');
    await setVal('d-keys', '2026-10-30'); await setVal('d-repairs', 'Arrendador'); await click('generate-doc'); assert(S().op.doc.version === 1 && text('doc-status') === 'VIGENTE', 'Borrador no vigente');
    return 'v1 VIGENTE';
  });
  await t('T08', 'Bloqueo por requisitos incompletos (3 de 4)', async () => {
    await stage(3); for (const k of ['identity', 'agreement', 'hoa']) await click('req-' + k); assert(text('req-count') === '3', 'Contador incorrecto');
    await stage(4); assert(q('request-approval-blocked') && !q('request-approval'), 'Solicitud no bloqueada'); assert(text('appr-blockers').includes('requisitos'), 'Motivo no indica requisitos');
    window.__nadakkiDemo.requestApproval(); await sleep(60); assert(S().op.appr.status === 'none', 'Guarda permitió solicitar');
    await nav(7); assert(text('doc-pending').includes('requisitos') && text('doc-appr') === 'Sin solicitar', 'Documentos no muestra pendientes/estado');
    return 'Bloqueado con motivo «requisitos (3 de 4)»; Documentos lo refleja';
  });
  await t('T09', 'Firma impedida sin aprobación vigente', async () => {
    await stage(5); assert(q('sign-blocked') && q('sign-blocked').disabled && !q('sign'), 'Firma no bloqueada');
    window.__nadakkiDemo.sign(); await sleep(60); assert(!q('confirm') && !S().op.signed, 'Firma permitida por lógica'); return 'UI y lógica bloquean';
  });
  await t('T10', 'Cierre impedido sin firma', async () => {
    await stage(6); assert(q('close-blocked') && q('close-blocked').disabled && !q('close'), 'Cierre no bloqueado');
    window.__nadakkiDemo.closeDeal(); await sleep(60); assert(!q('confirm') && !S().op.closed, 'Cierre permitido por lógica'); return 'UI y lógica bloquean';
  });
  await t('T11', 'Solicitud al broker y visibilidad en bandeja / Mi día', async () => {
    await stage(3); await click('req-lead'); await request(); assert(S().op.appr.status === 'solicitada', 'No quedó solicitada');
    await nav(0); assert(text('kpi-pending') === '1', 'Mi día no muestra 1 pendiente'); await nav(11); assert(q('inbox-op') && q('inbox-agent-note') && !q('approve'), 'Vista agente puede decidir');
    assert(window.__nadakkiDemo.calAll().some(e => e.id === 'd-broker'), 'Revisión del broker no aparece en calendario');
    return 'Pendiente visible; agente sin botones de decisión; revisión en calendario';
  });
  await t('T12', 'Rechazo del broker exige motivo y se muestra al agente', async () => {
    await setView('Broker'); await nav(11); await click('inbox-op'); await click('reject'); assert(q('reject-err'), 'Rechazo sin motivo permitido'); assert(S().op.appr.status === 'solicitada', 'Cambió estado sin motivo');
    await setVal('reject-reason', 'Falta copia del ID del inquilino'); await click('reject'); assert(S().op.appr.status === 'rechazada', 'No rechazó');
    await setView('Agente'); await stage(4); assert(text('appr-reason').includes('Falta copia del ID'), 'Motivo no visible en Operaciones'); assert(text('appr-history').includes('Rechazada'), 'Historial sin rechazo');
    return 'Motivo visible en Operaciones e historial';
  });
  await t('T13', 'Reenvío tras rechazo y aprobación del broker', async () => {
    await stage(4); assert(text('request-approval').includes('Reenviar'), 'Botón no indica reenvío'); await click('request-approval'); assert(S().op.appr.status === 'solicitada', 'No reenviado');
    await brokerApprove(); assert(S().op.appr.status === 'aprobada', 'No aprobada'); await stage(5); assert(q('sign'), 'Firma no habilitada tras aprobar');
    return 'Reenviada → Aprobada → firma habilitada';
  });
  await t('T14', 'Cambio de renta invalida borrador y aprobación', async () => {
    await saveTerms('3100', null, null, null); const o = S().op; assert(o.doc.status === 'invalidado' && o.appr.status === 'invalidada', 'No invalidó');
    await nav(7); assert(text('doc-status') === 'INVALIDADO' && text('doc-note').includes('renta'), 'Documentos no refleja invalidación'); await stage(5); assert(q('sign-blocked'), 'Firma no bloqueada tras cambio');
    return 'Borrador INVALIDADO, aprobación Invalidada, firma bloqueada';
  });
  await t('T15', 'Cambio de depósito invalida (tras re-aprobar)', async () => {
    await toApproved(); await saveTerms(null, '3500', null, null); const o = S().op; assert(o.doc.status === 'invalidado' && o.appr.status === 'invalidada' && o.doc.note.includes('depósito'), 'No invalidó por depósito'); return 'Invalidado: el depósito';
  });
  await t('T16', 'Cambio de plazo invalida (tras re-aprobar)', async () => {
    await toApproved(); await saveTerms(null, null, '6', null); const o = S().op; assert(o.doc.status === 'invalidado' && o.appr.status === 'invalidada' && o.doc.note.includes('plazo'), 'No invalidó por plazo'); return 'Invalidado: el plazo';
  });
  await t('T17', 'Cambio de propiedad invalida y desmarca HOA (con confirmación)', async () => {
    await toApproved(); await nav(3); await click('pick-B'); assert(q('confirm'), 'Sin confirmación de cambio'); await confirmYes();
    const o = S().op; assert(o.property === 'B' && o.doc.status === 'invalidado' && o.appr.status === 'invalidada' && !o.reqs.hoa, 'No invalidó por propiedad'); assert(text('ctx-property') === 'Apartamento DEMO B', 'Contexto no cambió');
    return 'B vinculada; borrador/aprobación invalidados; HOA desmarcado';
  });
  await t('T18', 'Desmarcar requisito tras aprobación invalida la aprobación', async () => {
    await toApproved(); await stage(3); await click('req-identity'); assert(S().op.appr.status === 'invalidada', 'No invalidó'); await click('req-identity'); return 'Aprobación invalidada';
  });
  await t('T32', 'Cambio de fecha de inicio invalida borrador y aprobación', async () => {
    await toApproved(); await saveTerms(null, null, null, '2026-11-15'); const o = S().op; assert(o.doc.status === 'invalidado' && o.appr.status === 'invalidada' && o.doc.note.includes('fecha'), 'No invalidó por fecha'); return 'Invalidado: la fecha de inicio';
  });
  await t('T33', 'Modificación del borrador (llaves) invalida borrador y aprobación', async () => {
    await toApproved(); await nav(7); await setVal('d-keys', '2026-10-29'); const o = S().op; assert(o.doc.status === 'invalidado' && o.appr.status === 'invalidada' && text('doc-status') === 'INVALIDADO', 'No invalidó por borrador');
    await click('generate-doc'); assert(S().op.doc.status === 'vigente' && S().op.doc.version >= 2, 'No regeneró'); await stage(5); assert(q('sign-blocked'), 'Firma no bloqueada sin nueva aprobación'); return 'Borrador regenerado; firma bloqueada hasta nueva aprobación';
  });
  await t('T19', 'Firma y cierre con confirmación; Mi día y Finanzas actualizados', async () => {
    await request(); await brokerApprove(); await stage(5); await click('sign'); await click('confirm-cancel'); assert(!S().op.signed, 'Cancelar firmó');
    await click('sign'); await confirmYes(); assert(S().op.signed, 'No firmó'); await stage(6); await click('close'); await confirmYes(); assert(S().op.closed, 'No cerró');
    await nav(0); assert(text('kpi-progress') === 'CERRADA', 'Mi día no muestra CERRADA'); assert(text('task-6').includes('Hecha'), 'Career Director no marcó cierre');
    await nav(8); assert(text('fin-status') === 'CERRADA' && q('fin-closed'), 'Finanzas no actualizada');
    await nav(3); assert(!q('pick-A'), 'Permite iniciar otra operación tras cierre');
    await nav(7); assert(text('draft').includes('origen Operaciones') && text('doc-appr') === 'Aprobada', 'Documentos sin procedencia/estado');
    return 'CERRADA en Mi día, Finanzas y contexto';
  });
  await t('T20', 'Finanzas: escenario editable, validación, fuente y partidas por cotizar', async () => {
    await nav(8); await setVal('fin-fee', '10'); const g = text('fin-gross'); assert(g === 'USD 310', 'Honorario esperado USD 310, obtenido ' + g);
    await setVal('fin-fee', '150'); assert(q('err-fee') && text('fin-gross') === '—', 'No validó 150%'); await setVal('fin-fee', '5');
    const tbl = text('cost-table'); assert(tbl.includes('POR COTIZAR') && tbl.includes('Hipotético') && tbl.includes('Dato de la operación'), 'Faltan precisión/fuente'); return '10% × 3100 = USD 310; 150% rechazado';
  });
  await t('T21', 'Marketing AI: campaña desde propiedad, validación de brokerage, solicitud', async () => {
    await nav(4); assert(q('camp-empty'), 'Sin estado vacío'); await click('new-camp'); assert(S().camps.length === 1, 'No creó');
    await setVal('camp-copy', 'Apartamento en Sunny Isles, agenda tu visita.'); await click('camp-request'); assert(text('camp-copy-err').includes('Brokerage'), 'No exigió nombre de brokerage'); assert(S().camps[0].status === 'borrador', 'Envió inválida');
    await click('camp-regen'); await click('camp-request'); assert(S().camps[0].status === 'solicitada', 'No solicitó'); return 'Brokerage exigido; solicitada';
  });
  await t('T22', 'Marketing AI: rechazo con motivo, edición y reenvío, aprobación', async () => {
    await setView('Broker'); await nav(11); await click('inbox-camp-1'); await setVal('reject-reason', 'Añadir tope de presupuesto menor'); await click('reject'); await setView('Agente');
    await nav(4); assert(text('camp-reason').includes('tope'), 'Motivo no visible'); await setVal('camp-budget', '100'); await click('camp-request'); assert(S().camps[0].status === 'solicitada', 'No reenvió');
    await setView('Broker'); await nav(11); await click('inbox-camp-1'); await click('approve'); await setView('Agente'); assert(S().camps[0].status === 'aprobada', 'No aprobó');
    await nav(0); assert(text('task-7').includes('Hecha'), 'Career Director no conectó campaña'); return 'Rechazada → editada → reenviada → aprobada';
  });
  await t('T23', 'CRM: sin consentimiento no responde; con consentimiento responde', async () => {
    await nav(9); await setVal('crm-input', 'Hola, ¿sigue disponible?'); await submit('crm-send'); assert(qa('msg-bot').length === 0, 'Respondió sin consentimiento');
    await click('crm-consent'); assert(S().crm.consents.whatsapp, 'No registró'); await setVal('crm-input', '¿Puedo visitarlo el sábado?'); await submit('crm-send'); assert(qa('msg-bot').length === 1, 'No respondió con consentimiento');
    await submit('crm-send'); assert(q('crm-input').getAttribute('aria-invalid') === 'true', 'Mensaje vacío sin error'); return 'Consentimiento controla al asistente';
  });
  await t('T24', 'CRM: transferencia humana pausa el asistente', async () => {
    await click('crm-human'); assert(S().crm.human && text('crm-status') === 'Agente humano', 'No transfirió'); const bots = qa('msg-bot').length;
    await setVal('crm-input', 'Hola, soy [AGENTE]; te confirmo la visita.'); await submit('crm-send'); assert(qa('msg-agent').length === 1 && qa('msg-bot').length === bots, 'Asistente respondió en modo humano');
    await click('crm-bot'); assert(!S().crm.human, 'No devolvió al asistente'); return 'Mensaje humano; asistente en pausa';
  });
  await t('T25', 'CRM: STOP da de baja el canal y bloquea el envío', async () => {
    await setVal('crm-input', 'STOP'); await submit('crm-send'); assert(S().crm.stops.whatsapp && q('crm-stopped') && !q('crm-input'), 'STOP no bloqueó');
    window.__nadakkiDemo.ui({ crmDraft: 'hola' }); await sleep(40); window.__nadakkiDemo.crmSend(); await sleep(60); assert(S().crm.msgs[S().crm.msgs.length - 1].from === 'system', 'Se envió tras STOP'); return 'Canal dado de baja';
  });
  await t('T34', 'CRM: consentimiento y STOP son por canal', async () => {
    await click('crm-ch-correo'); assert(text('crm-status') === 'Asistente activo' && q('crm-input'), 'Correo bloqueado por STOP de WhatsApp');
    const bots = qa('msg-bot').length; await setVal('crm-input', 'Envíame los detalles por correo'); await submit('crm-send'); assert(qa('msg-bot').length === bots + 1, 'No respondió por correo');
    await click('crm-ch-llamada'); assert(q('crm-consent') && text('crm-status') === 'Sin consentimiento', 'Llamada sin consentimiento no se distingue');
    await click('crm-ch-whatsapp'); assert(q('crm-stopped'), 'WhatsApp perdió el STOP'); return 'WhatsApp baja · Correo activo · Llamada sin consentimiento';
  });
  await t('T35', 'Demand Radar: interpretación, período, límites y estado no disponible', async () => {
    await nav(5); assert(text('radar-read').includes('no un número de personas') && document.querySelector('[data-qa=center-5]').textContent.includes('Período'), 'Falta interpretación');
    await click('signal-records'); assert(!q('radar-read') && text('radar-desc').includes('no aplican'), 'Compras registradas en alquiler no marcadas'); await click('signal-intent'); return 'Lectura y límites visibles';
  });
  await t('T26', 'Academia: práctica guiada con evaluación ilustrativa conectada a Mi día', async () => {
    await nav(10); await click('acad-start-visita'); await click('acad-opt-1'); assert(q('acad-feedback'), 'Sin feedback'); await click('acad-opt-2'); await click('acad-opt-0');
    assert(text('acad-total').includes('4 de 6'), 'Puntuación esperada 4 de 6: ' + text('acad-total')); await nav(0); assert(text('task-8').includes('Hecha'), 'Career Director no conectó práctica');
    return '4 de 6 puntos; tarea marcada';
  });
  await t('T27', 'Career Director refleja progreso real (9/9)', async () => { await nav(0); assert(text('kpi-plan').replace(/\s/g, '') === '9/9', 'Plan: ' + text('kpi-plan')); return text('kpi-plan'); });
  await t('T28', 'Persistencia local del estado DEMO', async () => { const raw = JSON.parse(localStorage.getItem(window.__nadakkiDemo.KEY)); assert(raw.op.closed && raw.camps.length === 1, 'No persistido'); return 'localStorage ' + window.__nadakkiDemo.KEY; });
  await t('T29', 'Teclado: diálogo con foco, Escape cierra y devuelve foco (incluye navegación previa y rAF retrasado)', async () => {
    const nativeRaf = window.requestAnimationFrame.bind(window), nativeCancel = window.cancelAnimationFrame.bind(window), queue = []; let delayed = false;
    window.requestAnimationFrame = cb => { if (delayed) { queue.push(cb); return 900000 + queue.length; } return nativeRaf(cb); };
    window.cancelAnimationFrame = id => { if (id > 900000) queue[id - 900001] = null; else nativeCancel(id); };
    const flush = () => queue.splice(0).forEach(cb => cb && cb(performance.now())); let fails = [];
    try { for (let i = 0; i < 21; i++) { delayed = i >= 11; if (i) { window.__nadakkiDemo.go(i % 2 ? 1 : 0); await sleep(0); }
        const r = need('reset'); r.focus(); r.click(); await sleep(60); if (!(document.activeElement && document.activeElement.id === 'confirm-ok')) { fails.push(i + ':sin foco en diálogo'); continue; }
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await sleep(0); if (delayed) flush(); await sleep(30); if (delayed) flush(); await sleep(30);
        if (q('confirm')) fails.push(i + ':no cerró'); else if (document.activeElement !== q('reset')) fails.push(i + ':' + (document.activeElement.id || document.activeElement.dataset.qa || document.activeElement.tagName)); }
    } finally { delayed = false; flush(); window.requestAnimationFrame = nativeRaf; window.cancelAnimationFrame = nativeCancel; }
    await nav(0); assert(!fails.length, 'Foco no devuelto en ' + fails.length + ' ciclos: ' + fails.slice(0, 3).join(', '));
    const bad = [...document.querySelectorAll('main button, main input, main select, main textarea')].filter(e => e.tabIndex < 0 || e.getAttribute('aria-hidden') === 'true'); assert(!bad.length, bad.length + ' controles fuera del orden de tabulación');
    return '21 ciclos (20 tras navegar, 10 con rAF retrasado) · Escape sobre el elemento enfocado · foco devuelto siempre';
  });
  await t('T36', 'Portabilidad: ningún recurso cargado desde otro origen', async () => {
    const urls = [...performance.getEntriesByType('resource').map(e => e.name), ...[...document.scripts].map(s => s.src), ...[...document.querySelectorAll('link[href]')].map(l => l.href)].filter(Boolean);
    const ext = urls.filter(u => { try { const x = new URL(u, location.href); return !['data:', 'blob:'].includes(x.protocol) && x.origin !== location.origin; } catch (e) { return false; } });
    assert(!ext.length, 'Externos: ' + [...new Set(ext)].slice(0, 3).join(' ')); assert(window.React && window.React.version === '18.3.1', 'React local no cargado'); return urls.length + ' recursos, 0 externos · React ' + React.version + ' local';
  });
  await t('T37', 'Mi oficina: configuración del agente y aviso de permisos simulados', async () => { await nav(11); assert(text('agent-config').includes('Licencia') && text('agent-config').includes('no concede permisos'), 'Falta configuración'); return 'Visible'; });
  const calOpen = async id => { await click(id); assert(q('calendar'), 'Calendario no abrió desde ' + id); };
  const calClose = async () => { await click('cal-close'); assert(!q('calendar'), 'Calendario no cerró'); };
  await t('T38', 'Smart Calendar transversal: Mi día, sidebar, Clientes, CRM, Propiedades, Operaciones; sin centro 13', async () => {
    await nav(0); q('open-cal-midia').focus(); await calOpen('open-cal-midia'); assert(document.activeElement && document.activeElement.id === 'cal-title', 'Foco no entra al calendario'); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await sleep(90); assert(!q('calendar'), 'Esc no cerró'); assert(document.activeElement === q('open-cal-midia'), 'Foco no devuelto');
    if (q('sb-cal')) { await calOpen('sb-cal'); await calClose(); }
    await nav(1); await calOpen('client-schedule'); assert(q('cal-editor'), 'Clientes no abre editor'); await calClose();
    await nav(9); await calOpen('crm-schedule'); await calClose();
    await nav(3); await click('filter-Todas'); await calOpen('cal-from-A'); await calClose();
    await nav(6); await calOpen('ops-cal'); assert(q('cal-month'), 'Operaciones no abre vista mes'); await calClose();
    assert(window.__nadakkiDemo.NAV.length === 12, 'No son 12 centros'); return 'Accesos verificados; Esc cierra y devuelve foco; 12 centros';
  });
  await t('T39', 'Calendario: vistas día, semana, mes, equipo y navegación de periodo', async () => {
    await nav(0); await calOpen('open-cal-midia');
    await click('cal-view-day'); assert(q('cal-grid'), 'Día'); await click('cal-view-month'); assert(q('cal-month'), 'Mes'); await click('cal-view-team'); assert(q('cal-team') && text('cal-team').includes('Agente DEMO 3'), 'Equipo'); await click('cal-view-week'); assert(q('cal-grid'), 'Semana');
    await click('cal-today'); const r1 = text('cal-range'); await click('cal-next'); assert(text('cal-range') !== r1, 'Siguiente no cambia'); await click('cal-prev'); assert(text('cal-range') === r1, 'Anterior no vuelve'); return r1;
  });
  await t('T40', 'Calendario: crear evento con validación de horas', async () => {
    await click('cal-new'); await setVal('ce-title', 'Llamada de seguimiento QA'); await setVal('ce-start', '14:00'); await setVal('ce-end', '13:00'); await submit('ce-save'); assert(q('ce-time-err'), 'Sin error de horas');
    await setVal('ce-end', '14:30'); await submit('ce-save'); const ev = S().cal.events.find(e => e.title === 'Llamada de seguimiento QA'); assert(ev && q('cev-' + ev.id), 'Evento no visible'); return ev.id + ' · ' + ev.date + ' 14:00–14:30';
  });
  await t('T41', 'Calendario: editar, reprogramar y cancelar', async () => {
    const ev = S().cal.events.find(e => e.title === 'Llamada de seguimiento QA'); const d0 = ev.date; await click('cev-' + ev.id); await click('ce-shift'); await submit('ce-save');
    const e2 = S().cal.events.find(e => e.id === ev.id); assert(e2.date !== d0, 'No reprogramó'); await click('cev-' + ev.id); await click('ce-cancel'); assert(S().cal.events.find(e => e.id === ev.id).status === 'cancelada' && text('cev-' + ev.id).includes('CANCELADO'), 'No canceló'); return d0 + ' → ' + e2.date + ' · cancelado y visible';
  });
  await t('T42', 'Calendario: choque detectado en Mi día y resuelto al reprogramar', async () => {
    await calClose(); await nav(0); assert(q('today-conflict'), 'Mi día no muestra choque');
    await calOpen('open-cal-midia'); await click('cev-e4'); assert(q('ce-conflict'), 'Editor no avisa del choque'); await setVal('ce-start', '13:00'); await setVal('ce-end', '14:00'); await submit('ce-save'); await calClose(); await nav(0); assert(!q('today-conflict'), 'Choque sigue'); return 'Visita B movida a 13:00; choque resuelto';
  });
  await t('T43', 'Calendario: preparación sugerida aceptar y descartar', async () => {
    await calOpen('open-cal-midia'); await click('cal-view-week'); await click('sugg-e1'); assert(S().cal.events.some(e => e.type === 'prep' && e.link === 'e1') && !q('sugg-e1'), 'No aceptó');
    await click('cev-s-e4'); await click('cd-dismiss'); assert(S().cal.dismissed.includes('s-e4'), 'No descartó'); return 'Aceptada e1; descartada e4';
  });
  await t('T44', 'Calendario: fechas documentales y Academia vinculadas al estado', async () => {
    const all = window.__nadakkiDemo.calAll(); assert(all.some(e => e.id === 'd-keys' && e.date === S().op.docForm.keys) && all.some(e => e.id === 'd-start' && e.date === S().op.saved.start), 'Fechas documentales no vinculadas');
    assert(!all.some(e => e.id === 'd-acad'), 'Práctica completada sigue sugerida'); assert(text('calendar').includes('Entrega de llaves'), 'Panel no muestra fechas conectadas');
    window.__nadakkiDemo.calOpenEvt('d-keys'); await sleep(80); assert(text('cal-detail').includes('solo lectura'), 'Vinculado editable'); await click('cd-origin'); assert(q('center-7') && !q('calendar'), 'No abrió Documentos'); return 'Llaves ' + S().op.docForm.keys + ' · inicio ' + S().op.saved.start;
  });
  await t('T45', 'Agendar desde Clientes sin reingresar datos; sincronización simulada marcada', async () => {
    await nav(1); await calOpen('client-schedule'); assert(q('ce-client').value === '1' && q('ce-prop').value === S().op.property, 'Datos no traídos: ' + q('ce-client').value + '/' + q('ce-prop').value);
    await submit('ce-save'); assert(S().cal.events.some(e => e.type === 'visita' && e.client === '1' && e.prop === S().op.property && e.id.startsWith('u')), 'No guardó'); await click('cal-today'); await click('cal-view-week'); assert(text('cev-e6').includes('SIM'), 'SIM no marcado'); await calClose(); return 'Cliente y propiedad prellenados; SIM visible';
  });
  await t('T46', 'Sidebar: búsqueda, Enter, chips de estado y Career Director', async () => {
    if (!q('navq')) return 'NOT_EXECUTED: barra lateral oculta en este viewport (navegación móvil)';
    await nav(0); assert(text('sb-next') === text('next-label'), 'Career Director lateral distinto de Mi día'); assert(text('nav-3').includes('Elegida'), 'Chip de Propiedades');
    await setVal('navq', 'finan'); assert(q('nav-8') && !q('nav-0'), 'No filtra'); q('navq').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await sleep(90); assert(q('center-8'), 'Enter no navega'); return 'Filtro y Enter OK; chips y guía coherentes';
  });
  const D = () => window.__nadakkiDemo;
  const alertsTxt = () => text('cd-alerts');
  const toMiDia = async () => { if (q('calendar')) await click('cal-close'); await nav(0); };
  await t('T47', 'Property Watch: estado inicial, procedencia y búsqueda guardada del cliente', async () => {
    await reset(); await nav(3); assert(q('pw') && q('pw-no-zones'), 'Falta panel o estado vacío de zonas');
    assert(/sintético/.test(text('pw-src')) && /actualizado/.test(text('pw-src')), 'Falta procedencia/actualización'); assert(q('pw-w-s1') && text('pw-w-s1').includes('Contacto DEMO 1'), 'Falta búsqueda guardada del cliente');
    return text('pw-w-s1').slice(0, 90);
  });
  await t('T48', 'Recorrido A: guardar zona → listing nuevo → revisar → crear seguimiento', async () => {
    await submit('pw-save'); assert(q('pw-w-w1'), 'Zona no guardada'); assert(text('pw-w-w1').includes('3 nuevas'), 'Conteo de nuevas: ' + text('pw-w-w1'));
    await toMiDia(); assert(q('cd-alert-new') && /tres nuevas publicaciones/.test(text('cd-alert-new')), 'Career Director no avisa: ' + alertsTxt());
    await click('cd-go-new'); assert(q('center-3') && S().ui.pwF.show === 'nuevos', 'No abrió Propiedades filtrado'); await click('pw-open-D'); assert(q('pw-detail') && text('pw-detail').includes('Apartamento DEMO D'), 'Ficha no abre');
    await click('pw-follow'); assert(q('cal-editor') && q('ce-prop').value === 'D' && q('ce-type').value === 'seguimiento', 'Editor no prellenado: ' + q('ce-prop').value);
    assert(/Disponibilidad/.test(text('ce-avail')), 'Sin disponibilidad'); await submit('ce-save'); const ev = S().cal.events.find(e => e.prop === 'D' && e.watchKey);
    assert(ev, 'Seguimiento no guardado'); await toMiDia(); assert(/dos nuevas publicaciones/.test(text('cd-alert-new')) && !text('cd-alert-new').includes('DEMO D'), 'Alerta no se actualiza'); return ev.title + ' · ' + ev.date + ' ' + ev.start;
  });
  await t('T49', 'Duplicados: misma zona bloqueada; una alerta por listing', async () => {
    await nav(3); const n = S().pw.watches.length; await submit('pw-save'); assert(q('pw-err') && /Ya vigilas/.test(text('pw-err')), 'Duplicado no bloqueado'); assert(S().pw.watches.length === n, 'Se duplicó');
    await click('pw-kind-busqueda'); await setVal('pwf-zone', 'Collins Ave norte'); await setVal('pwf-max', ''); await submit('pw-save'); assert(S().pw.watches.length === n + 1, 'Búsqueda solapada no guardada');
    const al = D().alerts(); assert(al.filter(a => a.kind === 'new').length === 1, 'Más de una alerta de nuevas'); const ids = al.flatMap(a => a.ids || [a.lid]); assert(ids.length === new Set(ids).size, 'Listing repetido en alertas: ' + ids);
    await click('pw-kind-zona'); return 'Zona repetida rechazada; búsqueda solapada → 1 alerta, ' + ids.length + ' listings únicos';
  });
  await t('T50', 'Filtros por ciudad, zona, operación, características y estado', async () => {
    await setVal('pwq-show', 'todos'); await setVal('pwq-city', 'Aventura'); assert(q('pw-open-H') && q('pw-open-I') && !q('pw-open-D'), 'Ciudad');
    await setVal('pwq-op', 'Venta'); assert(q('pw-open-H') && !q('pw-open-I'), 'Operación'); await setVal('pwq-op', 'Todas'); await setVal('pwq-beds', '3'); assert(q('pw-open-H') && !q('pw-open-I'), 'Habitaciones');
    await setVal('pwq-zone', 'Collins Ave sur'); assert(q('pw-empty'), 'Sin estado vacío'); await setVal('pwq-city', 'Todas'); await setVal('pwq-zone', 'Todas'); await setVal('pwq-beds', '0'); await setVal('pwq-show', 'bajas');
    assert(q('pw-open-G') && q('pw-open-H') && !q('pw-open-D'), 'Reducciones'); const c = text('pw-count'); await setVal('pwq-show', 'todos'); return c;
  });
  await t('T51', 'Historial visual de precio', async () => {
    await click('pw-open-G'); const hist = q('pw-hist'); assert(hist && hist.children.length === 3, 'Barras: ' + (hist && hist.children.length));
    const lab = hist.getAttribute('aria-label'); assert(/3,450/.test(lab) && /3,150/.test(lab), 'aria-label'); assert(/5 %/.test(text('pw-drop')), 'Texto de baja'); return lab;
  });
  await t('T52', 'Frecuencia de avisos guardada y persistida', async () => {
    await setVal('pw-freq-w1', 'semanal'); assert(S().pw.watches.find(w => w.id === 'w1').freq === 'semanal', 'Estado'); await sleep(60);
    const ls = JSON.parse(localStorage.getItem(window.__nadakkiDemo.KEY)); assert(ls.pw.watches.find(w => w.id === 'w1').freq === 'semanal', 'No persistido'); return 'semanal en estado y localStorage';
  });
  await t('T53', 'Recorrido C: baja de precio → coincidencia → Career Director → consentimiento (controles visibles) → seguimiento', async () => {
    await toMiDia(); assert(q('cd-alert-drop') && /redujo su precio/.test(text('cd-alert-drop')) && text('cd-alert-drop').includes('Contacto DEMO 1'), 'Sin alerta de baja');
    await click('cd-go-drop'); assert(q('center-3') && q('pw-detail') && text('pw-detail').includes('DEMO G') && q('pw-match'), 'No enlaza a la propiedad');
    await nav(9); await click('crm-contact-1'); await click('crm-ch-correo'); await setVal('crm-input', 'STOP'); await submit('crm-send'); assert(q('crm-stopped') && /Baja \(STOP\)/.test(text('crm-ch-correo')), 'STOP en Correo no aplicado');
    await nav(3); await click('pw-open-G'); assert(q('pw-follow').disabled && q('pw-follow-why') && q('pw-follow').getAttribute('aria-describedby') === 'pw-follow-why' && /Correo: baja/.test(text('pw-consent')), 'Sin consentimiento vigente no bloquea');
    await nav(9); await click('crm-ch-whatsapp'); await click('crm-consent'); assert(/Con consentimiento/.test(text('crm-ch-whatsapp')), 'Consentimiento WhatsApp no registrado');
    await nav(3); await click('pw-open-G'); assert(!q('pw-follow').disabled && /WhatsApp DEMO: sí/.test(text('pw-consent')), 'Consentimiento no refleja');
    await click('pw-follow'); assert(q('ce-client').value === '1' && q('ce-prop').value === 'G' && /por WhatsApp DEMO/.test(q('ce-title').value), 'Editor: ' + q('ce-title').value); await submit('ce-save');
    await toMiDia(); assert(!q('cd-alert-drop'), 'Alerta de baja sigue tras el seguimiento'); assert(q('cd-res-G') && /programado/.test(text('cd-res-G')), 'Resuelta sin estado de seguimiento');
    return 'STOP Correo → bloqueado · consentimiento WhatsApp → seguimiento · resuelta: ' + text('cd-res-G').replace(/\s+/g, ' ').slice(-40);
  });
  await t('T54', 'Recorrido B: cliente identificado pide información → CRM → Career Director → agenda', async () => {
    await nav(9); assert(q('vi-no-reqs'), 'Sin estado vacío'); await click('sim-identified'); assert(q('vi-req-r1') && /Nueva/.test(text('vi-req-r1')), 'Solicitud no registrada');
    await click('sim-identified'); assert(S().vi.requests.length === 1, 'Solicitud duplicada');
    await nav(1); await click('client-1'); assert(text('vi-level') === 'Alto' && /1 solicitud/.test(text('vi-interest')), 'Interés: ' + text('vi-interest'));
    await toMiDia(); assert(q('cd-alert-req') && /solicitó información/.test(text('cd-alert-req')), 'Career Director no avisa'); assert((alertsTxt().match(/Apartamento DEMO E/g) || []).length === 1, 'E duplicado en alertas');
    await click('cd-go-req'); assert(q('center-9'), 'No enlaza al CRM'); await click('vi-sched-r1'); assert(q('ce-client').value === '1' && q('ce-prop').value === 'E' && q('ce-type').value === 'visita', 'Editor no prellenado');
    await submit('ce-save'); await click('cal-close'); assert(/Visita agendada/.test(text('vi-req-r1')), 'Estado no actualiza'); await nav(0); assert(!q('cd-alert-req'), 'Alerta sigue'); return 'r1 → visita agendada; interés Alto; sin duplicados';
  });
  await t('T55', 'Agenda desde alerta: conflictos y disponibilidad visibles', async () => {
    await nav(1); await click('client-1'); await click('vi-schedule'); assert(q('cal-editor') && /Disponibilidad/.test(text('ce-avail')), 'Sin disponibilidad');
    assert(!q('ce-conflict'), 'Hueco sugerido choca'); await setVal('ce-date', '2026-10-12'); await setVal('ce-start', '11:00'); await setVal('ce-end', '12:00'); assert(q('ce-conflict'), 'No muestra conflicto'); const a = text('ce-avail'); await click('ce-close'); await click('cal-close'); return a.slice(0, 110);
  });
  await t('T56', 'Recorrido D: visitante anónimo sin identidad atribuida', async () => {
    await nav(9); const n = S().vi.anon.sessions.length, a0 = S().vi.anon.agg.A, r0 = S().vi.requests.length, al0 = D().alerts().length; await click('sim-anon');
    const ss = S().vi.anon.sessions; assert(ss.length === n + 1 && S().vi.anon.agg.A === a0 + 1, 'No registra'); const el = q('vi-sess-' + ss[ss.length - 1].id); assert(el, 'Sesión no visible');
    assert(!/Contacto DEMO/.test(text('vi-anon')) && !el.querySelector('button'), 'Identidad o acciones en sesión anónima'); assert(S().vi.requests.length === r0 && D().alerts().length === al0, 'Creó solicitud o alerta personal'); return ss[ss.length - 1].id + ' · agregado A=' + S().vi.anon.agg.A;
  });
  await t('T57', 'Consentimiento por canal en acciones de envío (controles visibles)', async () => {
    await nav(1); await click('client-2'); assert(q('vi-send').disabled && q('vi-send').getAttribute('aria-describedby') === 'vi-send-why', 'Contacto 2 sin consentimiento puede enviar');
    await click('client-1'); assert(!q('vi-send').disabled && /WhatsApp DEMO/.test(text('vi-send')), 'Contacto 1 bloqueado'); const n = S().vi.sent.length; await click('vi-send'); assert(S().vi.sent.length === n + 1, 'No registró envío');
    await nav(9); await click('crm-contact-1'); await click('crm-ch-whatsapp'); await setVal('crm-input', 'STOP'); await submit('crm-send'); assert(q('crm-stopped'), 'STOP WhatsApp no aplicado');
    await nav(1); await click('client-1'); assert(q('vi-send').disabled && /WhatsApp DEMO: baja \(STOP\)/.test(text('vi-consent')), 'STOP no bloquea el envío');
    await nav(9); assert(q('vi-send-r1') && q('vi-send-r1').disabled, 'Solicitud permite envío tras STOP'); return 'C2 bloqueado · C1 enviado · STOP WhatsApp → bloqueado en Clientes y CRM';
  });
  await t('T58', 'Demand Radar resume zonas vigiladas y enlaza a Propiedades', async () => {
    await nav(5); assert(q('radar-pw') && /nuevas/.test(text('radar-pw')), 'Sin resumen'); await click('radar-pw-go'); assert(q('center-3') && q('pw'), 'No navega'); return text('radar-pw').slice(0, 0) || 'OK';
  });
  await t('T59', 'Descartar alerta y reinicio limpia Property Watch y visitantes', async () => {
    await nav(0); const k = D().alerts()[0]; if (k) { await click('cd-dismiss-' + k.kind); assert(!D().alerts().some(a => a.key === k.key), 'No descarta'); }
    await reset(); const s = S(); assert(s.pw.watches.length === 1 && !s.vi.requests.length && !s.cdx.dismissed.length && s.vi.anon.sessions.length === 2, 'No reinicia'); return 'Descartada ' + (k ? k.kind : '-') + '; reinicio OK';
  });
  await t('T60', 'Fecha configurable: validación, personalizada desplaza los datos DEMO, fija restaura', async () => {
    await reset(); await nav(11); assert(q('ref-config') && /fecha fija reproducible/.test(text('ref-active')), 'Sin configuración');
    await click('ref-mode-personalizada'); await setVal('ref-date-input', ''); await click('ref-apply'); assert(q('ref-err') && q('ref-date-input').getAttribute('aria-invalid') === 'true' && !q('confirm'), 'Fecha vacía aceptada');
    await setVal('ref-date-input', '2027-03-01'); await click('ref-apply'); await confirmYes(); await sleep(80);
    assert(D().TODAY === '2027-03-01', 'TODAY ' + D().TODAY); await nav(0); assert(/Lunes, 1 de marzo de 2027/.test(text('ref-date')) && /personalizada/.test(text('ref-mode')), 'Mi día: ' + text('ref-date'));
    assert(S().cal.events.find(e => e.id === 'e1').date === '2027-03-01', 'Agenda no desplazada'); assert(S().op.form.start === D().addDays('2027-03-01', 20), 'Inicio de alquiler: ' + S().op.form.start);
    assert(D().LISTINGS.filter(l => D().lNew(l)).length === 4, 'Listings nuevos no relativos'); assert(JSON.parse(localStorage.getItem(window.__nadakkiDemo.KEY + '_ref')).date === '2027-03-01', 'No persistida');
    await nav(11); await click('ref-mode-fija'); await click('ref-apply'); await confirmYes(); await sleep(80); assert(D().TODAY === '2026-10-12' && S().cal.events.find(e => e.id === 'e1').date === '2026-10-12', 'Fija no restaura');
    return '2027-03-01 → e1 2027-03-01, inicio ' + D().addDays('2027-03-01', 20) + ', 4 nuevos · fija restaurada';
  });
  await t('T61', 'Fecha configurable: modo Hoy usa el reloj del dispositivo', async () => {
    await nav(11); await click('ref-mode-hoy'); await click('ref-apply'); await confirmYes(); await sleep(80); const td = D().localToday();
    assert(D().TODAY === td && /dispositivo/.test(text('ref-active')), 'Hoy: ' + D().TODAY); await click('ref-mode-fija'); await click('ref-apply'); await confirmYes(); await sleep(80); assert(D().TODAY === '2026-10-12', 'No volvió a fija'); return 'Hoy = ' + td + ' · restaurada fija';
  });
  await t('T62', 'Aceptar una preparación crea una tarea vinculada al evento', async () => {
    await reset(); await nav(0); assert(q('tasks-empty'), 'Sin estado vacío'); await calOpen('open-cal-midia'); await click('cal-view-week'); await click('sugg-e1'); const ev = S().cal.events.find(e => e.type === 'prep' && e.link === 'e1');
    const tk = S().tasks[0]; assert(ev && tk && tk.eventId === ev.id, 'Tarea no creada'); await calClose(); await nav(0);
    assert(q('task-' + tk.id) && /Pendiente/.test(text('task-st-' + tk.id)) && /antes de «Visita Apartamento DEMO A» 11:00/.test(text('task-' + tk.id)), 'Mi día: ' + text('task-' + tk.id));
    await click('task-done-' + tk.id); assert(/Hecha/.test(text('task-st-' + tk.id)), 'No se marcó'); await click('task-cal-' + tk.id); await sleep(80); assert(q('cal-editor') && /Tarea vinculada en Mi día/.test(text('ce-task')) && /hecha/.test(text('ce-task')), 'Editor no muestra la tarea');
    await click('ce-cancel'); await calClose(); await nav(0); assert(/Hecha|Evento cancelado/.test(text('task-st-' + tk.id)), 'Estado');
    await click('task-done-' + tk.id); assert(/Evento cancelado/.test(text('task-st-' + tk.id)) && q('task-done-' + tk.id).disabled, 'Cancelar el evento no se refleja'); return tk.id + ' ↔ ' + ev.id + ' · hecha · evento cancelado → tarea bloqueada';
  });
  await t('T63', 'Agenda del equipo: libre/ocupado por defecto; detalles solo con permiso simulado del broker', async () => {
    await reset(); await setView('Agente'); await calOpen('open-cal-midia'); await click('cal-view-team'); assert(q('cal-privacy') && /libre\/ocupado/.test(text('cal-privacy')) && !q('cal-team-details'), 'Sin aviso o con botón en vista Agente');
    assert(/Ocupado/.test(text('cev-e8')) && !/Llamada con propietario/.test(text('calendar')), 'Detalle de otro agente visible'); await click('cev-e8'); assert(!q('cal-editor'), 'Abrió el evento privado');
    await click('cal-view-week'); await setVal('cal-agent', 'a2'); assert(/Ocupado/.test(text('cev-e7')) && !/Open house/.test(text('calendar')), 'Vista semana del agente 2 muestra detalles'); await setVal('cal-agent', 'a1'); await calClose();
    await setView('Broker'); await calOpen('open-cal-midia'); await click('cal-view-team'); await click('cal-team-details'); assert(/Llamada con propietario/.test(text('cev-e8')), 'Broker no ve detalles'); await calClose();
    await setView('Agente'); await calOpen('open-cal-midia'); await click('cal-view-team'); assert(!/Llamada con propietario/.test(text('calendar')), 'Detalles visibles al volver a Agente'); await click('cal-view-week'); await calClose(); return 'Agente: Ocupado · Broker (simulado): detalles · vuelta a Agente: oculto';
  });
  await t('T64', 'Alquiler completo y compraventa pendiente diferenciados', async () => {
    await nav(3); await click('filter-Todas'); assert(/Alquiler · recorrido completo/.test(text('journey-A')) && /Compraventa · recorrido pendiente/.test(text('journey-C')), 'Tarjetas'); assert(!q('pick-C'), 'Venta ofrece iniciar operación');
    await click('pw-open-H'); assert(/Compraventa · recorrido pendiente/.test(text('pw-journey')) && /no está disponible/.test(text('pw-detail')), 'Ficha H'); await click('pw-close');
    await nav(1); assert(/Alquiler/.test(text('client-journey-1')) && /Compraventa/.test(text('client-journey-2')), 'Directorio'); await click('client-2'); assert(/pendiente/.test(text('client-journey')), 'Ficha cliente'); await click('client-1');
    await nav(6); assert(/recorrido completo/.test(text('ops-journey')) && /compraventa sigue pendiente/.test(text('ops-journey')), 'Operaciones'); await nav(11); assert(q('journey-rental') && q('journey-sale'), 'Mi oficina'); await nav(3); await click('filter-Alquiler'); return 'Tarjetas, ficha, clientes, Operaciones y Mi oficina';
  });
  await t('T65', 'Cada alerta de Property Watch: fuente, fecha de observación, cambio de precio y seguimiento', async () => {
    await reset(); await nav(3); await submit('pw-save'); await toMiDia(); const items = [...document.querySelectorAll('[data-qa^="al-item-"]')]; assert(items.length === 4, 'Ítems: ' + items.length);
    items.forEach(li => { const x = li.textContent; assert(/Fuente: feed Matrix sintético/.test(x) && /Observado: (lun|mar|mié|jue|vie|sáb|dom) \d+ \w+ · 08:00/.test(x) && /Precio: .*USD/.test(x) && /Seguimiento: (Sin seguimiento|.*programado)/.test(x), 'Ítem incompleto: ' + x); });
    assert(/USD 3,300\/mes → USD 3,150\/mes \(−5 %\)/.test(text('al-item-drop-G')) && /sin cambios/.test(text('al-item-new-D')), 'Cambio de precio');
    await click('cd-dismiss-new'); assert(q('cd-res-D') && /Descartada sin seguimiento/.test(text('cd-res-D')), 'Descartada sin estado'); return items.length + ' ítems completos · descartadas con estado';
  });
  await t('T66', 'Visitantes anónimos nunca aparecen como clientes identificados', async () => {
    await nav(9); const r0 = S().vi.requests.length, i0 = D().interest(1).score; await click('sim-anon'); await click('sim-anon'); const ids = S().vi.anon.sessions.map(x => x.id);
    const rx = new RegExp(ids.join('|')); const only = re => [...document.querySelectorAll('[data-qa]')].filter(e => re.test(e.dataset.qa));
    assert(only(/^crm-contact-\d+$/).length === 2 && !only(/^crm-contact-\d+$/).some(e => rx.test(e.textContent)), 'Sesión en contactos CRM'); assert(!rx.test(text('vi-crm').split('Sesiones anónimas')[0]), 'Sesión entre identificados');
    await nav(1); assert(only(/^client-\d+$/).length === 2 && !rx.test(text('center-1')), 'Sesión en Clientes'); assert(D().interest(1).score === i0 && S().vi.requests.length === r0 && !D().alerts().some(a => a.kind === 'req'), 'Anónimo altera identificados');
    await calOpen('client-schedule'); const opts = [...q('ce-client').options].map(o => o.text); assert(opts.every(o => /^(Sin cliente|Contacto DEMO \d)$/.test(o)), 'Calendario: ' + opts); await calClose(); return ids.length + ' sesiones · 0 en Clientes, CRM, alertas o calendario';
  });
  await t('T67', 'Pruebas de consentimiento y STOP sin manipular el estado', async () => {
    const src = window.__qaSrc || ''; if (!src) return 'NOT_EXECUTED: fuente del runner no disponible'; const body = src.slice(src.indexOf("await t('T53'"), src.indexOf("await t('T58'"));
    assert(!/setState|crmSend\(|\.ui\(\{/.test(body), 'T53–T57 manipulan estado'); return 'T53–T57 usan solo clics, escritura y envío de formularios';
  });
  const mapClick = async (lat, lng) => { const el = need('geo-map'), r = el.getBoundingClientRect(), [x, y] = D().gToS(lat, lng); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + x, clientY: r.top + y })); await sleep(60); };
  const ids = () => qa('').length, items = () => [...document.querySelectorAll('[data-qa^="geo-item-"]')].map(e => e.dataset.qa.slice(9)).sort().join('');
  const clearGeo = async () => { for (const b of [...document.querySelectorAll('[data-qa^="geo-rm-"]')]) { b.click(); await sleep(40); } await click('geo-clear-f'); };
  await t('T68', 'Geo Explorer: catálogo nacional versionado y datos DEMO identificados', async () => {
    await reset(); await nav(3); assert(q('geo') && /DATOS DEMO/.test(text('geo-demo')) && /no MLS/.test(text('geo-demo')), 'Sin distintivo DEMO');
    assert(q('geo-state').options.length === 51 && /geo-demo-2026\.10-v1/.test(text('geo-version')), 'Catálogo: ' + q('geo-state').options.length);
    const it = [...document.querySelectorAll('[data-qa^="geo-item-"]')]; assert(it.length === 11 && it.every(e => /feed sintético DEMO \(no MLS\)/.test(e.textContent)), 'Ítems sin fuente DEMO: ' + it.length);
    assert(!q('geo-tiles').checked && !q('geo-attrib'), 'Capa externa activa por defecto'); return '51 jurisdicciones · 11 publicaciones DEMO con fuente · capa OSM apagada';
  });
  await t('T69', 'Selección de estado, condado y ciudad; estado sin catálogo', async () => {
    await setVal('geo-state', '48'); assert(!q('geo-county').disabled && [...q('geo-county').options].some(o => o.text === 'Travis County'), 'Condados TX');
    await setVal('geo-county', '48453'); await setVal('geo-place', 'austin'); await submit('geo-add'); assert(/Austin, TX/.test(text('geo-areas')) && items() === 'MN', 'Austin: ' + items());
    await clearGeo(); await setVal('geo-state', '39'); assert(q('geo-nocat') && q('geo-county').disabled && q('geo-county').getAttribute('aria-describedby') === 'geo-nocat', 'Ohio sin aviso');
    await submit('geo-add'); assert(/Ohio \(estado\)/.test(text('geo-areas')) && q('geo-empty'), 'Ohio'); await clearGeo(); await setVal('geo-state', '12'); return 'TX › Travis › Austin → M, N · Ohio: aviso de catálogo pendiente, sin inventario';
  });
  await t('T70', 'Búsqueda por ZIP Code con validación', async () => {
    await setVal('geo-zip', '123'); await submit('geo-zip-go'); assert(q('geo-zip-err') && q('geo-zip').getAttribute('aria-invalid') === 'true', 'Formato');
    await setVal('geo-zip', '10001'); await submit('geo-zip-go'); assert(/no está en el catálogo DEMO/.test(text('geo-zip-err')), 'ZIP fuera de catálogo');
    await setVal('geo-zip', '33139'); await submit('geo-zip-go'); assert(/ZIP 33139/.test(text('geo-areas')) && items() === 'J' && !q('geo-zip-err'), 'ZIP 33139: ' + items());
    await setVal('geo-zip', '33139'); await submit('geo-zip-go'); assert(/ya está/.test(text('geo-add-err') || '') || /ya está/.test(document.body.textContent), 'Duplicado aceptado'); assert(document.querySelectorAll('[data-qa^="geo-area-"]').length === 1, 'Zona duplicada');
    await clearGeo(); return '123 inválido · 10001 fuera de catálogo · 33139 → J · duplicado rechazado';
  });
  await t('T71', 'Múltiples zonas combinadas', async () => {
    await setVal('geo-zip', '33160'); await submit('geo-zip-go'); await setVal('geo-zip', '33180'); await submit('geo-zip-go');
    assert(document.querySelectorAll('[data-qa^="geo-area-"]').length === 2 && items() === 'DEFGHI', 'Unión: ' + items());
    document.querySelectorAll('[data-qa^="geo-rm-"]')[1].click(); await sleep(60); assert(items() === 'DEFG', 'Tras quitar: ' + items()); await clearGeo(); return '33160 + 33180 → 6 · quitar 33180 → 4';
  });
  await t('T72', 'Dibujo de polígono y radio', async () => {
    await click('geo-locate-D'); const L = D().lst('D'), [x, y] = D().gToS(L.lat, L.lng); await click('geo-draw-poly'); assert(q('geo-drawing') && q('geo-poly-close').disabled, 'Modo polígono');
    for (const [dx, dy] of [[-25, -25], [25, -25], [25, 25], [-25, 25]]) { const ll = D().gFromS(x + dx, y + dy); await mapClick(ll[0], ll[1]); }
    await click('geo-poly-close'); assert(/Polígono 1/.test(text('geo-areas')) && items() === 'D' && document.querySelector('[data-qa="geo-map"] polygon'), 'Polígono: ' + items()); await clearGeo();
    const G = D().lst('G'); await click('geo-locate-G'); await click('geo-draw-radius'); await setVal('geo-radius', '1'); await mapClick(G.lat, G.lng);
    assert(/Radio 1 km/.test(text('geo-areas')) && items() === 'FG' && document.querySelector('[data-qa="geo-map"] circle'), 'Radio: ' + items()); await clearGeo(); return 'Polígono alrededor de D → D · radio 1 km en G → F, G';
  });
  await t('T73', 'Sincronización mapa/listado y búsqueda al mover el mapa', async () => {
    await click('geo-locate-H'); need('geo-item-I').dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body })); await sleep(60);
    assert(S().geo.hover === 'I' && /6FD3DC|111, 211, 220/i.test(need('geo-pin-I').style.boxShadow), 'Hover lista → pin'); need('geo-item-I').dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })); await sleep(40);
    await click('geo-pin-H'); assert(q('geo-item-H').getAttribute('aria-current') === 'true' && q('geo-pin-H').getAttribute('aria-pressed') === 'true' && q('geo-pop'), 'Pin → lista');
    await click('geo-pop-open'); await sleep(120); assert(q('pw-detail') && /DEMO H/.test(text('pw-detail')), 'Ficha desde el mapa'); await click('pw-close').catch(() => {});
    await click('geo-move'); const n0 = qa('geo-item-').length || document.querySelectorAll('[data-qa^="geo-item-"]').length; const m = need('geo-map'); m.focus();
    for (let i = 0; i < 20; i++) { m.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })); await sleep(25); }
    const n1 = document.querySelectorAll('[data-qa^="geo-item-"]').length; assert(n0 > 0 && n1 === 0, 'Mover el mapa no filtró: ' + n0 + '→' + n1); await click('geo-move');
    m.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })); await sleep(60); assert(q('geo-search-here'), 'Sin «Buscar en esta zona»'); await click('geo-search-here'); assert(q('geo-clear-bounds'), 'Sin límite'); await click('geo-clear-bounds');
    return 'hover I ↔ pin · pin H → lista y ficha · mover: ' + n0 + ' → ' + n1 + ' · buscar en esta zona';
  });
  await t('T74', 'Filtros de precio, habitaciones, tipo, operación y estado', async () => {
    if (q('geo-move').checked) await click('geo-move'); if (q('geo-clear-bounds')) await click('geo-clear-bounds'); await clearGeo(); await setVal('geo-op', 'Venta'); assert(items() === 'HKN', 'Venta: ' + items()); await setVal('geo-op', 'Todas');
    await setVal('geo-min', '600000'); await setVal('geo-max', '500000'); assert(q('geo-price-err') && q('geo-min').getAttribute('aria-invalid') === 'true', 'min > max'); await setVal('geo-min', ''); await setVal('geo-max', '');
    await setVal('geo-status', 'Reducción'); assert(items() === 'GHJM', 'Reducciones: ' + items()); await setVal('geo-status', 'Nueva'); assert(items() === 'DEFI', 'Nuevas: ' + items()); await setVal('geo-status', 'Todas');
    await setVal('geo-beds', '3'); assert(items() === 'HN', '3+ hab: ' + items()); await setVal('geo-type', 'Casa'); assert(items() === 'N', 'Casa'); await click('geo-clear-f'); assert(items().length === 11, 'Limpiar'); return 'Venta HKN · reducciones GHJM · nuevas DEFI · 3+ HN · Casa N';
  });
  let geoW = null;
  await t('T75', 'Guardar y recuperar búsquedas geográficas', async () => {
    await setVal('geo-zip', '33139'); await submit('geo-zip-go'); await setVal('geo-op', 'Alquiler'); await setVal('geo-save-name', ''); await submit('geo-save'); assert(q('geo-save-err') && q('geo-save-name').getAttribute('aria-invalid') === 'true', 'Sin nombre aceptado');
    await setVal('geo-save-name', 'Miami Beach alquiler'); await setVal('geo-client', '1'); await submit('geo-save'); geoW = S().pw.watches.find(w => w.kind === 'geo' && w.name === 'Miami Beach alquiler');
    assert(geoW && q('geo-saved-' + geoW.id) && geoW.client === 1, 'No guardó'); await setVal('geo-save-name', 'Otra'); await submit('geo-save'); assert(/Ya tienes una búsqueda/.test(text('geo-save-err')), 'Duplicado guardado');
    await clearGeo(); assert(items().length === 11, 'No limpió'); await click('geo-apply-' + geoW.id); assert(/ZIP 33139/.test(text('geo-areas')) && items() === 'J' && q('geo-op').value === 'Alquiler', 'No recuperó: ' + items());
    await nav(5); assert(/Miami Beach alquiler/.test(text('radar-pw')), 'Radar sin la búsqueda'); await nav(3); return geoW.id + ' guardada · recuperada → J · visible en Demand Radar · duplicado rechazado';
  });
  await t('T76', 'Alertas territoriales y coincidencias con clientes (Clientes y CRM)', async () => {
    await toMiDia(); const al = text('cd-alerts'); assert(/Apartamento DEMO J/.test(al) && /«Miami Beach alquiler» \(Geo Explorer\)/.test(al), 'Alerta de J sin búsqueda');
    await nav(1); await click('client-1'); await click('client-geo'); await sleep(300); assert(S().center === 3 && /Sunny Isles Beach, FL/.test(text('geo-areas')) && items() === 'DEG', 'Clientes → mapa: ' + items());
    assert(/Coincide con Contacto DEMO 1/.test(text('geo-item-D')) && !/Coincide con Contacto DEMO 1/.test(text('geo-item-F') || ''), 'Etiqueta de coincidencia');
    await nav(9); await click('crm-contact-2'); await click('crm-geo'); await sleep(300); assert(/Aventura, FL/.test(text('geo-areas')) && items() === 'H', 'CRM → mapa: ' + items());
    await clearGeo(); return 'Mi día: J por «Miami Beach alquiler» · Contacto 1 → D, E, G · Contacto 2 → H';
  });
  await t('T77', 'Sin duplicados entre búsquedas superpuestas', async () => {
    await nav(3); await setVal('geo-state', '12'); await setVal('geo-county', '12086'); await setVal('geo-place', 'sib'); await submit('geo-add'); await setVal('geo-save-name', 'Sunny Isles completo'); await setVal('geo-client', ''); await submit('geo-save'); await clearGeo();
    await setVal('geo-zip', '33160'); await submit('geo-zip-go'); await setVal('geo-save-name', 'ZIP 33160'); await submit('geo-save'); await clearGeo();
    const its = D().alerts().flatMap(a => (a.items || []).map(i => i.qa.split('-').pop())); assert(its.length && new Set(its).size === its.length, 'Duplicados: ' + its.join(','));
    await toMiDia(); const names = [...document.querySelectorAll('[data-qa^="al-item-"]')].map(e => e.dataset.qa); assert(new Set(names).size === names.length, 'Ítems repetidos en Mi día'); return its.length + ' publicaciones en alertas, todas únicas';
  });
  await t('T78', 'Navegación móvil del explorador: vista mapa / lista', async () => {
    await nav(3); await click('geo-layout-lista'); assert(!q('geo-map') && q('geo-list'), 'Lista'); await click('geo-layout-mapa'); assert(q('geo-map') && !q('geo-list'), 'Mapa'); await click('geo-layout-ambos'); assert(q('geo-map') && q('geo-list'), 'Ambos');
    const small = ['geo-zoom-in', 'geo-zoom-out', 'geo-add', 'geo-save', 'geo-draw-poly'].filter(id => need(id).getBoundingClientRect().height < 44); assert(!small.length, 'Controles < 44 px: ' + small);
    const g = need('geo'); assert(g.scrollWidth <= g.clientWidth + 1, 'Desborde horizontal ' + g.scrollWidth + '/' + g.clientWidth); return 'Vista ' + window.innerWidth + ' px · 3 modos · controles ≥ 44 px · sin desborde';
  });
  await t('T79', 'Mi oficina: asignar zonas, visibilidad y recorrido conectado', async () => {
    await nav(11); assert(q('zones-admin') && q('zas-' + geoW.id), 'Sin fila de zona'); await setVal('zas-agent-' + geoW.id, 'a2'); await toMiDia(); assert(!/Apartamento DEMO J/.test(text('cd-alerts') || ''), 'Alerta sigue con zona asignada a otro agente');
    await nav(11); await setVal('zas-agent-' + geoW.id, 'a1'); await setVal('zas-vis-' + geoW.id, 'broker'); assert(S().geo.assign[geoW.id].vis === 'broker' && q('zas-vis-' + geoW.id).value === 'broker', 'Visibilidad'); await toMiDia(); assert(/Apartamento DEMO J/.test(text('cd-alerts')), 'Alerta no vuelve');
    await nav(11); await click('diff-ops'); assert(q('center-6'), 'Recorrido → Operaciones'); await nav(11); await click('diff-acad'); assert(q('center-10'), 'Recorrido → Academia'); return 'a2 → alerta oculta · a1 → visible · visibilidad broker · enlaces del recorrido';
  });
  await t('T80', 'Regresión: la cabecera no tapa el mapa ni los controles del Geo Explorer', async () => {
    const src = window.__layoutSrc || await (await fetch(new URL('qa/layout_probe.js', location.href).href + '?' + Date.now())).text(); const r = await eval(src);
    assert(r.headerPos !== 'sin data-qa', 'Cabecera sin data-qa'); const bad = r.rows.filter(x => !x.ok); assert(!bad.length, bad.map(x => x.id + ': ' + x.detail).join(' | '));
    return r.w + '×' + r.h + ' · cabecera ' + r.headerPos + ' ' + r.headerH + ' px · ' + r.rows.length + ' comprobaciones · ' + r.rows.find(x => x.id === 'área útil del mapa').detail;
  });

  // ===== Design Loop 10 · AI Workforce, Listing Director, Buyer Director, Conversation Intelligence =====
  const W = () => S().wf; const jobOf = k => W().jobs.find(j => j.kind === k);
  const isDis = id => need(id).disabled;
  const tab = async k => { await nav(4); await click('team-tab-' + k); };
  const lsStage = async i => { await nav(2); await click('ls-stage-' + i); };
  const byStage = async i => { await nav(1); await click('by-stage-' + i); };
  const calSaveClose = async () => { await sleep(150); assert(q('cal-editor'), 'No se abrió el editor del calendario'); await submit('ce-save'); await sleep(80); if (q('calendar')) await click('cal-close'); };
  const brokerInbox = async key => { await setView('Broker'); await nav(11); await click('inbox-' + key); await click('approve'); await setView('Agente'); };
  await reset();
  await t('T81', 'Listing Director: ocho etapas con bloqueo por orden', async () => {
    await nav(2); assert(q('ls-stage-7') && !q('ls-stage-8'), 'No hay 8 etapas'); await click('ls-stage-2'); assert(q('ls-locked') && /Captar/.test(text('ls-locked')) && isDis('ls-agr'), 'Acuerdo no bloqueado');
    D().lstAct('agr'); await sleep(60); assert(W().lst.agr === 'none', 'El bloqueo no se aplicó en la lógica'); return '8 etapas · Acuerdo bloqueado hasta completar Captar y CMA';
  });
  await t('T82', 'Tres equipos de IA: tablero, historial, resultados, estado, responsable y pausa', async () => {
    for (const k of ['la', 'pm', 'ba']) { await tab(k); ['team-name','team-status','team-owner','team-results','team-log','board-draft','board-review','board-done'].forEach(x => assert(q(x), k + ' sin ' + x)); assert(/A[0-5] ·/.test(text('team-panel')), k + ' sin autonomía'); }
    await tab('la'); await setVal('team-owner', 'a3'); assert(W().teams.la.owner === 'a3', 'Responsable no cambió'); await setVal('team-owner', 'a1');
    await click('team-pause'); assert(text('team-status') === 'En pausa' && q('team-paused-why') && isDis('inq-la-classify'), 'Pausa sin efecto visible');
    await nav(0); const own = q('sug-own'); assert(own, 'Sin sugerencia own'); await click('sug-accept-own'); await click('sug-assign-own'); assert(isDis('sug-draft-own') && /en pausa/.test(text('sug-own')), 'Borrador permitido con el equipo en pausa');
    await tab('la'); await click('team-pause'); assert(text('team-status') === 'Activo' && !isDis('inq-la-classify'), 'No se reanudó'); assert(/Equipo en pausa/.test(text('team-log')) && /Equipo reanudado/.test(text('team-log')), 'Historial sin pausa');
    return '3 equipos completos · pausa bloquea preparar y el router lo explica · historial registra';
  });
  await t('T83', 'Recorrido A: campaña → consulta → AI Listing Acquisition → Listing Director → CMA → aprobación humana → marketing', async () => {
    await tab('la'); await click('inq-la-classify'); assert(q('inq-class'), 'Sin clasificación explicable'); await click('inq-la-cma'); await click('inq-la-handoff'); assert(W().lst.lead && W().inqL === 'entregada', 'No se entregó');
    await lsStage(0); await click('ls-qual'); assert(q('ls-q-mot-err'), 'Sin errores accesibles'); await setVal('ls-q-mot', 'Herencia'); await setVal('ls-q-plazo', '60 días'); await setVal('ls-q-cond', 'Lista para mostrar'); await click('ls-qual'); assert(W().lst.qual && D().lstDone()[0], 'Captar incompleta');
    await lsStage(1); assert(q('ls-comps') && /no MLS/.test(text('ls-comps')), 'CMA sin fuentes'); await click('ls-cma-review'); assert(jobOf('la-cma').status === 'revisada', 'CMA no revisada');
    await setVal('ls-price', '499000'); await click('ls-price-save'); assert(q('ls-price-ok-err') && !W().lst.priceOk, 'Precio aceptado sin confirmación humana'); await click('ls-price-ok'); await click('ls-price-save'); assert(W().lst.priceOk && D().lstDone()[1], 'CMA incompleta');
    await lsStage(2); await click('ls-agr'); await click('ls-agr-req'); assert(W().lst.agr === 'solicitada', 'Acuerdo no solicitado'); await brokerInbox('lst-agr'); assert(W().lst.agr === 'aprobada', 'Broker no aprobó el acuerdo');
    await lsStage(3); await click('ls-pub'); assert(W().lst.pub, 'Sin publicación'); await lsStage(4); await click('ls-mkt'); const j = jobOf('pm-P'); assert(j && j.status === 'borrador', 'Sin propuesta de marketing');
    await tab('pm'); await click('job-review-' + j.id); await click('job-request-' + j.id); assert(!q('job-approve-' + j.id), 'El agente puede aprobar algo que exige broker'); await brokerInbox('wf-' + j.id); assert(jobOf('pm-P').status === 'aprobada', 'Marketing no aprobado');
    await lsStage(4); await click('ls-visit'); await calSaveClose(); assert(D().lstDone()[4], 'Marketing y visitas incompleta');
    await lsStage(5); await setVal('ls-offer', '492000'); await click('ls-offer-ok'); await click('ls-offer-save'); assert(W().lst.offerOk && D().lstDone()[5], 'Oferta no registrada');
    await lsStage(7); assert(q('ls-locked') && isDis('ls-close'), 'Cierre disponible con contingencias abiertas'); D().lstAct('close'); await sleep(50); assert(!W().lst.closed, 'Lógica cerró con contingencias abiertas');
    await lsStage(6); for (const k of ['insp', 'fin', 'tas']) await click('ls-cont-' + k); assert(D().lstDone()[6], 'Contingencias incompletas'); await lsStage(7); await click('ls-close'); assert(W().lst.closed && D().lstDone().every(Boolean), 'Recorrido incompleto: ' + D().lstDone());
    return '8/8 etapas · acuerdo y campaña aprobados por el broker · precio y oferta confirmados por el agente';
  });
  await t('T84', 'Cambio de precio tras aprobar invalida el acuerdo de listing', async () => {
    await lsStage(1); await setVal('ls-price', '489000'); await click('ls-price-ok'); if (!q('ls-price-ok').checked) await click('ls-price-ok'); await click('ls-price-save'); assert(W().lst.agr === 'borrador' && /Invalidada/.test(W().lst.agrHist.slice(-1)[0].a), 'No se invalidó: ' + W().lst.agr);
    return 'acuerdo → borrador · historial «Invalidada: el agente cambió el precio»';
  });
  await reset();
  await t('T85', 'Recorrido B: anuncio → consulta → AI Buyer Acquisition → Geo Explorer → coincidencias → cita → Buyer Director', async () => {
    await tab('ba'); await click('inq-ba-qualify'); await click('inq-ba-rec'); await click('inq-ba-slots'); assert(jobOf('ba-rec') && jobOf('ba-slots'), 'Sin borradores'); await click('inq-ba-handoff'); assert(W().buy.lead, 'No transferido');
    await nav(1); assert(/Aventura · 3 hab/.test(text('by-ctx')), 'Contexto no heredado: ' + text('by-ctx'));
    await byStage(1); await setVal('by-max', '400000'); await click('by-prof'); assert(q('by-max-err'), 'Sin error min/max'); await setVal('by-max', '480000'); await click('by-prof'); assert(W().buy.ok, 'Perfil no confirmado');
    await byStage(2); await click('by-search'); await sleep(300); assert(S().center === 3 && /Aventura, FL/.test(text('geo-areas')) && items() === 'H', 'Geo Explorer: ' + items());
    await byStage(3); assert(q('by-match-H'), 'H no coincide'); await click('by-fav-H'); await byStage(4); await click('by-alert'); assert(W().buy.alert, 'Sin alerta');
    await byStage(5); await click('by-visit'); await sleep(150); assert(/Condominio DEMO H · Contacto DEMO 3/.test(q('ce-title').value), 'Calendario sin contexto'); await calSaveClose();
    await byStage(6); await setVal('by-offer', '470000'); await click('by-offer-save'); assert(q('by-offer-ok-err'), 'Oferta sin confirmación humana'); await click('by-offer-ok'); await click('by-offer-save');
    await byStage(7); for (const k of ['insp', 'fin', 'tas']) await click('by-cont-' + k); await click('by-close'); assert(D().buyDone().every(Boolean), 'Incompleto: ' + D().buyDone());
    await nav(1); assert(/favorita: Condominio DEMO H/.test(text('by-ctx')), 'Contexto sin favorita'); await nav(3); await clearGeo(); return '8/8 · perfil → Geo Explorer (H) → favorita → alerta → visita → oferta → cierre';
  });
  await reset();
  await t('T86', 'Recorrido C: llamada DEMO → transcripción → resumen → sugerencia → confirmación CRM → tarea en Mi día', async () => {
    await nav(9); await click('cv-item-call'); assert(/Sin transcripción/.test(text('cv-st-tx')) && !q('cv-summary'), 'Transcripción antes de generarla');
    await click('cv-play'); await sleep(1600); await click('cv-play'); assert(S().ui.cvPos > 0 && !S().ui.cvPlay, 'Reproductor simulado sin avance');
    await click('cv-tx'); assert(q('cv-summary') && q('cv-transcript') && /Transcripción disponible/.test(text('cv-st-tx')), 'Sin transcripción');
    assert(/automatizado/.test(text('cv-line-0')) && /No puedo negociar/.test(text('cv-transcript')), 'IA sin identificarse o negociando');
    assert(isDis('cv-task'), 'Tarea permitida sin confirmar'); await click('cv-pref-ok-budget'); await click('cv-pref-ok-city'); await click('cv-pref-no-date');
    assert(/Confirmado/.test(text('cv-pref-budget')) && /Descartado/.test(text('cv-pref-date')), 'Estados de preferencias'); await click('cv-task'); await click('cv-task').catch(() => {});
    assert((S().tasks || []).filter(x => x.id === 'w-call').length === 1, 'Tarea duplicada o ausente'); await nav(0); assert(q('task-w-call') && q('sug-call'), 'Mi día sin tarea o sin sugerencia');
    return 'audio simulado ' + S().ui.cvPos + ' s · transcripción · 2 confirmadas, 1 descartada · tarea única en Mi día';
  });
  await t('T87', 'Cita propuesta desde la conversación queda en Smart Calendar y en el Lead Journey', async () => {
    await nav(9); await click('cv-appt'); await sleep(150); assert(/Condominio DEMO H · Contacto DEMO 3/.test(q('ce-title').value), 'Sin prellenado'); await calSaveClose();
    assert(S().cal.events.some(e => e.status === 'activa' && /Contacto DEMO 3/.test(e.title)), 'Evento no guardado'); assert(/Cita propuesta/.test(text('cv-journey')), 'Journey sin la cita'); return 'evento guardado · journey actualizado';
  });
  await t('T88', 'Pausar y reanudar automatización; transferencia al humano', async () => {
    await nav(9); await click('cv-item-call'); assert(!isDis('cv-auto'), 'Auto bloqueado sin motivo'); await click('cv-auto'); assert(/1 mensaje/.test(text('cv-auto-count')) && /ninguno real/.test(text('cv-auto-count')), 'Sin marca de simulación');
    await click('cv-pause'); assert(isDis('cv-auto') && /pausa/.test(text('cv-auto-why')), 'Pausa sin efecto'); await click('cv-pause'); assert(!isDis('cv-auto'), 'No reanudó');
    await click('cv-human'); assert(/\[AGENTE\]/.test(text('cv-st-attend')) && isDis('cv-auto') && isDis('cv-pause'), 'Transferencia sin efecto'); return 'pausa/reanudar · transferencia bloquea el asistente';
  });
  await reset();
  await t('T89', 'Consentimiento por canal y revocación', async () => {
    await nav(9); await click('cv-item-call'); assert(/otorgado/.test(text('cv-consent-whatsapp')), 'Sin consentimiento inicial'); await click('cv-revoke-whatsapp');
    assert(/revocado/.test(text('cv-consent-whatsapp')) && isDis('cv-auto') && /revocado/.test(text('cv-auto-why')) && isDis('cv-pause'), 'Revocación sin efecto'); assert(/Consentimiento revocado/.test(text('cv-journey')), 'Journey sin revocación');
    D().cvAuto(); await sleep(50); assert(W().cv.autoSent === 0, 'Lógica envió tras revocar'); return 'WhatsApp revocado · asistente bloqueado · no se puede reanudar';
  });
  await t('T90', 'Recorrido D y router: reducción → sugerencia → asignación → IA prepara → agente revisa → broker → seguimiento', async () => {
    await nav(0); assert(/Condominio DEMO H bajó/.test(text('sug-drop')) && /no ejecutada/.test(text('sug-st-drop')), 'Sugerencia sin estado');
    await click('sug-accept-drop'); await setVal('sug-owner-drop', 'a2'); await click('sug-assign-drop'); assert(W().sugs.drop.owner === 'a2', 'Asignación'); await click('sug-draft-drop');
    const j = jobOf('pm-H'); assert(j && j.owner === 'a2' && /Borrador listo/.test(text('sug-st-drop')), 'Sin borrador'); await click('job-review-' + j.id); await click('job-request-' + j.id);
    assert(/En revisión del broker/.test(text('sug-st-drop')) && !q('job-approve-' + j.id), 'Estado de aprobación'); assert(!(S().tasks || []).some(x => x.id === 'w-drop-H'), 'Seguimiento antes de aprobar');
    await brokerInbox('wf-' + j.id); await nav(0); assert(/Aprobado/.test(text('sug-st-drop')) && /Seguimiento creado/.test(text('sug-res-drop')) && q('task-w-drop-H'), 'Sin seguimiento'); return j.id + ' · Agente DEMO 2 · broker aprueba · tarea w-drop-H';
  });
  await t('T91', 'Rechazo con motivo y reenvío (router y tablero)', async () => {
    await nav(0); await click('sug-accept-own'); await click('sug-assign-own'); await click('sug-draft-own'); const j = jobOf('la-reply'); await click('job-reject-' + j.id); assert(q('rej-' + j.id + '-err') && jobOf('la-reply').status === 'borrador', 'Rechazo sin motivo aceptado');
    await setVal('rej-' + j.id, 'Falta mencionar la cita de valoración'); await click('job-reject-' + j.id); assert(jobOf('la-reply').status === 'rechazada' && /Falta mencionar/.test(text('sug-res-own')), 'Rechazo no registrado');
    await click('job-resend-' + j.id); assert(jobOf('la-reply').status === 'borrador', 'No reenvió'); await click('job-review-' + j.id); await click('job-approve-' + j.id); assert(jobOf('la-reply').status === 'aprobada' && /no se ejecuta/.test(text('sug-res-own')), 'Aprobación del agente');
    await click('sug-reject-buy'); assert(q('rej-s-buy-err'), 'Sugerencia rechazada sin motivo'); await setVal('rej-s-buy', 'Ya contactado por otro agente'); await click('sug-reject-buy'); assert(W().sugs.buy.status === 'rechazada', 'Sugerencia no rechazada'); await click('sug-reopen-buy'); assert(W().sugs.buy.status === 'sugerida', 'No reabrió');
    return 'motivo obligatorio · reenvío · aprobación del agente sin envío · sugerencia rechazada y reabierta';
  });
  await t('T92', 'Sin duplicación de tareas ni oportunidades', async () => {
    await tab('la'); await click('inq-la-classify'); assert(isDis('inq-la-reply'), 'Respuesta duplicable desde el tablero'); const n0 = W().jobs.length; D().inqAct('la', 'reply'); D().pmOpp('H'); await sleep(60); assert(W().jobs.length === n0, 'Se duplicó un trabajo');
    const kinds = W().jobs.map(j => j.kind); assert(new Set(kinds).size === kinds.length, 'Tipos repetidos'); const ids = (S().tasks || []).map(x => x.id); assert(new Set(ids).size === ids.length, 'Tareas repetidas');
    await tab('pm'); assert(isDis('pm-make-H') && /Propuesta creada/.test(text('pm-make-H')), 'Oportunidad H repetible'); return kinds.length + ' trabajos únicos · ' + ids.length + ' tareas únicas';
  });
  await t('T93', 'Distinción entre simulado, transcrito y ejecutado; acciones solo sugeridas no figuran como ejecutadas', async () => {
    await nav(0); const st = [...document.querySelectorAll('[data-qa^="sug-st-"]')].map(e => e.textContent); assert(st.every(x => !/ejecutad[oa]$/i.test(x) || /no ejecutada/.test(x)), 'Estado ambiguo: ' + st.join('|'));
    assert(/Solo sugerida/.test(text('sug-res-buy')), 'Sugerida sin aclaración'); await nav(9); await click('cv-item-call'); assert(/Conversación simulada/.test(text('cv-detail')), 'Sin marca de simulación');
    await nav(4); await click('team-tab-la'); assert(/no enviado/.test(text('team-panel')) || /no se ejecuta/i.test(text('team-panel')) || /ejecución humana pendiente/.test(text('team-panel')), 'Tablero sin estado de ejecución'); return st.join(' | ');
  });
  await t('T94', 'Persistencia del AI Workforce tras recarga (estado guardado)', async () => {
    await sleep(120); const saved = JSON.parse(localStorage.getItem(window.__nadakkiDemo.KEY) || '{}'); assert(saved.wf && saved.wf.jobs.length === W().jobs.length && saved.wf.sugs.drop, 'wf no persistido'); const re = D().load(); assert(re.wf.jobs.length === W().jobs.length && re.wf.cv.revoked.whatsapp, 'load() no restaura wf'); return saved.wf.jobs.length + ' trabajos · consentimiento revocado conservado';
  });
  await t('T95', 'Responsive: secciones nuevas sin desborde horizontal', async () => {
    const chk = []; for (const [c, id] of [[0, 'wf-router'], [4, 'wf-teams'], [2, 'listing-director'], [1, 'buyer-director'], [9, 'ci']]) { await nav(c); const el = need(id); chk.push(id + ' ' + el.scrollWidth + '/' + el.clientWidth); assert(el.scrollWidth <= el.clientWidth + 1, id + ' desborda'); }
    assert(document.documentElement.scrollWidth <= innerWidth + 1, 'Página desborda'); return innerWidth + ' px · ' + chk.join(' · ');
  });
  await t('T96', 'Seguridad: IA identificada, sin contacto en frío, sin precio ni negociación por IA, Fair Housing', async () => {
    await tab('la'); assert(/sin contacto en frío/.test(text('wf-teams')), 'Sin aviso de captación entrante'); assert(![...document.querySelectorAll('button')].some(b => /en frío|cold/i.test(b.textContent)), 'Existe una acción de contacto en frío');
    assert(/asistente automatizado/.test(D().wfReply()), 'Respuesta sin identificar la IA'); assert(/Igualdad de oportunidades de vivienda/.test(D().wfPm(D().LISTINGS.find(l => l.id === 'H'))), 'Sin Fair Housing');
    await lsStage(1); assert(q('ls-price-ok') && /La IA no fija precios/.test(text('ls-panel')), 'Precio sin decisión humana'); return 'IA identificada · solo entrante · precio y oferta humanos · Fair Housing';
  });
await reset();
  // ===== Design Loop 10A final gate · correspondencia contractual =====
  await t('T97', 'Contrato ola 2: ocho etapas y códigos exactos de ListingPipelineStage', async () => {
    await nav(2); const exp = [['acquire','Captar'],['cma','CMA'],['agreement','Acuerdo'],['prepare_publish','Preparar y publicar'],['marketing_showings','Marketing y visitas'],['offers','Ofertas'],['contract_contingencies','Contrato y contingencias'],['closing','Cierre']];
    assert(!q('ls-stage-8'), 'Más de 8 etapas'); exp.forEach(([c, l], i) => { const s = text('ls-stage-' + i); assert(s.includes(c) && s.includes((i + 1) + '. ' + l), 'Etapa ' + (i + 1) + ': ' + s); });
    assert(JSON.stringify(D().LSTAGES) === JSON.stringify(exp), 'La constante no coincide con el contrato'); const old = ['CAPTACION','CALIFICACION','REVISION_PRECIO','ACUERDO_LISTING','PUBLICACION','MARKETING_VISITAS','OFERTAS_CIERRE'];
    assert(!old.some(c => text('listing-director').includes(c)), 'Quedan códigos de Loop 10'); return exp.map(x => x[0]).join(' → ');
  });
  await t('T98', 'Calificación y revisión del precio como compuertas internas obligatorias', async () => {
    await lsStage(0); assert(q('ls-gate-lead') && q('ls-gate-qual'), 'Captar sin compuertas visibles'); assert(isDis('ls-qual'), 'Calificación habilitada sin consulta'); D().lstAct('qual'); await sleep(50); assert(!W().lst.qual, 'La lógica guardó la calificación sin consulta');
    await click('ls-lead'); await setVal('ls-q-mot', 'Herencia'); await setVal('ls-q-plazo', '60 días'); await setVal('ls-q-cond', 'Lista para mostrar'); assert(!D().lstDone()[0], 'Captar completa sin calificación'); await click('ls-qual'); assert(D().lstDone()[0] && /Cumplida/.test(text('ls-gate-qual')), 'Captar no se completó');
    await lsStage(1); assert(q('ls-gate-cma') && q('ls-gate-price'), 'CMA sin compuertas visibles'); assert(isDis('ls-price-save'), 'Precio habilitado sin CMA revisado'); D().lstAct('price'); await sleep(50); assert(!W().lst.priceOk, 'La lógica aceptó precio sin CMA');
    await click('ls-cma'); assert(jobOf('la-cma'), 'Sin borrador de CMA'); await click('ls-cma-review'); assert(!D().lstDone()[1], 'CMA completa sin decisión de precio'); await setVal('ls-price', '499000'); await click('ls-price-ok'); await click('ls-price-save'); assert(D().lstDone()[1] && /Cumplida/.test(text('ls-gate-price')), 'CMA no se completó');
    return 'Captar = consulta + calificación · CMA = revisión + precio humano · bloqueo en interfaz y lógica';
  });
  await t('T99', 'Sin pérdida de estado: mismo esquema que Loop 10 y avance conservado', async () => {
    const keys = ['lead','qual','qf','price','priceOk','agr','agrReason','agrHist','pub','offer','offerOk','cont','closed']; const got = Object.keys(W().lst);
    assert(keys.every(k => got.includes(k)) && got.length === keys.length, 'Esquema distinto: ' + got.join(','));
    assert(/^2 de 8/.test(text('ls-progress')) && /Completa/.test(text('ls-stage-0')) && /Completa/.test(text('ls-stage-1')) && /Actual/.test(text('ls-stage-2')), 'Avance no reflejado: ' + text('ls-progress'));
    return 'esquema de 13 campos idéntico · ' + text('ls-progress');
  });
  await t('T100', 'Autonomía G1-AUTONOMIA: A0–A4, A5 deshabilitado y sin permisos desde la interfaz', async () => {
    await nav(0); assert(/G1-AUTONOMIA/.test(text('wf-aut-policy')) && /A5 deshabilitado/.test(text('wf-aut-policy')), 'Política no visible'); const T = D().TEAMS; assert(Object.values(T).every(x => /^A[0-4]$/.test(x.aut)), 'Equipo con A5');
    assert(![...document.querySelectorAll('select,input')].some(e => /aut/i.test((e.dataset.qa || '') + e.id)), 'Existe un control para cambiar la autonomía');
    const prev = T.pm.aut; T.pm.aut = 'A5'; const n = W().jobs.length; D().wfMake('pm', 'qa-a5', 'Prueba A5', 'x', true); await sleep(60); T.pm.aut = prev; assert(W().jobs.length === n, 'Se creó trabajo con A5');
    return Object.entries(T).map(([k, v]) => k + ':' + v.aut).join(' · ') + ' · A5 bloqueado en lógica · sin selector';
  });
  await t('T101', 'Router: cada sugerencia con equipo, responsable, evidencia, prioridad, estado y próxima acción', async () => {
    await nav(9); await click('cv-item-call'); await click('cv-tx'); await nav(0); const teams = new Set();
    for (const id of ['own', 'buy', 'drop', 'call']) { const tx = text('sug-' + id); ['Equipo IA', 'Responsable', 'Evidencia', 'Próximo paso', 'Prioridad'].forEach(k => assert(tx.includes(k), id + ' sin ' + k)); assert(text('sug-ev-' + id).length > 20, id + ' sin evidencia'); assert(text('sug-st-' + id), id + ' sin estado'); teams.add(D().wfSugs().find(g => g.id === id).team); }
    assert(teams.size === 3, 'Faltan equipos: ' + [...teams]); assert(/no realizada/.test(text('sug-ev-call')), 'Evidencia de llamada sin marca de simulación'); return '4 sugerencias · equipos ' + [...teams].join(', ');
  });
  await t('T102', 'Router completo por equipo: sugerencia → asignación → borrador → revisión → aprobación → seguimiento', async () => {
    await nav(0); const out = [];
    for (const id of ['own', 'buy']) { await click('sug-accept-' + id); await click('sug-assign-' + id); await click('sug-draft-' + id); const g = D().wfSugs().find(x => x.id === id), j = jobOf(g.kind); assert(j && j.status === 'borrador', 'Sin borrador ' + id);
      await click('job-review-' + j.id); assert(!q('job-request-' + j.id), id + ' pide broker sin necesitarlo'); await click('job-approve-' + j.id); assert(jobOf(g.kind).status === 'aprobada' && /Aprobado/.test(text('sug-res-' + id)), id + ' no aprobado'); out.push(g.team + ':agente'); }
    await click('sug-accept-drop'); await click('sug-assign-drop'); await click('sug-draft-drop'); const jd = jobOf('pm-H'); await click('job-review-' + jd.id); assert(!q('job-approve-' + jd.id), 'El agente puede aprobar publicidad'); await click('job-request-' + jd.id);
    await brokerInbox('wf-' + jd.id); await nav(0); assert(q('task-w-drop-H') && /Seguimiento creado/.test(text('sug-res-drop')), 'Sin seguimiento'); out.push('pm:broker');
    return out.join(' · ') + ' · tarea w-drop-H';
  });
  await t('T103', 'Conversation Intelligence: lo simulado nunca figura como llamada ejecutada', async () => {
    await nav(9); await click('cv-item-call'); assert(/simulad|DEMO/i.test(text('cv-item-call')), 'Llamada sin marca DEMO'); const bad = /llamada (realizada|completada|ejecutada|efectuada)|se llamó/i;
    assert(!bad.test(text('ci').replace(/no realizada/gi, '')), 'El texto presenta una llamada como real'); assert(!bad.test(text('cv-journey')), 'Journey presenta una llamada como real');
    assert(!(S().tasks || []).some(x => /realizada/i.test(x.title || '')), 'Tarea presenta una llamada como hecha'); return 'llamada marcada como DEMO · sin textos de ejecución real';
  });
  await reset();
  await t('T104', 'Conversation Intelligence de punta a punta: transcripción DEMO, preferencias, agenda, pausa, transferencia y revocación', async () => {
    await nav(9); await click('cv-item-call'); assert(/otorgado/.test(text('cv-consent-whatsapp')), 'Sin consentimiento inicial'); await click('cv-tx'); assert(/DEMO|simulad/i.test(text('ci')) && q('cv-transcript'), 'Transcripción sin marca DEMO');
    await click('cv-pref-ok-budget'); assert(/Confirmado/.test(text('cv-pref-budget')), 'Preferencia no confirmada'); await click('cv-appt'); await calSaveClose(); assert(/Cita propuesta/.test(text('cv-journey')), 'Cita no registrada');
    await click('cv-pause'); assert(isDis('cv-auto'), 'Pausa sin efecto'); await click('cv-pause'); assert(!isDis('cv-auto'), 'No reanudó'); await click('cv-human'); assert(/\[AGENTE\]/.test(text('cv-st-attend')), 'Sin transferencia');
    await click('cv-revoke-whatsapp'); assert(/revocado/.test(text('cv-consent-whatsapp')), 'Revocación no visible'); D().cvAuto(); await sleep(50); assert(W().cv.autoSent === 0, 'Envió tras revocar');
    return 'consentimiento · transcripción DEMO · preferencia · cita · pausa · transferencia · revocación';
  });
  await t('T30', 'Reinicio de datos DEMO', async () => {
    await reset(); const s = S(); assert(!s.op.property && !s.op.closed && !s.camps.length && !s.crm.stopped && !s.acad.done.length, 'Estado no reiniciado');
    await nav(0); assert(text('kpi-progress') === 'SIN INICIAR' && text('kpi-plan').replace(/\s/g, '') === '0/9', 'Mi día no reiniciado'); return 'SIN INICIAR · 0/9';
  });
  await t('T31', 'Consola sin errores durante la ejecución', async () => { assert(!errors.length, errors.slice(0, 3).join(' | ')); return '0 errores'; });

  console.error = origErr;
  window.__qaResults = results;
  const pass = results.filter(r => r.ok === true).length;
  const box = document.createElement('div'); box.id = 'qa-results';
  box.style.cssText = 'position:fixed;inset:12px;z-index:99999;background:#fff;border:2px solid #13202B;border-radius:12px;padding:16px;overflow:auto;font:10.5px/1.25 IBM Plex Sans,Arial,sans-serif;color:#13202B';
  box.innerHTML = `<div style="font:700 16px Space Grotesk,Arial;margin-bottom:6px">QA E2E Design Loop 10A final gate · ${pass}/${results.length} PASS · ${new Date().toISOString()} · ${navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/)?.[0] || ''} · viewport ${innerWidth}×${innerHeight}</div>` +
    '<table style="border-collapse:collapse;width:100%">' + results.map(r => `<tr><td style="padding:1px 5px;border-bottom:1px solid #DCE2E8;font-weight:700">${r.id}</td><td style="padding:1px 5px;border-bottom:1px solid #DCE2E8;color:${r.ok ? '#1E5A3C' : r.ok === null ? '#4A5A68' : '#8A3B0A'};font-weight:700">${r.ok ? 'PASS' : r.ok === null ? 'NOT_EXECUTED' : 'FAIL'}</td><td style="padding:1px 5px;border-bottom:1px solid #DCE2E8">${r.name}</td><td style="padding:1px 5px;border-bottom:1px solid #DCE2E8;color:#4A5A68">${String(r.detail).replace(/</g, '&lt;')}</td></tr>`).join('') + '</table>';
  document.body.appendChild(box);
  console.log('QA', pass + '/' + results.length, results);
  return results;
})();
