"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { leerItem, leerItems, type Leida } from "@/lib/realtor/broker/client";
import type { DeskItem } from "@/lib/realtor/broker/types";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { QA_KINDS, qaDecidir, qaHistorial, type QaDecision, type QaEntrada, type QaMotivoFallo } from "./qa-client";

const CARD: CSSProperties = { background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22 };
const BTN: CSSProperties = { minHeight: 40, padding: "0 16px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`, background: RT.white, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 };

const TXT = {
  label: "QA · sin efecto legal",
  title: "Revisión QA",
  intro: "Decisiones de prueba del piloto: no aprueban ni rechazan nada de verdad.",
  items: "Solicitudes", empty: "Sin solicitudes todavía", error: "No pudimos cargar las solicitudes.",
  approve: "Aprobar", ret: "Devolver", reject: "Rechazar (TEST)", sending: "Enviando…",
  history: "Historial QA", noHistory: "Sin decisiones QA todavía", historyError: "No pudimos cargar el historial QA.",
  close: "Cerrar", noSubject: "Sin descripción",
  conflict: "Esta solicitud ya cambió de estado. Recarga la lista.",
  forbidden: "No puedes hacer decisiones QA sobre esta solicitud.",
  invalid: "La decisión QA no es válida. La solicitud sigue igual.",
  failed: "No pudimos registrar la decisión QA. Inténtalo de nuevo.",
} as const;
const DECISION_TXT: Record<QaDecision, string> = { approve: "Aprobada", return: "Devuelta", reject: "Rechazada (TEST)" };
const AVISO: Record<QaMotivoFallo, { id: string; txt: string }> = {
  conflicto: { id: "qa-conflict", txt: TXT.conflict },
  prohibido: { id: "qa-forbidden", txt: TXT.forbidden },
  invalido: { id: "qa-invalid", txt: TXT.invalid },
  "no-existe": { id: "qa-error", txt: TXT.failed },
  error: { id: "qa-error", txt: TXT.failed },
};

/** Solo se monta con qa_reviewer=true de /acceso (BrokerPanel decide). Solo revisiones; nada legal; sin tenant. */
export function QaDesk() {
  const [items, setItems] = useState<readonly DeskItem[]>([]);
  const [lista, setLista] = useState<"cargando" | "ok" | "vacio" | "error">("cargando");
  const [abierto, setAbierto] = useState<{ id: string; item: Leida<DeskItem> | null } | null>(null);
  const [historial, setHistorial] = useState<Leida<readonly QaEntrada[]> | null>(null);
  const [aviso, setAviso] = useState<QaMotivoFallo | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    leerItems({}).then((r) => {
      if (!vivo) return;
      if (r.estado === "ok") {
        const revisiones = r.datos.items.filter((i) => QA_KINDS.includes(i.kind as string));
        setItems(revisiones);
        setLista(revisiones.length ? "ok" : "vacio");
      } else setLista(r.estado === "vacio" ? "vacio" : "error");
    });
    return () => { vivo = false; };
  }, []);

  const cargarHistorial = useCallback(async (id: string) => {
    setHistorial(await qaHistorial(id));
  }, []);

  const abrir = async (id: string) => {
    setAbierto({ id, item: null });
    setHistorial(null);
    setAviso(null);
    void cargarHistorial(id);
    const item = await leerItem(id);
    setAbierto((a) => (a && a.id === id ? { id, item } : a));
  };

  const decidir = async (id: string, d: QaDecision) => {
    setEnviando(true);
    setAviso(null);
    const r = await qaDecidir(id, d);
    setEnviando(false);
    if (r.estado !== "ok") { setAviso(r.motivo); return; }
    // Sin efecto legal: el estado del item es el que devuelve el backend (sigue pending), no la decision QA.
    const status = r.datos.item_status as DeskItem["status"];
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    setAbierto((a) => (a && a.id === id && a.item?.estado === "ok" ? { id, item: { estado: "ok", datos: { ...a.item.datos, status } } } : a));
    void cargarHistorial(id);
  };

  return (
    <section data-testid="qa-panel" style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 40px 40px" }}>
      <p role="note" data-testid="qa-label" style={{ margin: 0, alignSelf: "flex-start", background: RT.demoBg, color: RT.demoText, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700 }}>{TXT.label}</p>
      <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 700 }}>{TXT.title}</h1>
      <p style={{ margin: 0, fontSize: 16, color: RT.muted }}>{TXT.intro}</p>
      <div style={CARD}>
        <h2 style={{ margin: "0 0 14px", fontFamily: FONT_DISPLAY, fontSize: 24 }}>{TXT.items}</h2>
        {lista === "error" ? <p role="alert" data-testid="items-error">{TXT.error}</p> : null}
        {lista === "vacio" ? <p data-testid="items-empty" style={{ color: RT.muted }}>{TXT.empty}</p> : null}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i) => (
            <li key={i.id}>
              <button type="button" data-testid="item-row" data-status={i.status} onClick={() => void abrir(i.id)}
                style={{ ...BTN, width: "100%", textAlign: "left", fontWeight: 400, padding: 14, minHeight: 0 }}>
                <strong>{i.subject_label || TXT.noSubject}</strong> · {i.status}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {abierto ? (
        <div data-testid="item-detail" role="dialog" aria-label={TXT.title} style={CARD}>
          <p style={{ margin: "0 0 10px", fontWeight: 700 }}>{abierto.item?.estado === "ok" ? abierto.item.datos.subject_label || TXT.noSubject : "…"}</p>
          {aviso ? <p role="alert" data-testid={AVISO[aviso].id} style={{ margin: "10px 0 0", fontSize: 13 }}>{AVISO[aviso].txt}</p> : null}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button type="button" data-testid="qa-approve" disabled={enviando} onClick={() => void decidir(abierto.id, "approve")} style={{ ...BTN, background: RT.ink, color: RT.white }}>{enviando ? TXT.sending : TXT.approve}</button>
            <button type="button" data-testid="qa-return" disabled={enviando} onClick={() => void decidir(abierto.id, "return")} style={BTN}>{TXT.ret}</button>
            <button type="button" data-testid="qa-reject" disabled={enviando} onClick={() => void decidir(abierto.id, "reject")} style={BTN}>{TXT.reject}</button>
          </div>
          <div data-testid="qa-history" style={{ marginTop: 16 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{TXT.history}</h3>
            {historial === null ? null : historial.estado === "error" ? <p role="alert">{TXT.historyError}</p>
              : historial.estado === "vacio" || historial.datos.length === 0 ? <p style={{ color: RT.muted }}>{TXT.noHistory}</p> : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {historial.datos.map((e, n) => <li key={`${e.at}-${n}`}>{DECISION_TXT[e.qa_decision] ?? e.qa_decision} · {String(e.at).slice(0, 10)}</li>)}
                </ul>
              )}
          </div>
          <button type="button" data-testid="detail-close" onClick={() => setAbierto(null)} style={{ ...BTN, marginTop: 14 }}>{TXT.close}</button>
        </div>
      ) : null}
    </section>
  );
}
