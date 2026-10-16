"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { isDemoAllowed } from "@/lib/realtor/config";
import { AGREEMENT_LABEL, COPY, ROLE_LABEL, STAGE_LABEL, type Lang } from "@/lib/realtor/propietarios/copy";
import { fetchOwners } from "@/lib/realtor/propietarios/api";
import { DEMO_OWNERS } from "@/lib/realtor/propietarios/demo";
import { applyFilters, countByRole, formatPrice } from "@/lib/realtor/propietarios/logic";
import { AGREEMENTS, NO_FILTERS, OWNER_ROLES, type OwnerFilters, type OwnerRow } from "@/lib/realtor/propietarios/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccess } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22, minHeight: 640 };
const SELECT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const TH: CSSProperties = { padding: "10px 8px", borderBottom: `1px solid ${RT.line}`, textAlign: "left", color: RT.muted, fontWeight: 600 };
const TD: CSSProperties = { padding: "10px 8px", borderBottom: `1px solid ${RT.line}`, verticalAlign: "top" };

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

export function PropietariosPanel() {
  const access = useRealtorAccess();
  const [lang, setLang] = useState<Lang>("es");
  const [filters, setFilters] = useState<OwnerFilters>(NO_FILTERS);
  const demo = isDemoAllowed();
  const t = COPY[lang];

  // Fuera de DEMO se lee C-RE-OLA3 (owners); sin datos (404, 503, lista vacía) queda «Sin datos todavía», sin cifras inventadas.
  const [real, setReal] = useState<readonly OwnerRow[]>([]);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchOwners().then((r) => { if (alive) setReal(r); });
    return () => { alive = false; };
  }, [demo, access]);
  const owners: readonly OwnerRow[] = demo ? DEMO_OWNERS : real;
  const visible = useMemo(() => applyFilters(owners, filters), [owners, filters]);
  const counts = useMemo(() => countByRole(owners), [owners]);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const set = (patch: Partial<OwnerFilters>) => setFilters((f) => ({ ...f, ...patch }));
  return (
    <section data-testid="propietarios-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
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

      {owners.length === 0 ? (
        <div data-testid="propietarios-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Select label={t.fRole} value={filters.role} all={t.all} onChange={(v) => set({ role: v })}
              options={OWNER_ROLES.map((id) => ({ id, label: ROLE_LABEL[lang][id] }))} />
            <Select label={t.fAgreement} value={filters.agreement} all={t.all} onChange={(v) => set({ agreement: v })}
              options={AGREEMENTS.map((id) => ({ id, label: AGREEMENT_LABEL[lang][id] }))} />
          </div>
          <div data-testid="role-counts" aria-label={t.counts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {OWNER_ROLES.map((r) => (
              <span key={r} data-testid={`count-${r}`} style={{ background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>
                {ROLE_LABEL[lang][r]} · {counts[r]}
              </span>
            ))}
          </div>
          <section aria-label={t.title} style={CARD}>
            <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.listTitle}</h2>
            {visible[0] ? (
              <p data-testid="owner-focus" style={{ margin: "0 0 18px", background: RT.ink, color: RT.white, borderRadius: 6, padding: "12px 14px", fontSize: 14 }}>
                {[visible[0].name, visible[0].property, visible[0].stage ? STAGE_LABEL[lang][visible[0].stage!] : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {visible.length === 0 ? <p data-testid="propietarios-nomatch" style={{ color: RT.muted }}>{t.noMatch}</p> : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>{[t.cOwner, t.cRole, t.cProperty, t.cPrice, t.cAgreement, t.cStage, t.cFollow].map((h) => (<th key={h} scope="col" style={TH}>{h}</th>))}</tr>
                  </thead>
                  <tbody>
                    {visible.map((o) => (
                      <tr key={o.id} data-testid="owner-row">
                        <td style={TD}>{o.name}</td>
                        <td style={TD}>{ROLE_LABEL[lang][o.role]}</td>
                        <td style={TD}>{o.property ? <strong>{o.property}</strong> : o.propertiesCount != null ? `${o.propertiesCount} ${t.properties}` : "—"}</td>
                        <td style={TD}>{formatPrice(o, lang)}</td>
                        <td style={TD}>{o.agreement ? AGREEMENT_LABEL[lang][o.agreement] : "—"}</td>
                        <td style={TD}>{o.stage ? STAGE_LABEL[lang][o.stage] : "—"}</td>
                        <td style={TD}>{o.followUp ? o.followUp[lang] : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}
