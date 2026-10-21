"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AGREEMENT_LABEL, COPY, KIND_LABEL, ORIGIN_LABEL, OWNER_LABEL, OWNER_ROLE_LABEL, ROLE_LABEL, STATUS_LABEL, type Lang } from "@/lib/realtor/clientes/copy";
import { fetchClients } from "@/lib/realtor/clientes/api";
import { DEMO_CONTACTS, DEMO_JOURNEYS, DEMO_OWNERS } from "@/lib/realtor/clientes/demo";
import { applyFilters, countByStatus, inKind, maskEmail, maskPhone, showsOwners } from "@/lib/realtor/clientes/logic";
import { KINDS, LEAD_STATUSES, NO_FILTERS, ORIGINS, ROLES, type ClientFilters, type Contact, type ContactKind } from "@/lib/realtor/clientes/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { ContactForm } from "./ContactForm";
import { FORM_COPY } from "@/lib/realtor/clientes/copy-form";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const SELECT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };

function Select<T extends string>({ label, value, options, all, onChange }: {
  label: string; value: T | "todos"; options: readonly { id: T; label: string }[]; all: string; onChange: (v: T | "todos") => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: RT.muted }}>
      {label}
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T | "todos")} style={SELECT}>
        <option value="todos">{all}</option>
        {options.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
      </select>
    </label>
  );
}

