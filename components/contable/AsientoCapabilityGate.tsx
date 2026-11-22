"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useContableAsientoAllowed } from "@/lib/contable/capacidad";

export function AsientoCapabilityGate({ children }: { children: ReactNode }) {
  const allowed = useContableAsientoAllowed();
  if (!allowed) {
    return (
      <div role="alert" className="rounded-lg border border-white/10 p-6 text-sm text-zinc-300">
        <p>No tienes permiso para crear asientos contables.</p>
        <Link href="/contable/resumen" className="mt-2 inline-block underline">
          Volver al resumen
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
