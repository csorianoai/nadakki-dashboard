"use client";

import type { CaseType } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";

const TYPES: CaseType[] = [
  "defensa_civil_cobro_pesos",
  "recurso_apelacion_civil",
  "caso_penal_imputado",
  "caso_penal_victima_querellante",
  "caso_penal_evaluacion_general",
];

export function CaseTypeSelector({
  value,
  onChange,
}: {
  value: CaseType;
  onChange: (t: CaseType) => void;
}) {
  const m = useLegalCasesMessages();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-zinc-300">Tipo de expediente</legend>
      {TYPES.map((t) => (
        <label
          key={t}
          className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-800/50 p-3 transition-colors has-[:checked]:border-violet-500/50 has-[:checked]:bg-violet-950/20"
        >
          <input type="radio" name="case_type" value={t} checked={value === t} onChange={() => onChange(t)} />
          <span className="text-sm text-zinc-200">{m.case_types[t]}</span>
        </label>
      ))}
    </fieldset>
  );
}
