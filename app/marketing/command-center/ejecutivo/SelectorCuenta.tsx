"use client";

import { useId } from "react";
import type { CuentaInsights } from "./contrato";
import { cn } from "@/lib/utils";

export interface SelectorCuentaProps {
  cuentas: CuentaInsights[];
  /** null = todas (suma). */
  valor: string | null;
  onChange: (customerId: string | null) => void;
  /** true: no hay opcion «Todas» y no se muestra nada hasta elegir (monedas distintas o desconocidas, sin total). */
  obligatorio?: boolean;
  className?: string;
}

/** Selector de cuenta de Google Ads: <select> nativo (accesible por teclado y lector de pantalla), objetivo tactil de 44 px. */
export function SelectorCuenta({ cuentas, valor, onChange, obligatorio = false, className }: SelectorCuentaProps) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-[12px] font-medium kit-txt-2">
        {obligatorio ? "Cuenta de Google Ads (obligatoria)" : "Cuenta de Google Ads"}
      </label>
      <select
        id={id}
        data-testid="selector-cuenta"
        value={valor ?? ""}
        required={obligatorio}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        className="kit-foco kit-ctl min-h-[44px] min-w-0 rounded-[10px] border px-3 text-[13px]"
      >
        {obligatorio ? (
          <option value="" disabled>
            Elige una cuenta…
          </option>
        ) : (
          <option value="">Todas las cuentas (suma)</option>
        )}
        {cuentas.map((c) => (
          <option key={c.customer_id} value={c.customer_id}>
            {`${c.label}${c.currency ? ` · ${c.currency}` : " · moneda no confirmada"}`}
          </option>
        ))}
      </select>
    </div>
  );
}
