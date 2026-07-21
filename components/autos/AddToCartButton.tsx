"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/components/autos/CartProvider";
import { useTenant } from "@/components/system/TenantProvider";
import { Button } from "@/components/ui/button";
import { fmtRD } from "@/lib/format";
import { getVehicleImaginUrl } from "@/lib/vehicle-images";
import type { Vehicle } from "@/lib/vehicles";

export function AddToCartButton({
  vehicle,
  vehicleRefId,
  className,
}: {
  vehicle: Vehicle;
  vehicleRefId: string;
  className?: string;
}) {
  const { config } = useTenant();
  const cart = useCartStore();
  const inCart = cart.isInCart(vehicleRefId);
  const tenantId = config.tenantId;

  const handleAdd = () => {
    if (!tenantId) {
      toast.error("Tenant no disponible — recarga la página");
      return;
    }
    const ok = cart.addVehicle({
      vehicle_id: vehicleRefId,
      vehicle_name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      vehicle_price: vehicle.price,
      vehicle_image: getVehicleImaginUrl(vehicle),
      tenant_id: tenantId,
      year: vehicle.year,
      km: vehicle.km,
      fuel: vehicle.fuel,
      trans: vehicle.trans,
      type: vehicle.type,
      features: vehicle.featuresLine,
    });
    if (ok) {
      toast.success("Vehículo agregado al carrito");
    } else {
      toast.error("No se pudo agregar al carrito");
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant={inCart ? "outline" : "brand"}
        className="w-full gap-2 sm:w-auto"
        onClick={handleAdd}
        disabled={!tenantId}
      >
        <ShoppingCart className="h-4 w-4" aria-hidden />
        {inCart ? "En carrito — agregar de nuevo" : "Agregar al carrito"}
      </Button>
      {inCart ? (
        <Link
          href="/autos/cart"
          className="mt-2 inline-block text-sm font-medium text-brand underline"
        >
          Ver carrito ({cart.cartCount()})
        </Link>
      ) : null}
      {!tenantId ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          Carrito no disponible sin tenant activo.
        </p>
      ) : null}
    </div>
  );
}

export function CartVehicleCard({
  vehicleId,
  name,
  price,
  image,
  onRemove,
}: {
  vehicleId: string;
  name: string;
  price: number;
  image: string;
  onRemove: () => void;
}) {
  return (
    <article className="flex gap-4 rounded-r border border-nk-border bg-nk-surface p-3 shadow-nk-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="h-20 w-28 shrink-0 rounded-r-sm object-cover bg-nk-surface-2" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/autos/vehiculo/${encodeURIComponent(vehicleId)}`}
          className="font-semibold text-nk-fg hover:text-brand"
        >
          {name}
        </Link>
        <p className="mt-1 text-sm font-bold tabular-nums text-brand">{fmtRD(price)}</p>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRemove}>
          Quitar
        </Button>
      </div>
    </article>
  );
}
