"use client";

/**
 * "Cargar este auto": los pasos del ciclo en la ficha (pedido de Cesar, 26-nov). Usa las MISMAS claves de cache que
 * las secciones de la ficha, asi que no agrega peticiones y se actualiza cuando una seccion guarda e invalida.
 */
import { useQuery } from "@tanstack/react-query";
import { getAccessClientContext } from "@/lib/access/client";
import type { DealerVehicleStatusRow } from "@/lib/dealer/vehicle-status";
import { fetchVehicleDays } from "@/lib/dealer/vehicle-economics";
import { PasosDeTarea } from "@/lib/dealer/pasos-tarea";
import { pasosCargaAuto } from "@/lib/dealer/pasos-vehiculo";
import { fetchVehiclePhotos } from "./fotos";
import { fetchCompra } from "./vehicle-purchase-read";
import { SIN_REUTILIZAR, useIdentidadCache } from "./ficha-interna";

/** La guia se cuenta solo con TODAS sus lecturas terminadas (con exito o con error): asi el total no cambia por carga. */
export function guiaLista(e: {
  /** false mientras el plan (fotos, costos) se relee: de el depende si Fotos cuenta y si se lee la compra. */
  accesoListo?: boolean;
  tenantId: string;
  daysPending: boolean;
  costsView: boolean;
  compraPending: boolean;
  photosAllowed: boolean;
  fotosPending: boolean;
}): boolean {
  if (e.accesoListo === false) return false;
  if (!e.tenantId || e.daysPending) return false;
  if (e.costsView && e.compraPending) return false;
  if (e.photosAllowed && e.fotosPending) return false;
  return true;
}

export function CicloDelAuto({
  ficha,
  photosAllowed,
  costsView,
  accesoListo = true,
}: {
  ficha: DealerVehicleStatusRow;
  photosAllowed: boolean;
  costsView: boolean;
  /** false mientras la pagina relee el plan: una cache vencida puede decir "sin fotos" y despues "con fotos". */
  accesoListo?: boolean;
}) {
  const vehicleId = ficha.id;
  const tenantId = getAccessClientContext()?.tenantId ?? "";
  const [, userId] = useIdentidadCache();
  // Misma clave que FichaCompra: la fecha de adquisicion la escribe Adquisicion (registrar).
  const days = useQuery({
    queryKey: ["dealer-vehicle-days", tenantId, vehicleId],
    queryFn: () => fetchVehicleDays(vehicleId, tenantId),
    enabled: tenantId.length > 0,
    retry: false,
  });
  // Misma clave y opciones que FichaCompraDetalle; sin `autos.costs.view` no se pide (seria un 403).
  const compra = useQuery({
    queryKey: ["dealer-vehicle-purchase", tenantId, userId, vehicleId],
    queryFn: () => fetchCompra(vehicleId),
    ...SIN_REUTILIZAR,
    enabled: costsView,
    retry: false,
  });
  const fotos = useQuery({
    queryKey: ["vehicle-photos", vehicleId],
    queryFn: () => fetchVehiclePhotos(vehicleId),
    enabled: photosAllowed,
    retry: false,
  });

  // Mientras se lee algo de lo que dependen los pasos, no se cuenta nada: ni "x de y" ni tildes. Un paso marcado
  // pendiente o un total calculado antes de terminar de leer cambia ante los ojos del usuario (Cowork 26-nov: la RAV4
  // paso de "3 de 5" a "5 de 6"). Sin tenant tampoco: la fecha de adquisicion no se puede leer y "compra" saldria
  // pendiente por no haber leido.
  if (!guiaLista({ accesoListo, tenantId, daysPending: days.isPending, costsView, compraPending: compra.isPending, photosAllowed, fotosPending: fotos.isPending })) {
    return (
      <p role="status" data-testid="ciclo-cargando" className="animate-pulse text-sm text-nk-fg-muted">
        Cargando los pasos de este auto…
      </p>
    );
  }

  const pasos = pasosCargaAuto({
    vehicleId,
    make: ficha.make,
    model: ficha.model,
    year: ficha.year,
    status: ficha.status,
    price_amount: ficha.price_amount,
    compraRegistrada: Boolean(days.data?.acquired_at) || Boolean(compra.data),
    fotos: photosAllowed ? (fotos.data?.length ?? 0) : null,
    verCostos: costsView,
  });
  if (!pasos) return null;
  return (
    <div data-testid="ciclo-del-auto">
      <PasosDeTarea titulo="Cargar este auto" pasos={pasos} final="Listo: el auto está cargado y publicado." />
    </div>
  );
}
