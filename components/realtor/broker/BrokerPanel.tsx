"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { leerItem, leerItems, leerMesa, leerResumen, type Leida } from "@/lib/realtor/broker/client";
import { AGENT_LABEL, BROKERAGE_LABEL, COPY, KIND_LABEL, STATUS_LABEL, type Lang } from "@/lib/realtor/broker/copy";
import { DEMO_DESK, DEMO_ITEMS, DEMO_SUMMARY } from "@/lib/realtor/broker/demo";
import { AGENT_STATUSES, ITEM_KINDS, ITEM_STATUSES, type Desk, type DeskItem, type ItemKind, type ItemStatus, type Summary } from "@/lib/realtor/broker/types";
import { isDemoAllowed } from "@/lib/realtor/config";
import { BROKER_ROLE } from "@/lib/realtor/menu";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { RealtorNotice } from "../RealtorNotice";
import { useRealtorAccessInfo } from "../useRealtorAccess";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const H2: CSSProperties = { margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 };
const PILL: CSSProperties = { fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: RT.calloutBg, border: `1px solid ${RT.calloutLine}` };
const SELECT: CSSProperties = { minHeight: 36, borderRadius: 8, border: `1px solid ${RT.lineStrong}`, padding: "0 10px", fontFamily: "inherit", background: RT.white };

const fecha = (iso: string | null | undefined, lang: Lang) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(lang === "es" ? "es" : "en", { timeZone: "UTC" }) : "—";
};

/** Fail-closed: solo con interruptor, 200 de /acceso y el rol broker_supervisor se monta la bandeja (y se pide algo al backend). */
export function BrokerPanel() {
  const { state, roles } = useRealtorAccessInfo();
  if (state !== "ok") return <RealtorNotice reason={state} />;
  if (!roles.includes(BROKER_ROLE)) return <RealtorNotice reason="sin-acceso" />;
  return <BrokerDesk />;
}

type Carga = { fase: "cargando" } | { fase: "listo"; mesa: Leida<Desk>; resumen: Leida<Summary> };

