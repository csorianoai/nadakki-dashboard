"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ComparePanel } from "@/components/autos/ComparePanel";
import { CartVehicleCard } from "@/components/autos/AddToCartButton";
import { useCartStore } from "@/components/autos/CartProvider";
import { Button } from "@/components/ui/button";

export function AutosCartContent() {
  const searchParams = useSearchParams();
  const cart = useCartStore();
  const shareLoadedRef = useRef(false);
  const vehicles = cart.getCart();

  useEffect(() => {
    const token = searchParams.get("share_token")?.trim();
    if (!token || shareLoadedRef.current) return;
    shareLoadedRef.current = true;
    const result = cart.loadFromShareUrl(token);
    if (result.ok) {
      toast.success("Carrito compartido cargado");
    } else {
      toast.error(result.error ?? "No se pudo cargar el carrito compartido");
    }
  }, [cart, searchParams]);

  const handleShareCart = async () => {
    const url = cart.generateShareUrl();
    if (!url) {
      toast.error("Carrito vacío o demasiado grande para compartir");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada al portapapeles");
    } catch {
      toast.message("Enlace del carrito", { description: url });
    }
  };

  const handleRemove = (vehicleId: string) => {
    cart.removeVehicle(vehicleId);
    toast.success("Vehículo removido");
  };

  return (
    <div className="mx-auto max-w-[960px] px-[22px] py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-manrope text-3xl font-extrabold text-nk-fg">Mi carrito</h1>
          <p className="mt-1 text-sm text-nk-fg-muted">
            Lead capture local — sin checkout de pago. Los vehículos se guardan en esta sesión.
          </p>
        </div>
        {vehicles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void handleShareCart()}>
              Compartir carrito
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => cart.clearCart()}>
              Vaciar carrito
            </Button>
          </div>
        ) : null}
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-10 rounded-r border border-dashed border-nk-border bg-nk-surface-2 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-nk-fg">Sin vehículos en carrito</p>
          <p className="mt-2 text-sm text-nk-fg-muted">Explora inventario y agrega vehículos desde la ficha.</p>
          <Link href="/autos/vehiculos" className="mt-4 inline-block">
            <Button type="button" variant="brand">
              Continuar comprando
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {vehicles.map((v) => (
            <CartVehicleCard
              key={v.vehicle_id}
              vehicleId={v.vehicle_id}
              name={v.vehicle_name}
              price={v.vehicle_price}
              image={v.vehicle_image}
              onRemove={() => handleRemove(v.vehicle_id)}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <ComparePanel />
      </div>

      <div className="mt-8">
        <Link href="/autos/vehiculos" className="text-sm font-medium text-brand underline">
          ← Continuar comprando
        </Link>
      </div>
    </div>
  );
}
