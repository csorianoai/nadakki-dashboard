"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BandejaV2 } from "@/components/credit-hub/bank-v2/bandeja/BandejaV2";
import { DccEstado } from "@/components/dcc/DccEstado";
import { useAuth } from "@/hooks/useAuth";
import { useMarcaBanco } from "../BancoV2Shell";

/** Bandeja del banco (bank-v2). Busqueda y pagina viven en la URL, como en la actual. */
function BandejaPagina() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user } = useAuth();
  const marca = useMarcaBanco();
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);
  const onParams = useCallback(
    (nq: string, np: number) => {
      const p = new URLSearchParams();
      if (nq.trim()) p.set("q", nq.trim());
      if (np > 1) p.set("page", String(np));
      router.replace(p.toString() ? `${pathname}?${p.toString()}` : pathname);
    },
    [pathname, router],
  );
  return (
    <BandejaV2
      marca={marca}
      q={q}
      page={page}
      onParams={onParams}
      hrefSolicitud={(id) => `/credit-hub/bank/applications/${encodeURIComponent(id)}`}
      analistaId={user?.id ?? "unknown"}
    />
  );
}

export default function BandejaV2Page() {
  return (
    <Suspense fallback={<DccEstado estado="cargando" />}>
      <BandejaPagina />
    </Suspense>
  );
}