function Journey({ id, lang }: { id: string; lang: Lang }) {
  const j = DEMO_JOURNEYS[id];
  const t = COPY[lang];
  const yn = (v: boolean) => (v ? t.yes : t.no);
  return (
    <div data-testid="client-journey" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <dl style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: 0, fontSize: 14 }}>
        <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.operation}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{j.operation[lang]}</dd></div>
        <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.budget}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{j.budget[lang]}</dd></div>
        <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.zone}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{j.zone}</dd></div>
      </dl>
      <p data-testid="client-consent" style={{ margin: 0, fontSize: 14 }}>
        {t.consent}: <strong>{t.wa}: {yn(j.consent.whatsapp)} · {t.email}: {yn(j.consent.email)} · {t.call}: {yn(j.consent.call)}</strong>
      </p>
      <h3 style={{ margin: "6px 0 0", fontFamily: FONT_DISPLAY, fontSize: 18 }}>{t.matches}</h3>
      {j.matches.map((m) => (
        <div key={m.name} style={{ borderBottom: `1px solid ${RT.line}`, paddingBottom: 10 }}>
          <div style={{ fontSize: 15 }}><strong>{m.name}</strong> · {m.detail[lang]}</div>
          <span style={{ display: "inline-block", marginTop: 6, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 10px",
            background: m.fit ? RT.chipUpBg : RT.chipDownBg, color: m.fit ? RT.chipUpText : RT.chipDownText }}>{m.fit ? t.fit : t.over}</span>
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {[t.seeMatches, t.map, t.visit, t.chat].map((label, i) => (
          <button key={label} type="button" disabled style={{ fontFamily: "inherit", display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 16px", borderRadius: 8, fontWeight: 700, fontSize: 15,
            background: i === 0 ? RT.teal : RT.white, color: i === 0 ? RT.white : RT.ink, border: `1px solid ${i === 0 ? RT.teal : RT.lineStrong}` }}>{label}</button>
        ))}
      </div>
    </div>
  );
}

export function ClientesPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const [kind, setKind] = useState<ContactKind>("cliente");
  const [filters, setFilters] = useState<ClientFilters>(NO_FILTERS);
  const [selected, setSelected] = useState<string | null>(null);
  const demo = demoActive;
  const t = COPY[lang];

  // Fuera de DEMO se leen los clientes reales del contrato C-RE-OLA2; sin datos (404/503, vacío) la lista queda vacía.
  const [real, setReal] = useState<readonly Contact[]>([]);
  const [reload, setReload] = useState(0);
  // Formulario de contacto (solo datos reales): "new" = alta, "edit" = edición del contacto elegido.
  const [form, setForm] = useState<"new" | "edit" | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchClients().then((list) => { if (alive) setReal(list); });
    return () => { alive = false; };
  }, [demo, access, reload]);
  const contacts: readonly Contact[] = demo ? DEMO_CONTACTS : real;
  const owners = demo ? DEMO_OWNERS : [];
  const inTab = useMemo(() => contacts.filter((c) => inKind(c, kind)), [contacts, kind]);
  const visible = useMemo(() => (kind === "propietario" ? [] : applyFilters(inTab, filters)), [inTab, filters, kind]);
  const listedOwners = showsOwners(kind, filters) ? owners : [];
  const counts = useMemo(() => countByStatus(inTab), [inTab]);
  const kindLabel = KIND_LABEL(t);
  const current = visible.find((c) => c.id === selected) ?? visible[0];

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const ft = FORM_COPY[lang];
  const btn: CSSProperties = { ...SELECT, minHeight: 44, padding: "0 18px", fontWeight: 700, cursor: "pointer" };
  const set = (patch: Partial<ClientFilters>) => setFilters((f) => ({ ...f, ...patch }));
  return (
    <section data-testid="clientes-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 780, fontSize: 16, lineHeight: 1.45, color: RT.muted }}>{t.intro}</p>
        </div>
        <div role="group" aria-label={t.lang} style={{ display: "flex", gap: 6 }}>
          {(["es", "en"] as const).map((l) => (
            <button key={l} type="button" data-testid={`lang-${l}`} aria-pressed={lang === l} onClick={() => setLang(l)}
              style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                border: `1px solid ${lang === l ? RT.ink : RT.lineStrong}`, background: lang === l ? RT.ink : RT.white, color: lang === l ? RT.white : RT.ink }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {demo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demo}</p>
      ) : null}

      {!demo ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button" data-testid="contact-new" style={btn} onClick={() => { setSaved(false); setForm("new"); }}>{ft.newContact}</button>
          {saved ? <p role="status" data-testid="contact-saved" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: RT.chipUpText }}>{ft.saved}</p> : null}
        </div>
      ) : null}
      {form && !demo && (form === "new" || current) ? (
        <ContactForm key={form === "edit" ? current?.id : "new"} contact={form === "edit" ? current : undefined} lang={lang} onCancel={() => setForm(null)}
          onSaved={() => { setForm(null); setSaved(true); setReload((n) => n + 1); }} />
      ) : null}

      <div role="group" aria-label={t.kindLabel} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {KINDS.map((k) => (
          <button key={k} type="button" data-testid={`tab-${k === "cliente" ? "clientes" : k === "lead" ? "leads" : k}`} aria-pressed={kind === k} onClick={() => setKind(k)}
            style={{ minHeight: 44, padding: "0 22px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700,
              border: `1px solid ${kind === k ? RT.ink : RT.lineStrong}`, background: kind === k ? RT.ink : RT.white, color: kind === k ? RT.white : RT.ink }}>
            {kindLabel[k]}
          </button>
        ))}
      </div>

      {contacts.length === 0 && owners.length === 0 ? (
        <div data-testid="clientes-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Select label={t.fRole} value={filters.role} all={t.all} onChange={(v) => set({ role: v })}
              options={ROLES.map((id) => ({ id, label: ROLE_LABEL[lang][id] }))} />
            <Select label={t.fOrigin} value={filters.origin} all={t.all} onChange={(v) => set({ origin: v })}
              options={ORIGINS.map((id) => ({ id, label: ORIGIN_LABEL[lang][id] }))} />
            <Select label={t.fStatus} value={filters.leadStatus} all={t.all} onChange={(v) => set({ leadStatus: v })}
              options={LEAD_STATUSES.map((id) => ({ id, label: STATUS_LABEL[lang][id] }))} />
          </div>
          {kind === "propietario" || !demo ? null : <div data-testid="status-counts" aria-label={t.statusCounts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {LEAD_STATUSES.map((s) => (
              <span key={s} data-testid={`count-${s}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                {STATUS_LABEL[lang][s]} · {counts[s]}
              </span>
            ))}
          </div>}
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(300px, 4fr) minmax(360px, 7fr)", alignItems: "start" }}>
            <div style={CARD}>
              <h2 style={{ margin: "0 0 10px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.listTitle}</h2>
              <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.45, color: RT.muted }}>{t.listHint}</p>
              {visible.length === 0 && listedOwners.length === 0 ? <p data-testid="clientes-nomatch" style={{ color: RT.muted }}>{t.noMatch}</p> : null}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {visible.map((c) => (
                  <li key={c.id}>
                    <button type="button" data-testid="contact-row" aria-pressed={current?.id === c.id} onClick={() => setSelected(c.id)}
                      style={{ width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: RT.ink, background: RT.white, borderRadius: 10, padding: 14,
                        border: `${current?.id === c.id ? 2 : 1}px solid ${current?.id === c.id ? RT.teal : RT.line}` }}>
                      <strong style={{ display: "block", fontSize: 14 }}>{c.name}</strong>
                      <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>{c.summary[lang]}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, background: RT.chipUpBg, color: RT.chipUpText, borderRadius: 999, padding: "3px 10px" }}>
                        {c.leadStatus ? STATUS_LABEL[lang][c.leadStatus] : t.none}
                      </span>
                    </button>
                  </li>
                ))}
                {listedOwners.map((o) => (
                  <li key={o.id}>
                    <Link href="/realtor/propietarios" data-testid="owner-row" aria-label={`${t.ownerRow}: ${o.name}`}
                      style={{ display: "block", textDecoration: "none", color: RT.ink, background: RT.white, borderRadius: 10, padding: 14, border: `1px solid ${RT.line}` }}>
                      <strong style={{ display: "block", fontSize: 14 }}>{o.name}</strong>
                      <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>
                        {OWNER_ROLE_LABEL[lang][o.ownerRole]} · {o.mandates.length} {t.mandates}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, background: RT.calloutBg, color: RT.teal, borderRadius: 999, padding: "3px 10px" }}>
                        {OWNER_LABEL[lang]} · {AGREEMENT_LABEL[lang][o.mandates[0]?.agreement ?? "sin-acuerdo"]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="contact-ficha" style={CARD}>
              <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{current ? current.name : t.fichaTitle}</h2>
              {current ? (
                <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, margin: 0, fontSize: 14 }}>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.role}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{current.role ? ROLE_LABEL[lang][current.role] : "—"}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.origin}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{current.origin ? ORIGIN_LABEL[lang][current.origin] : "—"}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.phone}</dt><dd data-testid="ficha-phone" style={{ margin: 0, fontWeight: 700 }}>{current.phoneMasked ?? (current.phone ? maskPhone(current.phone) : "—")}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.email}</dt><dd data-testid="ficha-email" style={{ margin: 0, fontWeight: 700 }}>{current.emailMasked ?? (current.email ? maskEmail(current.email) : "—")}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.status}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{current.leadStatus ? STATUS_LABEL[lang][current.leadStatus] : t.none}</dd></div>
                </dl>
              ) : <p style={{ color: RT.muted }}>{t.pickOne}</p>}
              {current && !demo ? <button type="button" data-testid="contact-edit" style={{ ...btn, marginTop: 14 }} onClick={() => { setSaved(false); setForm("edit"); }}>{ft.edit}</button> : null}
              {current && DEMO_JOURNEYS[current.id] ? <Journey id={current.id} lang={lang} /> : null}
              <p style={{ margin: "16px 0 0", fontSize: 12, color: RT.muted }}>{t.masked}</p>
            </div>
          </div>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}
