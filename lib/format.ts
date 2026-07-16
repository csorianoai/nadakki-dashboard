/** Currency formatters — README §6.2 */

import { DOP } from "@/lib/finance";

export function fmtRD(n: number): string {
  return `RD$ ${Math.round(n).toLocaleString("en-US")}`;
}

export function fmtUS(n: number): string {
  return `US$ ${Math.round(n / DOP).toLocaleString("en-US")}`;
}

export function fmtKm(n: number): string {
  return `${Math.round(n).toLocaleString("en-US")} km`;
}
