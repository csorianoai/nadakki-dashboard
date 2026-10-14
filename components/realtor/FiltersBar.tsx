import { COUNTRIES, PLACES, placeLabel } from "@/lib/realtor/demo-data";
import { FONT_DISPLAY, RT } from "@/lib/realtor/tokens";
import type { OperationType, RadarFilters } from "@/lib/realtor/types";

interface Props {
  value: RadarFilters;
  onChange: (next: RadarFilters) => void;
}

const OPERATIONS: { id: OperationType; label: string }[] = [
  { id: "alquiler", label: "Alquiler" },
  { id: "venta", label: "Venta" },
];

const selectStyle = {
  minHeight: 44, width: "100%", padding: "0 12px", borderRadius: 8, border: `1px solid ${RT.lineStrong}`,
  background: RT.white, color: RT.ink, fontFamily: "inherit", fontSize: 16,
} as const;
const labelStyle = { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700, color: RT.ink } as const;

/** Tarjeta de filtros de DL10A: País, «Región · ciudad · zona» y el conmutador Alquiler/Venta. Solo geografía y operación. */
export function FiltersBar({ value, onChange }: Props) {
  const places = PLACES[value.country] ?? [];
  const current = places.findIndex((p) => p.city === value.city && p.zone === value.zone && p.region === value.region);
  const setCountry = (country: string) => {
    const first = PLACES[country]?.[0];
    onChange({ ...value, country, ...(first ?? {}) });
  };
  const setPlace = (i: number) => {
    const p = places[i];
    if (p) onChange({ ...value, region: p.region, city: p.city, zone: p.zone, postalCode: p.postalCode });
  };
  return (
    <form aria-label="Filtros del radar" data-testid="radar-filters" onSubmit={(e) => e.preventDefault()}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16, background: RT.white, border: `1px solid ${RT.line}`, borderRadius: 12, padding: "18px" }}>
      <label style={{ ...labelStyle, flex: "1 1 240px", maxWidth: 314 }}>
        País
        <select value={value.country} onChange={(e) => setCountry(e.target.value)} style={selectStyle}>
          {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </label>
      <label style={{ ...labelStyle, flex: "2 1 320px" }}>
        Región · ciudad · zona
        <select value={current} onChange={(e) => setPlace(Number(e.target.value))} style={selectStyle}>
          {current < 0 ? <option value={-1}>{placeLabel(value)}</option> : null}
          {places.map((p, i) => (<option key={placeLabel(p)} value={i}>{placeLabel(p)}</option>))}
        </select>
      </label>
      <div role="group" aria-label="Operación" data-testid="operation-toggle" style={{ display: "flex", gap: 8 }}>
        {OPERATIONS.map((o) => {
          const on = value.operation === o.id;
          return (
            <button key={o.id} type="button" data-testid={`op-${o.id}`} aria-pressed={on} onClick={() => onChange({ ...value, operation: o.id })}
              style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 700,
                border: `1px solid ${on ? RT.ink : RT.lineStrong}`, background: on ? RT.ink : RT.white, color: on ? RT.white : RT.ink }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </form>
  );
}
