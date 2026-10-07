/**
 * Panel nuevo del banco (/credit-hub/bank-v2) como destino por defecto.
 *
 * Default OFF: con la variable vacia o ausente NADA cambia para nadie. Para
 * encenderlo: NEXT_PUBLIC_FF_BANK_V2_DEFAULT=1|true|on. Es NEXT_PUBLIC_, asi que
 * Next la incrusta al compilar: cambiarla pide reconstruir (redeploy del mismo
 * commit), no tocar codigo.
 */
export function isBankV2DefaultEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_FF_BANK_V2_DEFAULT ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}
