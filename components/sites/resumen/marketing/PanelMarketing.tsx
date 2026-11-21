"use client";

import React, { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { pick, type Lang } from "@/lib/sites/copy-util";
import { cargarAds, cargarContactos, ENLACES, MKT, type Ads, type Contactos } from "@/lib/sites/marketing";
import { SIZE, ST } from "@/lib/sites/tokens";

type Estado<T> = { k: "cargando" } | { k: "ok"; v: T } | { k: "error" };

/** Cada fuente carga y falla por separado: un error de Ads no tumba Contactos. */
function useFuente<T>(cargar: (() => Promise<T>) | null, deps: unknown[]): Estado<T> {
  const [e, setE] = useState<Estado<T>>({ k: "cargando" });
  useEffect(() => {
    if (!cargar) return;
    let vivo = true;
    setE({ k: "cargando" });
    cargar().then((v) => vivo && setE({ k: "ok", v }), () => vivo && setE({ k: "error" }));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return e;
}

const loc = (lang: Lang) => (lang === "en" ? "en-US" : "es-DO");
const entero = (n: number, lang: Lang) => n.toLocaleString(loc(lang));
function dinero(micros: number, moneda: string | null, lang: Lang): string | null {
  if (!moneda) return null;
  try { return new Intl.NumberFormat(loc(lang), { style: "currency", currency: moneda }).format(micros / 1_000_000); }
  catch { return null; }
}

const tarjeta: React.CSSProperties = { background: ST.white, border: `1px solid ${ST.line}`, borderRadius: SIZE.radius, padding: SIZE.gap, display: "grid", gap: 8, alignContent: "start" };
const enlace: React.CSSProperties = { color: ST.teal, fontWeight: 700 };

function Dato({ testid, label, valor }: { testid: string; label: string; valor: React.ReactNode }) {
  return (
    <div data-testid={testid}>
      <div style={{ color: ST.muted, fontSize: SIZE.fontSmall }}>{label}</div>
      <div style={{ fontSize: SIZE.fontSub, fontWeight: 600 }}>{valor}</div>
    </div>
  );
}

export function PanelMarketing({ siteId, lang, demo }: { siteId: string; lang: Lang; demo: boolean }) {
  const t = (k: string) => pick(MKT[k], lang);
  const { tenantId } = useTenant();
  const contactos = useFuente<Contactos>(demo ? null : () => cargarContactos(siteId), [siteId, demo]);
  const ads = useFuente<Ads>(demo ? null : () => cargarAds(tenantId), [tenantId, demo]);

  return (
    <section data-testid="panel-marketing" aria-labelledby="mkt-titulo" style={{ display: "grid", gap: SIZE.gap }}>
      <h2 id="mkt-titulo" style={{ margin: 0, fontSize: SIZE.fontSub }}>{t("title")}</h2>
      {demo && <p data-testid="mkt-demo" style={{ margin: 0, color: ST.muted }}>{t("demo")}</p>}
      <div style={{ display: "grid", gap: SIZE.gap, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div data-testid="mkt-contactos" style={tarjeta}>
          <h3 style={{ margin: 0, fontSize: SIZE.fontBase }}>{t("contactsTitle")}</h3>
          {!demo && contactos.k === "cargando" && <p role="status" style={{ margin: 0 }}>{t("loading")}</p>}
          {contactos.k === "error" && <p data-testid="mkt-contactos-error" style={{ margin: 0, color: ST.badText }}>{t("contactsError")}</p>}
          {contactos.k === "ok" && (
            <>
              <Dato testid="mkt-contactos-total" label={t("contactsTotal")} valor={<>{entero(contactos.v.total, lang)}{!contactos.v.completo && ` ${t("contactsMore")}`}</>} />
              <Dato testid="mkt-contactos-7" label={t("contacts7")} valor={entero(contactos.v.d7, lang)} />
              <Dato testid="mkt-contactos-30" label={t("contacts30")} valor={entero(contactos.v.d30, lang)} />
            </>
          )}
          <a className="sx-focus" style={enlace} href={`${ENLACES.contactos}?sitio=${encodeURIComponent(siteId)}`}>{t("contactsLink")}</a>
        </div>

        <div data-testid="mkt-ads" style={tarjeta}>
          <h3 style={{ margin: 0, fontSize: SIZE.fontBase }}>{t("adsTitle")}</h3>
          {!demo && ads.k === "cargando" && <p role="status" style={{ margin: 0 }}>{t("loading")}</p>}
          {ads.k === "error" && <p data-testid="mkt-ads-error" style={{ margin: 0, color: ST.badText }}>{t("adsError")}</p>}
          {ads.k === "ok" && ads.v.k === "sin-tenant" && <p style={{ margin: 0 }}>{t("adsNoTenant")}</p>}
          {ads.k === "ok" && ads.v.k === "sin-conexion" && (
            <div data-testid="mkt-ads-conectar" style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: 0 }}>{t("adsConnect")}</p>
              <a className="sx-focus" style={enlace} href={ENLACES.conectar}>{t("adsConnectLink")}</a>
            </div>
          )}
          {ads.k === "ok" && ads.v.k === "elegir-cuenta" && <p data-testid="mkt-ads-elegir" style={{ margin: 0 }}>{t("adsPick")}</p>}
          {ads.k === "ok" && ads.v.k === "ok" && (
            <>
              <Dato testid="mkt-ads-gasto" label={t("adsSpend")} valor={dinero(ads.v.t.cost_micros, ads.v.t.moneda, lang) ?? "—"} />
              <Dato testid="mkt-ads-clics" label={t("adsClicks")} valor={entero(ads.v.t.clicks, lang)} />
              <Dato testid="mkt-ads-impresiones" label={t("adsImpr")} valor={entero(ads.v.t.impressions, lang)} />
              <Dato testid="mkt-ads-conversiones" label={t("adsConv")} valor={entero(ads.v.t.conversions, lang)} />
            </>
          )}
          <a className="sx-focus" style={enlace} href={ENLACES.googleAds}>{t("adsLink")}</a>
        </div>

        <div data-testid="mkt-ga4" style={tarjeta}>
          <h3 style={{ margin: 0, fontSize: SIZE.fontBase }}>{t("gaTitle")}</h3>
          <p style={{ margin: 0 }}>{t("gaBody")}</p>
          <a className="sx-focus" style={enlace} href={ENLACES.analytics} target="_blank" rel="noopener noreferrer">{t("gaLink")}</a>
        </div>
      </div>
    </section>
  );
}
