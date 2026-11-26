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

export function CicloDelAuto({ ficha, photosAllowed, costsView }: { ficha: DealerVehicleStatusRow; photosAllowed: boolean; costsView: boolean }) {
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

  // Mientras se lee, no se pinta: un paso marcado pendiente por no haber leido todavia confunde.
  if ((tenantId && days.isPending) || (costsView && compra.isPending) || (photosAllowed && fotos.isPending)) return null;

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
