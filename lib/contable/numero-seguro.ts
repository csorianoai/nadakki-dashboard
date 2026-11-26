/** Render unknown values honestly; never coerce strings or null into a reported figure. */
export function numeroFijo(value: unknown, digits = 1, suffix = ""): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : "—";
}