function BrokerDesk() {
  const demoOk = isDemoAllowed();
  const [lang, setLang] = useState<Lang>("es");
  const [carga, setCarga] = useState<Carga>({ fase: "cargando" });
  const [status, setStatus] = useState<ItemStatus | "">("");
  const [kind, setKind] = useState<ItemKind | "">("");
  const [items, setItems] = useState<readonly DeskItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [lista, setLista] = useState<"cargando" | "ok" | "vacio" | "error">("cargando");
  const [abierto, setAbierto] = useState<{ id: string; item: Leida<DeskItem> | null } | null>(null);
  const t = COPY[lang];

  useEffect(() => {
    let vivo = true;
    Promise.all([leerMesa(), leerResumen()]).then(([mesa, resumen]) => { if (vivo) setCarga({ fase: "listo", mesa, resumen }); });
    return () => { vivo = false; };
  }, []);

  const cargarItems = useCallback(async (cur?: string) => {
    const r = await leerItems({ status: status || undefined, kind: kind || undefined, cursor: cur });
    if (r.estado === "ok") {
      setItems((prev) => (cur ? [...prev, ...r.datos.items] : r.datos.items));
      setCursor(r.datos.next_cursor ?? null);
      setLista(r.datos.items.length === 0 && !cur ? "vacio" : "ok");
    } else {
      if (!cur) { setItems([]); setCursor(null); }
      setLista(r.estado);
    }
  }, [status, kind]);

  useEffect(() => { setLista("cargando"); void cargarItems(); }, [cargarItems]);

  const abrir = async (id: string) => {
    setAbierto({ id, item: null });
    if (id.startsWith("demo-")) {
      setAbierto({ id, item: { estado: "ok", datos: DEMO_ITEMS.find((i) => i.id === id) as DeskItem } });
      return;
    }
    const item = await leerItem(id);
    setAbierto((a) => (a && a.id === id ? { id, item } : a));
  };

  const real = carga.fase === "listo" && (carga.mesa.estado === "ok" || carga.resumen.estado === "ok" || items.length > 0);
  const sinDatos = carga.fase === "listo" && !real && lista !== "cargando";
  const demo = demoOk && sinDatos && lista !== "error";
  const mesa = demo ? DEMO_DESK : carga.fase === "listo" && carga.mesa.estado === "ok" ? carga.mesa.datos : null;
  const resumen = demo ? DEMO_SUMMARY : carga.fase === "listo" && carga.resumen.estado === "ok" ? carga.resumen.datos : null;
  const filas: readonly DeskItem[] = demo
    ? DEMO_ITEMS.filter((i) => (!status || i.status === status) && (!kind || i.kind === kind))
    : items;
  const fallo = carga.fase === "listo" && carga.mesa.estado === "error" && carga.resumen.estado === "error" && lista === "error";

  return (
    <section data-testid="broker-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
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
      <p role="note" data-testid="broker-readonly" style={{ margin: 0, fontSize: 13, color: RT.muted }}>{t.readOnly}</p>
      {demo ? (
        <p role="note" data-testid="demo-banner" style={{ margin: 0, background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{t.demo}</p>
      ) : null}

      {carga.fase === "cargando" ? <p role="status" data-testid="broker-loading">{t.loading}</p> : null}
      {fallo ? <p role="alert" data-testid="broker-error" style={CARD}>{t.error}</p> : null}
      {sinDatos && !demo && !fallo ? (
        <div data-testid="broker-empty" style={CARD}>
          <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24 }}>{t.empty}</h2>
          <p style={{ margin: "10px 0 0", color: RT.muted }}>{t.emptyHint}</p>
        </div>
      ) : null}

      {mesa || resumen || filas.length > 0 || demo || (real && lista !== "cargando") ? (
        <>
          {mesa ? (
            <p data-testid="broker-desk" style={{ margin: 0, fontSize: 14, color: RT.muted }}>
              <strong style={{ color: RT.ink }}>{t.desk}</strong> · {t.since} {fecha(mesa.created_at, lang)}
            </p>
          ) : null}
          {resumen ? (
            <div data-testid="broker-summary" style={{ ...CARD, display: "flex", flexDirection: "column", gap: 14 }}>
              <h2 style={{ ...H2, margin: 0 }}>{t.summary}</h2>
              <p style={{ margin: 0, fontSize: 14 }}>{t.brokerage}: <strong data-testid="brokerage-status">{BROKERAGE_LABEL[lang][resumen.brokerage_status] ?? resumen.brokerage_status}</strong></p>
              <div aria-label={t.pendingByKind} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {ITEM_KINDS.map((k) => (
                  <span key={k} data-testid={`pending-${k}`} style={PILL}>{KIND_LABEL[lang][k]} · {resumen.pending_by_kind[k] ?? 0}</span>
                ))}
              </div>
              <div aria-label={t.agentsByStatus} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {AGENT_STATUSES.map((s) => (
                  <span key={s} data-testid={`agents-${s}`} style={PILL}>{AGENT_LABEL[lang][s]} · {resumen.agents_by_status[s] ?? 0}</span>
                ))}
              </div>
              <p data-testid="supervisors" style={{ margin: 0, fontSize: 14 }}>
                {t.supervisors}: {resumen.supervised_agent_counts.length} · {t.supervised}: {resumen.supervised_agent_counts.reduce((n, s) => n + s.active_supervised, 0)}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.updated}: {fecha(resumen.generated_at, lang)}</p>
            </div>
          ) : null}

          <div style={CARD}>
            <h2 style={H2}>{t.items}</h2>
            <div role="group" aria-label={t.filters} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>{t.status}
                <select data-testid="filter-status" style={SELECT} value={status} onChange={(e) => setStatus(e.target.value as ItemStatus | "")}>
                  <option value="">{t.all}</option>
                  {ITEM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[lang][s]}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>{t.kind}
                <select data-testid="filter-kind" style={SELECT} value={kind} onChange={(e) => setKind(e.target.value as ItemKind | "")}>
                  <option value="">{t.all}</option>
                  {ITEM_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[lang][k]}</option>)}
                </select>
              </label>
            </div>
            {lista === "error" && !demo ? <p role="alert" data-testid="items-error">{t.error}</p> : null}
            {filas.length === 0 && lista !== "cargando" && lista !== "error" ? <p data-testid="items-empty" style={{ color: RT.muted }}>{t.empty}</p> : null}
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {filas.map((i) => (
                <li key={i.id}>
                  <button type="button" data-testid="item-row" data-status={i.status} onClick={() => void abrir(i.id)}
                    style={{ width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 10, padding: 14 }}>
                    <strong style={{ display: "block", fontSize: 14 }}>{i.subject_label || t.noSubject}</strong>
                    <span style={{ display: "block", fontSize: 13, color: RT.muted, margin: "4px 0 8px" }}>{KIND_LABEL[lang][i.kind]} · {fecha(i.created_at, lang)}</span>
                    <span style={PILL}>{STATUS_LABEL[lang][i.status]}</span>
                  </button>
                </li>
              ))}
            </ul>
            {!demo && cursor ? (
              <button type="button" data-testid="items-more" onClick={() => void cargarItems(cursor)}
                style={{ marginTop: 14, minHeight: 40, padding: "0 16px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{t.more}</button>
            ) : null}
          </div>

          {abierto ? (
            <div data-testid="item-detail" role="dialog" aria-label={t.detail} style={CARD}>
              <h2 style={H2}>{t.detail}</h2>
              {abierto.item === null ? <p>{t.loading}</p> : abierto.item.estado !== "ok" ? <p data-testid="detail-error">{t.detailError}</p> : (
                <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "max-content 1fr", gap: "8px 18px", fontSize: 14 }}>
                  <dt>{t.subject}</dt><dd style={{ margin: 0 }}>{abierto.item.datos.subject_label || t.noSubject}</dd>
                  <dt>{t.kind}</dt><dd style={{ margin: 0 }}>{KIND_LABEL[lang][abierto.item.datos.kind]}</dd>
                  <dt>{t.status}</dt><dd style={{ margin: 0 }}>{STATUS_LABEL[lang][abierto.item.datos.status]}</dd>
                  <dt>{t.requestedAt}</dt><dd style={{ margin: 0 }}>{fecha(abierto.item.datos.created_at, lang)}</dd>
                  <dt>{t.decidedAt}</dt><dd style={{ margin: 0 }}>{fecha(abierto.item.datos.decided_at, lang)}</dd>
                  <dt>{t.reason}</dt><dd style={{ margin: 0 }}>{abierto.item.datos.decision_reason || "—"}</dd>
                </dl>
              )}
              <button type="button" data-testid="detail-close" onClick={() => setAbierto(null)}
                style={{ marginTop: 14, minHeight: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{t.close}</button>
            </div>
          ) : null}
        </>
      ) : null}
      <p role="note" style={{ margin: 0, fontSize: 12, color: RT.muted }}>{t.fairHousing}</p>
    </section>
  );
}
