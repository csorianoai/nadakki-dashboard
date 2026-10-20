"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchPiProperties, type PiProperty } from "@/lib/realtor/property-intel/properties";
import type { Section } from "@/lib/realtor/property-intel/types";
import { UUID } from "./entrada";

const TYPE_LABEL: Record<string, string> = {
  apartment: "Apartamento", condo: "Condominio", house: "Casa", townhouse: "Townhouse", land: "Terreno", commercial: "Comercial", other: "Otro",
};
const MSG: Record<string, string> = {
  session_expired: "Tu sesión terminó. Vuelve a entrar.", hidden: "Este panel no tiene acceso a las propiedades.",
  service_unavailable: "Servicio no disponible por ahora.", error: "No se pudo leer la lista de propiedades.",
};

/** Índice de PI-D2: las propiedades del tenant (C-RE-OLA2) con enlace a su ficha, y el buscador por identificador. */
export function PropertyIntelIndex() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [bad, setBad] = useState(false);
  const [list, setList] = useState<Section<PiProperty[]>>({ state: "loading" });

  useEffect(() => {
    let vivo = true;
    void fetchPiProperties().then((s) => { if (vivo) setList(s); });
    return () => { vivo = false; };
  }, []);

  function ir(unit: boolean) {
    const v = id.trim();
    if (!UUID.test(v)) { setBad(true); return; }
    setBad(false);
    router.push(unit ? `/realtor/property-intel/${v}?unit=${v}` : `/realtor/property-intel/${v}`);
  }

  return (
    <section data-testid="pi-index" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "28px 40px 40px" }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Inteligencia de propiedad</h1>
      <h2 style={{ margin: 0, fontSize: 18 }}>Propiedades</h2>
      {list.state === "loading" ? <p role="status">Cargando…</p>
        : list.state !== "ok" ? <p role="status" data-testid="pi-index-msg" data-state={list.state}>{MSG[list.state]}</p>
        : list.data.length === 0 ? <p data-testid="pi-index-empty">No hay propiedades registradas todavía.</p>
        : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {list.data.map((p) => (
              <li key={p.id} data-testid="pi-index-row" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
                <strong>{p.address}</strong>
                <span>{TYPE_LABEL[p.type] ?? p.type} · {p.units} {p.units === 1 ? "unidad" : "unidades"}</span>
                <Link href={`/realtor/property-intel/${p.id}`} aria-label={`Abrir ficha de ${p.address}`}>Abrir ficha</Link>
              </li>
            ))}
          </ul>
        )}
      <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Abrir por identificador</h2>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); ir(false); }} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input aria-label="Identificador" value={id} onChange={(e) => setId(e.target.value)} maxLength={36} size={40} />
        <button type="button" onClick={() => ir(false)}>Buscar propiedad</button>
        <button type="button" onClick={() => ir(true)}>Buscar unidad</button>
      </form>
      {bad ? <p role="alert" data-testid="pi-bad-id">Identificador no válido</p> : null}
    </section>
  );
}
