"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { COPY, ORIGIN_LABEL, ROLE_LABEL, STATUS_LABEL, type Lang } from "@/lib/realtor/clientes/copy";
import { DEMO_CONTACTS } from "@/lib/realtor/clientes/demo";
import { applyFilters, countByStatus, isClient, maskEmail, maskPhone } from "@/lib/realtor/clientes/logic";
import { LEAD_STATUSES, NO_FILTERS, ORIGINS, ROLES, type ClientFilters, type Contact } from "@/lib/realtor/clientes/types";
import { isDemoAllowed } from "@/lib/realtor/config";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccess } from "../useRealtorAccess";

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

export function ClientesPanel() {
  const access = useRealtorAccess();
  const [lang, setLang] = useState<Lang>("es");
  const [tab, setTab] = useState<"clientes" | "leads">("clientes");
  const [filters, setFilters] = useState<ClientFilters>(NO_FILTERS);
  const [selected, setSelected] = useState<string | null>(null);
  const demo = isDemoAllowed();
  const t = COPY[lang];

  // Fuera de DEMO no hay fuente conectada: lista vacía, sin cifras inventadas.
  const contacts: readonly Contact[] = demo ? DEMO_CONTACTS : [];
  const inTab = useMemo(() => contacts.filter((c) => (tab === "clientes" ? isClient(c) : !isClient(c))), [contacts, tab]);
  const visible = useMemo(() => applyFilters(inTab, filters), [inTab, filters]);
  const counts = useMemo(() => countByStatus(inTab), [inTab]);
  const current = visible.find((c) => c.id === selected) ?? visible[0];

  if (access !== "ok") return <RealtorNotice reason={access} />;

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

      <div role="group" aria-label="Clientes / Leads" style={{ display: "flex", gap: 8 }}>
        {(["clientes", "leads"] as const).map((k) => (
          <button key={k} type="button" data-testid={`tab-${k}`} aria-pressed={tab === k} onClick={() => setTab(k)}
            style={{ minHeight: 44, padding: "0 22px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700,
              border: `1px solid ${tab === k ? RT.ink : RT.lineStrong}`, background: tab === k ? RT.ink : RT.white, color: tab === k ? RT.white : RT.ink }}>
            {k === "clientes" ? t.tabClients : t.tabLeads}
          </button>
        ))}
      </div>

      {contacts.length === 0 ? (
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
          <div data-testid="status-counts" aria-label={t.statusCounts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {LEAD_STATUSES.map((s) => (
              <span key={s} data-testid={`count-${s}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                {STATUS_LABEL[lang][s]} · {counts[s]}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(300px, 2fr) minmax(360px, 3fr)", alignItems: "start" }}>
            <div style={CARD}>
              <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.listTitle}</h2>
              {visible.length === 0 ? <p data-testid="clientes-nomatch" style={{ color: RT.muted }}>{t.noMatch}</p> : null}
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
              </ul>
            </div>
            <div data-testid="contact-ficha" style={CARD}>
              <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{current ? current.name : t.fichaTitle}</h2>
              {current ? (
                <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, margin: 0, fontSize: 14 }}>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.role}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{current.role ? ROLE_LABEL[lang][current.role] : "—"}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.origin}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{ORIGIN_LABEL[lang][current.origin]}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.phone}</dt><dd data-testid="ficha-phone" style={{ margin: 0, fontWeight: 700 }}>{maskPhone(current.phone)}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.email}</dt><dd data-testid="ficha-email" style={{ margin: 0, fontWeight: 700 }}>{maskEmail(current.email)}</dd></div>
                  <div><dt style={{ fontSize: 12, color: RT.muted }}>{t.status}</dt><dd style={{ margin: 0, fontWeight: 700 }}>{current.leadStatus ? STATUS_LABEL[lang][current.leadStatus] : t.none}</dd></div>
                </dl>
              ) : <p style={{ color: RT.muted }}>{t.pickOne}</p>}
              <p style={{ margin: "16px 0 0", fontSize: 12, color: RT.muted }}>{t.masked}</p>
            </div>
          </div>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}
