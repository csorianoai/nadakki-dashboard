"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { EvidenceCard } from "@/components/forge/ui/EvidenceCard";
import { RealtorNotice } from "@/components/realtor/RealtorNotice";
import { SignalCard } from "@/components/realtor/SignalCard";
import { SignalDetail } from "@/components/realtor/SignalDetail";
import { useRealtorAccessInfo } from "@/components/realtor/useRealtorAccess";
import { leerSenales, type Consulta, type Leida, type MarketSignal } from "@/lib/marketing/signals/api";
import { aRadarSignal, camposVisibles, DEMO_SIGNAL } from "@/lib/marketing/signals/view";
import { DEMO_BANNER } from "@/lib/realtor/copy";
import { propertyIntelHref } from "./propertyIntelHref";

const AVISO = {
  session_expired: "Tu sesión expiró. Vuelve a iniciar sesión.",
  hidden: "Las señales de mercado no están disponibles para tu organización.",
  service_unavailable: "El servicio de señales no está disponible por ahora. Inténtalo de nuevo en unos minutos.",
  error: "No se pudieron cargar las señales.",
  contract_violation: "La respuesta del servicio no es válida. No se muestran señales.",
} as const;

type Estado = { fase: "idle" } | { fase: "cargando" } | { fase: "listo"; lectura: Leida };

export function SignalsCenter() {
  const { state: access, demoActive } = useRealtorAccessInfo();
  const [tipo, setTipo] = useState<"keyword" | "interes" | "dominio">("keyword");
  const [texto, setTexto] = useState("");
  const [country, setCountry] = useState("US");
  const [estado, setEstado] = useState<Estado>({ fase: "idle" });
  const [activa, setActiva] = useState<string | null>(null);

  if (access !== "ok") return <RealtorNotice reason={access} />;

  async function buscar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    const c: Consulta = tipo === "dominio" ? { tipo, domain: t } : { tipo, keyword: t, country: country.trim().toUpperCase() };
    setEstado({ fase: "cargando" });
    setActiva(null);
    setEstado({ fase: "listo", lectura: await leerSenales(c) });
  }

  const lectura = estado.fase === "listo" ? estado.lectura : null;
  const senales: MarketSignal[] = lectura?.estado === "ok" ? lectura.lote.data : [];
  const sel = senales.find((s) => s.signal_id === activa) ?? senales[0];
  // DEMO solo con /acceso demo=true y ALLOW_DEMO=1 (demoActive, PS-10: un tenant real nunca ve demo), y solo si no se
  // hizo ninguna llamada al backend (demo nunca sustituye a una respuesta).
  const piHref = sel ? propertyIntelHref(sel.values) : null;
  const demo = estado.fase === "idle" && demoActive;

  return (
    <section data-testid="signals-center" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "28px 40px 40px" }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Señales de mercado</h1>
      <form onSubmit={buscar} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select aria-label="Tipo de consulta" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
          <option value="keyword">Palabra clave</option>
          <option value="interes">Interés relativo</option>
          <option value="dominio">Dominio</option>
        </select>
        <input aria-label={tipo === "dominio" ? "Dominio" : "Palabra clave"} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={253} />
        {tipo !== "dominio" ? <input aria-label="País (ISO)" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={2} size={3} /> : null}
        <button type="submit" disabled={estado.fase === "cargando"}>Buscar</button>
      </form>
      {estado.fase === "cargando" ? <p role="status" data-testid="signals-loading">Cargando señales…</p> : null}
      {lectura && lectura.estado !== "ok" ? (
        <p role="status" data-testid="signals-notice" data-state={lectura.estado}>{AVISO[lectura.estado]}</p>
      ) : null}
      {lectura?.estado === "ok" && senales.length === 0 ? <p role="status" data-testid="signals-empty">Sin señales para esta consulta.</p> : null}
      {demo ? (
        <>
          <p role="note" data-testid="demo-banner">{DEMO_BANNER}</p>
          <SignalCard signal={DEMO_SIGNAL} />
        </>
      ) : null}
      {sel ? (
        <>
          <SignalDetail signal={aRadarSignal(sel)} operation="venta" />
          <EvidenceCard
            title="Procedencia"
            sourceLabel={sel.provenance.source}
            confidence={sel.provenance.confidence === "high" || sel.provenance.confidence === "medium" || sel.provenance.confidence === "low" ? sel.provenance.confidence : undefined}
            body={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>Evidencia: {sel.evidence_tier}</li>
                <li>Observada: {sel.observed_at.slice(0, 10)}</li>
                {sel.data_status === "HISTORICAL" ? <li>Dato pasado, no actual.</li> : null}
                {camposVisibles(sel).map(([k, v]) => (<li key={k}>{k}: {v}</li>))}
              </ul>
            }
          />
          {piHref ? <Link data-testid="pi-link" href={piHref}>Ver inteligencia de la propiedad</Link> : null}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {senales.map((s) => (
              <button key={s.signal_id} type="button" data-testid="signal-pick" onClick={() => setActiva(s.signal_id)}
                style={{ all: "unset", cursor: "pointer" }}>
                <SignalCard signal={aRadarSignal(s)} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
