"use client";

import Link from "next/link";
import { ComparePanel } from "@/components/autos/ComparePanel";
import { useCartStore } from "@/components/autos/CartProvider";
import { Button } from "@/components/ui/button";

export default function AutosComparePage() {
  const cart = useCartStore();
  const count = cart.compareCount();

  return (
    <div className="mx-auto max-w-[1100px] px-[22px] py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-manrope text-3xl font-extrabold text-nk-fg">Comparación</h1>
          <p className="mt-1 text-sm text-nk-fg-muted">
            {count > 0 ? `${count} vehículo(s) seleccionados` : "Activa modo comparación desde el carrito"}
          </p>
        </div>
        <Link href="/autos/cart">
          <Button type="button" variant="outline" size="sm">
            Ir al carrito
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <ComparePanel showVehicleList={false} />
      </div>
    </div>
  );
}
