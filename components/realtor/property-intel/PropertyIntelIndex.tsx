"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UUID } from "./entrada";

/** Entrada a PI-D2. No lista propiedades: el listado del tenant (C-RE-OLA2) devuelve ids de listing, no de propiedad. */
export function PropertyIntelIndex() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [bad, setBad] = useState(false);

  function ir(unit: boolean) {
    const v = id.trim();
    if (!UUID.test(v)) { setBad(true); return; }
    setBad(false);
    router.push(unit ? `/realtor/property-intel/${v}?unit=${v}` : `/realtor/property-intel/${v}`);
  }

  return (
    <section data-testid="pi-index" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "28px 40px 40px" }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Inteligencia de propiedad</h1>
      <p>Abre una propiedad desde una señal de mercado o desde la ficha de la propiedad, o pega aquí su identificador.</p>
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); ir(false); }} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input aria-label="Identificador" value={id} onChange={(e) => setId(e.target.value)} maxLength={36} size={40} />
        <button type="button" onClick={() => ir(false)}>Buscar propiedad</button>
        <button type="button" onClick={() => ir(true)}>Buscar unidad</button>
      </form>
      {bad ? <p role="alert" data-testid="pi-bad-id">Identificador no válido</p> : null}
    </section>
  );
}
