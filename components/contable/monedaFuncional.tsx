"use client";

/**
 * Moneda funcional de la contabilidad.
 *
 * Los reportes contables --mayor y balance-- devuelven importes "base", ya
 * convertidos a la moneda funcional del tenant, pero el contrato no publica
 * CUAL es: `LibroMayorReport` y `BalanceComprobacionReport` no traen campo de
 * moneda. Las pantallas lo tapaban con `toFixed(2)` y
 * `toLocaleString("es-DO")`: numeros sin moneda, con agrupacion dominicana, en
 * un tenant argentino.
 *
 * Asi que la moneda sale del branding del tenant, igual que en el resto del
 * panel (`localeDeTenant`, #517), y si no esta se dice: un importe contable sin
 * moneda declarada no se publica con una inventada.
 */

import { localeDeTenant, type LocaleTenant } from "@/lib/dealer-management/formato";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";

export const SIN_MONEDA_FUNCIONAL =
  "Todavía no se configuró la moneda de tu concesionaria, por eso no mostramos los importes. Pedile a quien administra tu cuenta que la cargue.";

/**
 * El codigo que `formateaMoneda` LANZA cuando no hay moneda
 * (lib/dealer-management/formato.ts:33). Aqui no se lanza --una pantalla contable
 * que revienta es peor que una sin importes-- pero se PUBLICA, para que el aviso
 * se pueda buscar en los logs y en el contrato y no sea solo una frase amable.
 *
 * Se declara aca y no se importa porque en formato.ts es un literal dentro del
 * `throw`, no una constante exportada, y ese fichero no es de este packet.
 */
export const TENANT_CURRENCY_NOT_CONFIGURED = "TENANT_CURRENCY_NOT_CONFIGURED";

export function useMonedaFuncional(): LocaleTenant {
  const branding = useTenantBranding();
  return localeDeTenant(branding.data);
}

/** Importe contable con dos decimales y la moneda del tenant. Sin moneda, em dash. */
export function formateaImporteContable(valor: number | null | undefined, locale: LocaleTenant): string {
  if (valor == null || !Number.isFinite(valor)) return "—";
  if (!locale.currency) return "—";
  return new Intl.NumberFormat(locale.locale, {
    style: "currency",
    currency: locale.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/** Cabecera: deja dicho en que moneda esta todo lo que sigue, o que falta. */
export function MonedaFuncionalNota({ locale }: { locale: LocaleTenant }) {
  if (!locale.currency) {
    return (
      <p
        role="alert"
        data-testid="contable-sin-moneda"
        data-reason-code={TENANT_CURRENCY_NOT_CONFIGURED}
        className="mb-3 text-sm text-amber-300"
      >
        {SIN_MONEDA_FUNCIONAL}
        <details className="mt-1 text-xs text-zinc-400">
          <summary className="cursor-pointer">Detalle técnico</summary>
          <code data-testid="contable-sin-moneda-codigo">{TENANT_CURRENCY_NOT_CONFIGURED}</code>
        </details>
      </p>
    );
  }
  return (
    <p data-testid="contable-moneda-funcional" className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
      Moneda funcional: {locale.currency}
    </p>
  );
}
