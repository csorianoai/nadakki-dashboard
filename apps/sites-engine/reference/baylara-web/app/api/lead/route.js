// Receives lead forms and emails them. Credentials live only in environment variables:
//   RESEND_API_KEY   – API key of the email provider (Resend)
//   LEAD_FROM_EMAIL  – verified sender, e.g. "Baylara <leads@baylara.com>"
//   LEAD_TO_EMAIL    – destination (defaults to cesar@nadakki.com)
export const runtime = 'nodejs';

const INTENTS = { buyer: 'Comprador', seller: 'Vendedor / propietario (valoración)', tenant: 'Inquilino', consult: 'Consulta agendada', property: 'Interés en una propiedad',alerts: 'Alertas de edificio', market: 'Suscripción al informe de mercado', saved: 'Búsqueda guardada' };
const FIELDS = [
  ['name', 'Nombre'], ['lastName', 'Apellido'], ['email', 'Email'], ['phone', 'Teléfono'], ['preferred', 'Contacto preferido'], ['channel', 'Recibir por'],
  ['date', 'Día solicitado'], ['time', 'Hora (Miami)'], ['topic', 'Tema'], ['timeline', 'Plazo'], ['payment', 'Forma de pago'], ['country', 'País de residencia'],
  ['building', 'Edificio'], ['listing', 'Propiedad'], ['search', 'Búsqueda'],
  ['area', 'Zona'], ['budget', 'Presupuesto'], ['address', 'Dirección de la propiedad'], ['propertyType', 'Tipo de propiedad'],
  ['goal', 'Objetivo'], ['rentBudget', 'Presupuesto mensual'], ['moveIn', 'Fecha de mudanza'], ['bedrooms', 'Habitaciones'], ['message', 'Mensaje']
];

const clean = (v, max = 2000) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Two callers: the React form (JSON → JSON answer) and the native HTML form when scripts are not running
// (application/x-www-form-urlencoded → 303 redirect to the success or error page in the visitor's language).
const DONE = { es: '/es/mensaje-enviado', en: '/en/message-sent' };
const FAIL = { es: '/es/mensaje-no-enviado', en: '/en/message-not-sent' };

export async function POST(req) {
  const type = req.headers.get('content-type') || '';
  const native = !type.includes('application/json');
  let data;
  try {
    data = native ? Object.fromEntries((await req.formData()).entries()) : await req.json();
  } catch { data = null; }
  const lang = data?.lang === 'en' ? 'en' : 'es';
  if (native && data && !data.page) {
    try { data.page = new URL(req.headers.get('referer') || '').pathname; } catch {}
  }
  const reply = (ok, status, error) => native
    ? new Response(null, { status: 303, headers: { Location: new URL(ok ? DONE[lang] : FAIL[lang], req.url).toString(), ...(ok ? {} : { 'X-Lead-Error': error }) } })
    : Response.json(ok ? { ok: true } : { ok: false, error }, { status });
  if (!data) return reply(false, 400, 'bad_request');

  // Honeypot: bots fill the hidden field. Pretend success.
  if (clean(data.website)) return reply(true, 200);

  const intent = INTENTS[data.intent] ? data.intent : null;
  const name = clean(data.name, 200);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 60);
  if (!intent || (!name && intent !== 'market') || (!email && !phone)) return reply(false, 422, 'missing_fields');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(false, 422, 'invalid_email');

  const consent = data.consent === true || data.consent === 'on';
  const rows = FIELDS.map(([k, label]) => [label, clean(data[k])]).filter(([, v]) => v);
  rows.unshift(['Intención', INTENTS[intent]]);
  rows.push(['Consentimiento llamada/SMS/WhatsApp', consent ? `SÍ — ${new Date().toISOString()}` : 'NO']);
  rows.push(['Idioma', clean(data.lang, 5)], ['Página', clean(data.page, 300)]);
  rows.push(['Envío', native ? 'formulario sin JavaScript (respaldo)' : 'formulario']);
  rows.push(['Entorno', process.env.VERCEL_ENV || 'local']);

  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  const to = process.env.LEAD_TO_EMAIL || 'cesar@nadakki.com';
  if (!key || !from) {
    console.error('[lead] Email not configured (RESEND_API_KEY / LEAD_FROM_EMAIL missing).');
    return reply(false, 503, 'email_not_configured');
  }

  // The property (listing or development) the visitor asked about goes in the subject as well as in the body.
  const listing = clean(data.listing, 160);
  const fullName = [name, clean(data.lastName, 200)].filter(Boolean).join(' ');
  const subject = `[Baylara] ${INTENTS[intent]}: ${fullName || email}${listing ? ` · ${listing}` : ''}`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${rows.map(([k, v]) => `<tr><td style="color:#4b5966;vertical-align:top"><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;

  let res;
  try {
    res = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html, ...(email ? { reply_to: email } : {}) })
    });
  } catch (e) {
    console.error('[lead] Email provider unreachable', e?.message);
    return reply(false, 502, 'send_failed');
  }
  if (!res.ok) {
    console.error('[lead] Email provider error', res.status, await res.text().catch(() => ''));
    return reply(false, 502, 'send_failed');
  }
  return reply(true, 200);
}
