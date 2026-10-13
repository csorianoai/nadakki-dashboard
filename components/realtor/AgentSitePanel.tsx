"use client";

import { useEffect, useState } from "react";
import { fetchPanelAccess } from "@/lib/realtor/access";
import { isDemoAllowed, isPanelFlagOn } from "@/lib/realtor/config";
import { DEMO_BANNER } from "@/lib/realtor/copy";
import {
  CLOSED_GATES, CONSENT_LABEL, DEMO_PROFILE, PRIVACY_NOTICE, publishBlockers, validateContact,
  type ContactForm, type FormErrors,
} from "@/lib/realtor/agent-site";
import { StatusBadge } from "./StatusBadge";

const EMPTY: ContactForm = { name: "", email: "", message: "", consent: false };

export function AgentSitePanel() {
  const flagOn = isPanelFlagOn();
  const [allowed, setAllowed] = useState(false);
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const demoAllowed = isDemoAllowed();

  useEffect(() => {
    if (!flagOn) return;
    let alive = true;
    fetchPanelAccess().then((ok) => { if (alive) setAllowed(ok); });
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
    <section data-testid="agent-site-panel" className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Web del agente</h1>
      {demoAllowed ? <p role="note" data-testid="demo-banner" className="rounded border p-2 text-sm font-semibold">{DEMO_BANNER}</p> : null}
      {demoAllowed ? (
        <article data-testid="agent-site-preview" className="space-y-3 rounded border p-4">
          <StatusBadge status="DEMO" />
          <h2 className="text-lg font-semibold">{profile.agentName}</h2>
          <p className="text-sm">Dominio: {profile.domain}</p>
          <address data-testid="contact-data" className="text-sm not-italic">
            <p>{profile.email} · {profile.phone}</p>
            <p data-testid="brokerage-name">Brokerage licenciada: {profile.brokerageLicensedName} (licencia {profile.licenseNumber})</p>
          </address>
          <form onSubmit={onSubmit} noValidate aria-label="Formulario de contacto" className="space-y-2">
            <label className="block text-sm">Nombre
              <input className="block w-full rounded border p-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            {errors.name ? <p role="alert" className="text-xs">{errors.name}</p> : null}
            <label className="block text-sm">Correo
              <input className="block w-full rounded border p-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            {errors.email ? <p role="alert" className="text-xs">{errors.email}</p> : null}
            <label className="block text-sm">Mensaje
              <textarea className="block w-full rounded border p-1" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            {errors.message ? <p role="alert" className="text-xs">{errors.message}</p> : null}
            <p data-testid="privacy-notice" className="text-xs">{PRIVACY_NOTICE}</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              {CONSENT_LABEL}
            </label>
            {errors.consent ? <p role="alert" className="text-xs">{errors.consent}</p> : null}
            <button type="submit" className="rounded border px-3 py-1 text-sm">Enviar consulta</button>
            {submitted ? (
              <p role="status" data-testid="submit-unavailable" className="text-xs">
                <StatusBadge status="UNAVAILABLE" /> El envío de consultas no está conectado todavía; no se envió ni guardó nada.
              </p>
            ) : null}
          </form>
        </article>
      ) : (
        <p data-testid="site-unavailable" className="text-sm"><StatusBadge status="UNAVAILABLE" /> Backend de la web del agente (pendiente).</p>
      )}
      <div data-testid="publish-box" className="rounded border p-3 text-sm">
        <button type="button" disabled className="rounded border px-3 py-1">Publicar</button>
        <p><StatusBadge status="UNAVAILABLE" /> La publicación real no está disponible.</p>
        {blockers.length ? <ul className="list-disc pl-5">{blockers.map((b) => (<li key={b}>{b}</li>))}</ul> : null}
      </div>
    </section>
  );
}
