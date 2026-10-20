"use client";

import type { ReactNode } from "react";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import type { GrupoMenu } from "@/lib/modulos/registro";

/** Claves `capability` (catálogo 097) del menú, sin repetir: una sola petición de lote. */
export function capacidadesDe(grupos: GrupoMenu[]): string[] {
  return Array.from(new Set(grupos.flatMap((g) => g.items.map((i) => i.capability).filter((c): c is string => !!c))));
}

type Lote = { isError?: boolean; error?: unknown; isPending?: boolean; isLoading?: boolean; data?: { results?: Record<string, { allowed?: boolean } | undefined> } };

/** Misma regla que isAccessQueryFailClosed (components/dealer/CoreNavigation): error, en vuelo o sin results = cerrado. */
function cerrado(q: Lote): boolean {
  return Boolean(q.error || q.isError || q.isPending || q.isLoading || !q.data || q.data.results == null || typeof q.data.results !== "object");
}

/**
 * Filtra el menú por el lote de acceso, como hacía la carcasa del dealer: sin permiso explícito no se pinta
 * (fail-closed) y los items sin capability siempre pasan. Solo se monta si el menú tiene capabilities: los
 * módulos sin ellas no piden nada.
 */
export function ConCapacidades({ claves, grupos, children }: { claves: string[]; grupos: GrupoMenu[]; children: (grupos: GrupoMenu[]) => ReactNode }) {
  const q = useAccessEntitlementsBatch(claves) as Lote;
  const permite = (c: string | null | undefined) => !c || (!cerrado(q) && q.data?.results?.[c]?.allowed === true);
  const filtrados = grupos.map((g) => ({ ...g, items: g.items.filter((i) => permite(i.capability)) })).filter((g) => g.items.length > 0);
  return <>{children(filtrados)}</>;
}
