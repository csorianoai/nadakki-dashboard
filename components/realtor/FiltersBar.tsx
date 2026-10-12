import { CITIES, COUNTRIES, POSTAL_CODES, REGIONS, ZONES } from "@/lib/realtor/demo-data";
import type { OperationType, RadarFilters } from "@/lib/realtor/types";

interface Props {
  value: RadarFilters;
  onChange: (next: RadarFilters) => void;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col text-sm">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border px-2 py-1">
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </label>
  );
}

export function FiltersBar({ value, onChange }: Props) {
  const set = (patch: Partial<RadarFilters>) => onChange({ ...value, ...patch });
  const regions = REGIONS[value.country] ?? [value.region];
  const cities = CITIES[value.region] ?? [value.city];
  const zones = ZONES[value.city] ?? [value.zone];
  const postals = POSTAL_CODES[value.city] ?? [value.postalCode];
  return (
    <form aria-label="Filtros del radar" className="grid grid-cols-2 gap-3 md:grid-cols-6" onSubmit={(e) => e.preventDefault()}>
      <Select label="País" value={value.country} options={COUNTRIES} onChange={(country) => set({ country })} />
      <Select label="Región" value={value.region} options={regions} onChange={(region) => set({ region })} />
      <Select label="Ciudad" value={value.city} options={cities} onChange={(city) => set({ city })} />
      <Select label="Zona" value={value.zone} options={zones} onChange={(zone) => set({ zone })} />
      <Select label="Código postal" value={value.postalCode} options={postals} onChange={(postalCode) => set({ postalCode })} />
      <Select
        label="Operación"
        value={value.operation}
        options={["alquiler", "venta"]}
        onChange={(operation) => set({ operation: operation as OperationType })}
      />
    </form>
  );
}
