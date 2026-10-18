"use client";

import { useEffect, useState } from "react";
import { fetchPanelAccessInfo } from "@/lib/realtor/access";
import { isDemoAllowed, isPanelFlagOn } from "@/lib/realtor/config";
import { DEMO_BANNER } from "@/lib/realtor/copy";
import {
  CLOSED_GATES, CONSENT_LABEL, DEMO_PROFILE, PRIVACY_NOTICE, publishBlockers, validateContact,
  type ContactForm, type FormErrors,
} from "@/lib/realtor/agent-site";
import { FONT_BODY, FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { StatusBadge } from "./StatusBadge";

const CARD = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12 } as const;
const FIELD = { border: `1px solid ${RT.lineStrong}`, borderRadius: 8, color: RT.ink } as const;
const BTN = { background: RT.teal, color: RT.white, borderRadius: 8 } as const;

const EMPTY: ContactForm = { name: "", email: "", message: "", consent: false };

export function AgentSitePanel() {
  const flagOn = isPanelFlagOn();
  const [allowed, setAllowed] = useState(false);
  const [tenantDemo, setTenantDemo] = useState(false);
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const demoAllowed = tenantDemo && isDemoAllowed();

  useEffect(() => {
    if (!flagOn) return;
    let alive = true;
    fetchPanelAccessInfo().then((r) => { if (alive) { setAllowed(r.status === "ok"); setTenantDemo(r.demo); } });
    return () => { alive = false; };
  }, [flagOn]);

  if (!flagOn || !allowed) return null;

  const profile = DEMO_PROFILE;
  const blockers = publishBlockers(profile, CLOSED_GATES);

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validateContact(form);
    setErrors(e);
    setSubmitted(Object.keys(e).length === 0);
  };

  return (
    <section data-testid="agent-site-panel" className="space-y-4 p-6" style={{ background: RT.page, color: RT.ink, fontFamily: FONT_BODY }}>
      <h1 className="text-2xl font-bold" style={{ fontFamily: FONT_DISPLAY, color: RT.ink }}>Web del agente</h1>
      {demoAllowed ? <p role="note" data-testid="demo-banner" className="rounded-lg p-2 text-sm font-semibold" style={{ background: RT.demoBg, color: RT.demoText }}>{DEMO_BANNER}</p> : null}
      {demoAllowed ? (
        <article data-testid="agent-site-preview" className="space-y-3 p-5" style={CARD}>
          <StatusBadge status="DEMO" />
          <h2 className="text-lg font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{profile.agentName}</h2>
          <p className="text-sm" style={{ color: RT.muted }}>Dominio: {profile.domain}</p>
          <address data-testid="contact-data" className="text-sm not-italic">
            <p>{profile.email} · {profile.phone}</p>
            <p data-testid="brokerage-name">Brokerage licenciada: {profile.brokerageLicensedName} (licencia {profile.licenseNumber})</p>
          </address>
          <form onSubmit={onSubmit} noValidate aria-label="Formulario de contacto" className="space-y-2">
            <label className="block text-sm">Nombre
              <input className="mt-1 block w-full p-2" style={FIELD} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            {errors.name ? <p role="alert" className="text-xs">{errors.name}</p> : null}
            <label className="block text-sm">Correo
              <input className="mt-1 block w-full p-2" style={FIELD} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            {errors.email ? <p role="alert" className="text-xs">{errors.email}</p> : null}
            <label className="block text-sm">Mensaje
              <textarea className="mt-1 block w-full p-2" style={FIELD} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            {errors.message ? <p role="alert" className="text-xs">{errors.message}</p> : null}
            <p data-testid="privacy-notice" className="text-xs">{PRIVACY_NOTICE}</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              {CONSENT_LABEL}
            </label>
            {errors.consent ? <p role="alert" className="text-xs">{errors.consent}</p> : null}
            <button type="submit" className="px-4 py-2 text-sm font-semibold" style={BTN}>Enviar consulta</button>
            {submitted ? (
              <p role="status" data-testid="submit-unavailable" className="text-xs">
                <StatusBadge status="UNAVAILABLE" /> El envío de consultas no está conectado todavía; no se envió ni guardó nada.
              </p>
            ) : null}
          </form>
        </article>
      ) : (
        <div data-testid="site-unavailable" className="space-y-1 p-5 text-sm" style={CARD}>
          <p className="font-semibold">Sin datos todavía</p>
          <p style={{ color: RT.muted }}><StatusBadge status="UNAVAILABLE" /> Backend de la web del agente (pendiente).</p>
        </div>
      )}
      <div data-testid="publish-box" className="p-4 text-sm" style={CARD}>
        <button type="button" disabled className="px-4 py-2 opacity-50" style={BTN}>Publicar</button>
        <p><StatusBadge status="UNAVAILABLE" /> La publicación real no está disponible.</p>
        {blockers.length ? <ul className="list-disc pl-5">{blockers.map((b) => (<li key={b}>{b}</li>))}</ul> : null}
      </div>
    </section>
  );
}
