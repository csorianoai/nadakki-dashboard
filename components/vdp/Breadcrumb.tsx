"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function VdpBreadcrumb({
  tipo,
  provincia,
}: {
  tipo: string;
  provincia: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-nk-fg-muted transition hover:text-brand"
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        Volver a resultados · {tipo} · {provincia}
      </span>
    </button>
  );
}
