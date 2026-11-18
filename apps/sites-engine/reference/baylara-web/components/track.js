'use client';
// Thin wrapper over gtag. Safe to call when no tag is configured (it simply does nothing).
const GADS = process.env.NEXT_PUBLIC_GADS_ID;
const LABELS = {
  lead: process.env.NEXT_PUBLIC_GADS_LEAD_LABEL,
  whatsapp: process.env.NEXT_PUBLIC_GADS_WHATSAPP_LABEL,
  call: process.env.NEXT_PUBLIC_GADS_CALL_LABEL
};

function gtag() {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag.apply(null, arguments);
}

// Primary conversion: a submitted lead form, with its intent.
export function trackLead(intent, lang) {
  gtag('event', 'generate_lead', { lead_intent: intent, language: lang });
  if (GADS && LABELS.lead) gtag('event', 'conversion', { send_to: `${GADS}/${LABELS.lead}`, lead_intent: intent });
}

// Secondary conversions: WhatsApp and call clicks.
export function trackClick(kind) {
  gtag('event', kind === 'whatsapp' ? 'click_whatsapp' : 'click_call', { link_location: typeof location !== 'undefined' ? location.pathname : '' });
  if (GADS && LABELS[kind]) gtag('event', 'conversion', { send_to: `${GADS}/${LABELS[kind]}` });
}
