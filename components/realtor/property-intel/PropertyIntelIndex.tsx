"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import { UUID } from "./entrada";

type Lang = "es" | "en";
const COPY: Record<Lang, { title: string; intro: string; label: string; hint: string; find: string; findUnit: string; bad: string; lang: string }> = {
  es: {
    title: "Inteligencia de propiedad",
    intro: "Abre una propiedad desde una señal de mercado o desde la ficha de la propiedad, o pega aquí su identificador.",
    label: "Identificador de la propiedad o unidad", hint: "Son 36 caracteres, por ejemplo 0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f.",
    find: "Buscar propiedad", findUnit: "Buscar unidad", bad: "Identificador no válido", lang: "Idioma de la pantalla",
  },
  en: {
    title: "Property intelligence",
    intro: "Open a property from a market signal or from its property record, or paste its ID here.",
    label: "Property or unit ID", hint: "It has 36 characters, for example 0b9f6d3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f.",
    find: "Find property", findUnit: "Find unit", bad: "Invalid ID", lang: "Screen language",
  },
};

const FIELD: CSSProperties = {
  width: "100%", maxWidth: 460, minHeight: 44, borderRadius: 8, border: `1px solid ${RT.control}`, background: RT.white, color: RT.ink,
  fontFamily: "inherit", fontSize: 16, padding: "0 12px",
};
const BTN: CSSProperties = { minHeight: 44, padding: "0 18px", borderRadius: 8, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" };
const PRIMARY: CSSProperties = { ...BTN, border: `1px solid ${RT.ink}`, background: RT.ink, color: RT.white };
const SECONDARY: CSSProperties = { ...BTN, border: `1px solid ${RT.control}`, background: RT.white, color: RT.ink };

/** Entrada a PI-D2. No lista propiedades: el listado del tenant (C-RE-OLA2) devuelve ids de listing, no de propiedad. */
export function PropertyIntelIndex() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("es");
  const [id, setId] = useState("");
  const [bad, setBad] = useState(false);
  const t = COPY[lang];

  function ir(unit: boolean) {
    const v = id.trim();
    if (!UUID.test(v)) { setBad(true); return; }
    setBad(false);
    router.push(unit ? `/realtor/property-intel/${v}?unit=${v}` : `/realtor/property-intel/${v}`);
  }

  return (
    <section data-testid="pi-index" lang={lang} style={{ display: "flex", flexDirection: "column", gap: 16, padding: "28px 40px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700 }}>{t.title}</h1>
        <div role="group" aria-label={t.lang} style={{ display: "flex", gap: 6 }}>
          {(["es", "en"] as const).map((l) => (
            <button key={l} type="button" data-testid={`lang-${l}`} aria-pressed={lang === l} onClick={() => setLang(l)}
              style={{ ...BTN, minHeight: 40, padding: "0 14px", borderRadius: 999, border: `1px solid ${lang === l ? RT.ink : RT.control}`,
                background: lang === l ? RT.ink : RT.white, color: lang === l ? RT.white : RT.ink }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <p style={{ margin: 0, maxWidth: 780, fontSize: 16, color: RT.muted }}>{t.intro}</p>
      <form data-testid="pi-form" noValidate onSubmit={(e: FormEvent) => { e.preventDefault(); ir(false); }}
        style={{ display: "flex", flexDirection: "column", gap: 8, background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: 22, maxWidth: 760 }}>
        <label htmlFor="pi-id" style={{ fontSize: 14, fontWeight: 700 }}>{t.label}</label>
        <input id="pi-id" value={id} onChange={(e) => setId(e.target.value)} maxLength={36} autoComplete="off" spellCheck={false}
          aria-invalid={bad ? "true" : undefined} aria-describedby={bad ? "pi-id-hint pi-id-error" : "pi-id-hint"} style={FIELD} />
        <p id="pi-id-hint" style={{ margin: 0, fontSize: 13, color: RT.muted }}>{t.hint}</p>
        {bad ? <p id="pi-id-error" role="alert" data-testid="pi-bad-id" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: RT.chipDownText }}>{t.bad}</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
          <button type="submit" style={PRIMARY}>{t.find}</button>
          <button type="button" onClick={() => ir(true)} style={SECONDARY}>{t.findUnit}</button>
        </div>
      </form>
    </section>
  );
}
