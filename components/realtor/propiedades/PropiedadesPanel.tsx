"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { COPY, STAGE_LABEL, STATUS_LABEL, TYPE_LABEL, type Lang } from "@/lib/realtor/propiedades/copy";
import { fetchProperties } from "@/lib/realtor/propiedades/api";
import { DEMO_PROPERTIES } from "@/lib/realtor/propiedades/demo";
import { applyFilters, countByStage, countByStatus, formatPrice } from "@/lib/realtor/propiedades/logic";
import { NO_FILTERS, STAGES, STATUSES, TYPES, type PropFilters, type Property } from "@/lib/realtor/propiedades/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { PropiedadForm } from "./PropiedadForm";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const SELECT: CSSProperties = { minHeight: 40, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 14, padding: "0 10px" };
const BTN: CSSProperties = { minHeight: 44, padding: "0 18px", borderRadius: 8, border: `1px solid ${RT.teal}`, background: RT.white, color: RT.ink, fontFamily: "inherit", fontWeight: 700, cursor: "pointer" };
const PILL: CSSProperties = { background: RT.calloutBg, border: `1px solid ${RT.calloutLine}`, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 700 };

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

export function PropiedadesPanel() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [lang, setLang] = useState<Lang>("es");
  const [filters, setFilters] = useState<PropFilters>(NO_FILTERS);
  const [selected, setSelected] = useState<string | null>(null);
  const demo = demoActive;
  const t = COPY[lang];

  // Fuera de DEMO se lee C-RE-OLA2; sin datos (404, 503, lista vacía) queda «Sin datos todavía», sin cifras inventadas.
  const [real, setReal] = useState<readonly Property[]>([]);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState<"new" | "edit" | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (demo || access !== "ok") return;
    let alive = true;
    fetchProperties().then((r) => { if (alive) setReal(r); });
    return () => { alive = false; };
  }, [demo, access, reload]);
  const props: readonly Property[] = demo ? DEMO_PROPERTIES : real;
  const visible = useMemo(() => applyFilters(props, filters), [props, filters]);
  const byStatus = useMemo(() => countByStatus(props), [props]);
  const byStage = useMemo(() => countByStage(props), [props]);
  const current = visible.find((p) => p.id === selected) ?? visible[0];

  if (access !== "ok") return <RealtorNotice reason={access} />;

  const set = (patch: Partial<PropFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const dt = (k: string, v: string, id?: string) => (
    <div><dt style={{ fontSize: 12, color: RT.muted }}>{k}</dt><dd data-testid={id} style={{ margin: 0, fontWeight: 700 }}>{v}</dd></div>
  );
  return (
    <section data-testid="propiedades-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
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
      {!demo ? (
        <div><button type="button" data-testid="propiedad-new" style={BTN} onClick={() => { setSaved(false); setForm("new"); }}>{t.newProperty}</button></div>
      ) : null}
      {saved ? <p role="status" data-testid="propiedad-saved" style={{ margin: 0, fontWeight: 700, color: RT.chipUpText }}>{t.saved}</p> : null}
      {form ? (
        <PropiedadForm key={form === "edit" ? current?.propertyId : "new"} propertyId={form === "edit" ? current?.propertyId : undefined} lang={lang} onCancel={() => setForm(null)}
          onSaved={() => { setForm(null); setSaved(true); setReload((n) => n + 1); }} />
      ) : null}
      {demo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demo}</p>
      ) : null}

      {props.length === 0 ? (
        <div data-testid="propiedades-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : (
        <>
          <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: 14, padding: "18px 22px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <Select label={t.fType} value={filters.type} all={t.all} onChange={(v) => set({ type: v })}
                options={TYPES.map((id) => ({ id, label: TYPE_LABEL[lang][id] }))} />
              <Select label={t.fStatus} value={filters.status} all={t.all} onChange={(v) => set({ status: v })}
                options={STATUSES.map((id) => ({ id, label: STATUS_LABEL[lang][id] }))} />
              <Select label={t.fStage} value={filters.stage} all={t.all} onChange={(v) => set({ stage: v })}
                options={STAGES.map((id) => ({ id, label: STAGE_LABEL[lang][id] }))} />
            </div>
            <div data-testid="status-counts" aria-label={t.statusCounts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {STATUSES.map((s) => (<span key={s} data-testid={`count-${s}`} style={PILL}>{STATUS_LABEL[lang][s]} · {byStatus[s]}</span>))}
            </div>
            <div data-testid="stage-counts" aria-label={t.stageCounts} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {STAGES.map((s) => (<span key={s} data-testid={`stage-${s}`} style={PILL}>{STAGE_LABEL[lang][s]} · {byStage[s]}</span>))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.listTitle}</h2>
              {visible.length === 0 ? <p data-testid="propiedades-nomatch" style={{ color: RT.muted }}>{t.noMatch}</p> : null}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 347px))" }}>
                {visible.map((p) => (
                  <li key={p.id}>
                    <button type="button" data-testid="property-row" aria-pressed={current?.id === p.id} onClick={() => setSelected(p.id)}
                      style={{ width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", color: RT.ink, background: RT.white, borderRadius: 12, padding: 0, overflow: "hidden",
                        border: `${current?.id === p.id ? 2 : 1}px solid ${current?.id === p.id ? RT.teal : RT.line}` }}>
                      <span aria-hidden="true" style={{ display: "block", height: 96, background: RT.calloutBg }} />
                      <span style={{ display: "block", padding: "18px 18px 20px" }}>
                        <strong style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 18 }}>{p.address}</strong>
                        <span style={{ display: "block", fontSize: 14, color: RT.muted, margin: "8px 0 10px" }}>
                          {TYPE_LABEL[lang][p.type]}{p.stage ? ` · ${STAGE_LABEL[lang][p.stage]}` : ""}
                        </span>
                        <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>{formatPrice(p.price.amount, p.price.currency, lang)}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, background: RT.chipUpBg, color: RT.chipUpText, borderRadius: 999, padding: "3px 10px" }}>{STATUS_LABEL[lang][p.status]}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="property-ficha" style={CARD}>
              <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{current ? current.address : t.fichaTitle}</h2>
              {current ? (
                <>
                  <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, margin: 0, fontSize: 14 }}>
                    {dt(t.price, formatPrice(current.price.amount, current.price.currency, lang), "ficha-price")}
                    {dt(t.type, TYPE_LABEL[lang][current.type])}
                    {dt(t.status, STATUS_LABEL[lang][current.status])}
                    {current.stage ? dt(t.stage, STAGE_LABEL[lang][current.stage]) : null}
                  </dl>
                  <h3 style={{ margin: "18px 0 8px", fontSize: 14 }}>{t.units}</h3>
                  {current.units.length === 0 ? <p style={{ color: RT.muted, margin: 0 }}>{t.noUnits}</p> : (
                    <ul data-testid="ficha-units" style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                      {current.units.map((u) => (<li key={u.label}>{u.label} · {u.beds} {t.beds} · {u.baths} {t.baths}</li>))}
                    </ul>
                  )}
                  {current.propertyId && !demo ? <button type="button" data-testid="propiedad-edit" style={{ ...BTN, marginTop: 14 }} onClick={() => { setSaved(false); setForm("edit"); }}>{t.editProperty}</button> : null}
                </>
              ) : <p style={{ color: RT.muted }}>{t.pickOne}</p>}
            </div>
          </div>
        </>
      )}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}
