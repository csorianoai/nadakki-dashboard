"use client";

import React, { useRef, useState } from "react";
import { importPortal, newIdempotencyKey } from "@/lib/sites/client";
import { pick } from "@/lib/sites/copy-util";
import { IMP } from "@/lib/sites/importar/copy";
import { claveError, hayErrores, informeDemo, leerArchivo, leerInforme, RECURSOS, type Informe, type Portal } from "@/lib/sites/importar/logic";
import { SIZE, ST } from "@/lib/sites/tokens";
import { Aviso } from "../shell/Aviso";
import { useSites } from "../shell/SitesContext";

type Fase = "vacio" | "revisando" | "informe" | "confirmar" | "importando" | "hecho";
const btn = { minHeight: SIZE.target, border: `1px solid ${ST.control}`, borderRadius: SIZE.radius, background: ST.white, color: ST.ink, fontSize: SIZE.fontBase, padding: "0 16px", cursor: "pointer" } as const;
const primary = { ...btn, background: ST.teal, color: ST.white, fontWeight: 700 } as const;

/** Conector de portales, lado panel: revisa (dry_run=true), muestra el informe por recurso e importa solo sin errores y con confirmacion. */
export function ImportarPortal({ siteId }: { siteId: string }) {
  const { lang, demo } = useSites();
  const t = (k: string) => pick(IMP[k], lang);
  const [fase, setFase] = useState<Fase>("vacio");
  const [informe, setInforme] = useState<Informe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const portal = useRef<Portal | null>(null);
  const claveImport = useRef<string | undefined>(undefined);
  const intento = useRef(0);

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const mio = ++intento.current; // cada archivo es un intento nuevo: clave nueva, resultado viejo descartado
    portal.current = null; claveImport.current = undefined;
    setInforme(null); setError(null);
    if (!file) return setFase("vacio");
    setFase("revisando");
    const lec = await leerArchivo(file);
    if (mio !== intento.current) return;
    if (!("portal" in lec)) { setError(lec.error); return setFase("vacio"); }
    portal.current = lec.portal;
    if (demo) { setInforme(informeDemo(lec.portal)); return setFase("informe"); }
    try {
      const r = await importPortal(siteId, lec.portal, true, { idempotencyKey: newIdempotencyKey() });
      if (mio !== intento.current) return;
      const inf = leerInforme(r);
      if (!inf) { setError("errDefault"); return setFase("vacio"); }
      setInforme(inf); setFase("informe");
    } catch (x) {
      if (mio !== intento.current) return;
      const rep = (x as { status?: number; problem?: { report?: unknown } });
      const inf = rep.status === 422 ? leerInforme(rep.problem?.report) : null;
      if (inf) { setInforme(inf); return setFase("informe"); }
      setError(claveError(x)); setFase("vacio");
    }
  };

  const importar = async () => {
    if (!portal.current) return;
    if (demo) return setFase("hecho"); // simulacro: ni llamada ni cambios
    setFase("importando");
    claveImport.current ??= newIdempotencyKey(); // solo un fallo de red conserva la clave para reintentar el mismo intento
    try {
      await importPortal(siteId, portal.current, false, { idempotencyKey: claveImport.current });
      claveImport.current = undefined;
      setFase("hecho");
    } catch (x) {
      if ((x as { code?: string })?.code !== "NETWORK") claveImport.current = undefined;
      setError(claveError(x)); setFase("informe");
    }
  };

  const bloqueado = !informe || hayErrores(informe);
  const link = (testid: string, path: string, k: string) => (
    <a data-testid={testid} className="sx-focus" href={`${path}?sitio=${encodeURIComponent(siteId)}`} style={{ ...btn, display: "inline-flex", alignItems: "center" }}>{t(k)}</a>
  );

  return (
    <section data-testid="importar-portal" style={{ display: "grid", gap: SIZE.gap, background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.pad }}>
      {demo && <p data-testid="importar-demo" role="status" style={{ margin: 0, color: ST.demoText, fontWeight: 700 }}>{t("demoNote")}</p>}
      <label htmlFor="sx-import-file">{t("file")}</label>
      <input id="sx-import-file" data-testid="importar-archivo" className="sx-focus" type="file" accept=".json,application/json" onChange={elegir} disabled={fase === "importando"} />
      {fase === "revisando" && <p role="status">{t("checking")}</p>}
      {error && <Aviso testid="importar-error" alert title={t("cardTitle")} body={t(error)} />}
      {informe && fase !== "vacio" && (
        <div data-testid="importar-informe" style={{ display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: SIZE.fontSub }}>{t("reportTitle")}</h3>
          <table style={{ borderCollapse: "collapse", textAlign: "left" }}>
            <thead><tr>{["", "create", "update", "same", "errors"].map((k) => <th key={k} scope="col">{k ? t(k) : ""}</th>)}</tr></thead>
            <tbody>
              {RECURSOS.map((r) => (
                <tr key={r} data-testid={`informe-${r}`}>
                  <th scope="row">{t(r)}</th>
                  <td>{informe[r].crear}</td><td>{informe[r].actualizar}</td><td>{informe[r].sin_cambios}</td><td>{informe[r].errores.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hayErrores(informe) && (
            <div data-testid="informe-errores" role="alert" style={{ color: ST.badText }}>
              <ul style={{ margin: 0 }}>
                {RECURSOS.flatMap((r) => informe[r].errores.map((e, i) => (
                  <li key={`${r}${i}`}>{t(r)}: {t("errorLine").replace("{ref}", e.external_ref ?? "—").replace("{field}", e.campo || "—")}</li>
                )))}
              </ul>
              <p style={{ margin: "8px 0 0" }}>{t("fixErrors")}</p>
            </div>
          )}
        </div>
      )}
      {(fase === "informe" || fase === "importando") && (
        <div><button type="button" data-testid="importar-boton" className="sx-focus" style={primary} disabled={bloqueado || fase === "importando"} onClick={() => setFase("confirmar")}>{fase === "importando" ? t("importing") : t("importBtn")}</button></div>
      )}
      {fase === "confirmar" && (
        <div data-testid="importar-confirmar" role="alertdialog" aria-label={t("confirmTitle")} style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{t("confirmTitle")}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" data-testid="importar-si" className="sx-focus" style={primary} onClick={importar}>{t("confirmYes")}</button>
            <button type="button" className="sx-focus" style={btn} onClick={() => setFase("informe")}>{t("confirmNo")}</button>
          </div>
        </div>
      )}
      {fase === "hecho" && (
        <div data-testid="importar-hecho" role="status" style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{t(demo ? "doneDemo" : "done")}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{link("ir-desarrollos", "/mi-web/desarrollos", "goDevs")}{link("ir-propiedades", "/mi-web/propiedades", "goListings")}</div>
        </div>
      )}
    </section>
  );
}
