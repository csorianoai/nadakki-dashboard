"use client";

import { useLegalCases } from "@/hooks/legal/useLegalCases";

/**
 * Elegir el expediente por título y número (QA 23-nov-2026: los formularios de
 * audiencias pedían escribir el «case_id», un UUID que el abogado no conoce).
 */
export function SelectorExpediente({
  tenantId,
  value,
  onChange,
  id,
  className,
  disabled,
  etiquetaVacia = "— Sin expediente —",
}: {
  tenantId: string | undefined;
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  etiquetaVacia?: string;
}) {
  const { data, isLoading } = useLegalCases(tenantId, {});
  const casos = data?.cases ?? [];
  return (
    <select id={id} className={className} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      <option value="">{isLoading ? "Cargando expedientes…" : etiquetaVacia}</option>
      {casos.map((c) => (
        <option key={c.case_id} value={c.case_id}>
          {c.title} · {c.case_number_internal}
        </option>
      ))}
      {value && !casos.some((c) => c.case_id === value) ? <option value={value}>{value}</option> : null}
    </select>
  );
}
