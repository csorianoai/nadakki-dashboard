"use client";

/**
 * Estado de la facturacion electronica del tenant.
 *
 * Un tenant argentino recibe 409 AR_NOT_CONFIGURED en toda la superficie
 * /api/v1/contable/fiscal (backend #1497). Eso no es un fallo: la facturacion
 * electronica de AR se emite en ARCA, fuera de esta plataforma. Se pinta como
 * informacion, con `role="note"`, y sin filtrar el codigo ni el 409.
 *
 * Lo que SI es un fallo --tenant sin pais fiscal, pais sin paquete, o cualquier
 * otro error-- se pinta con `role="alert"` y su codigo, porque ahi si hay algo
 * que arreglar.
 *
 * Con el paquete RD operativo no se pinta nada: el aviso solo aparece cuando hay
 * algo que decir.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchEstadoFiscal } from "@/lib/contable/fiscal-dispatch";
import { useContableTenantId } from "@/components/contable/useContableTenantId";

const BASE = "mb-4 rounded-xl border p-4 text-sm";

export function FacturacionElectronicaAviso() {
  const tenantId = useContableTenantId();
  const query = useQuery({
    queryKey: ["contable-estado-fiscal", tenantId ?? "none"],
    queryFn: () => fetchEstadoFiscal(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const estado = query.data;
  if (!estado || estado.tipo === "rd") return null;

  if (estado.tipo === "arca") {
    return (
      <section
        role="note"
        data-testid="facturacion-arca"
        data-informativo="true"
        className={`${BASE} border-sky-500/30 bg-sky-500/10 text-sky-100`}
      >
        <p className="font-semibold">{estado.titulo}</p>
        <p className="mt-1 text-sky-200/90">{estado.detalle}</p>
      </section>
    );
  }

  const copia =
    estado.tipo === "sin_pais"
      ? "El tenant no tiene país fiscal configurado, así que la facturación electrónica no se puede resolver. Esto sí hay que configurarlo."
      : estado.tipo === "pais_sin_paquete"
        ? `Todavía no hay paquete fiscal para ${estado.pais ?? "este país"}.`
        : "No se pudo leer el estado de la facturación electrónica.";

  return (
    <section
      role="alert"
      data-testid="facturacion-problema"
      data-informativo="false"
      data-codigo={estado.codigo}
      className={`${BASE} border-amber-500/30 bg-amber-500/10 text-amber-100`}
    >
      <p className="font-semibold">Facturación electrónica</p>
      <p className="mt-1">{copia}</p>
      <p className="mt-2 text-xs text-amber-200/80">
        código: <code>{estado.codigo}</code>
      </p>
    </section>
  );
}
