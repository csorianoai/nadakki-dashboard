"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtKm } from "@/lib/format";
import type { Vehicle } from "@/lib/vehicles";
import { HistorialAI } from "@/components/vdp/HistorialAI";

const SPECS = (v: Vehicle) => [
  ["Marca", v.make],
  ["Modelo", v.model],
  ["Año", String(v.year)],
  ["Kilometraje", fmtKm(v.km)],
  ["Transmisión", v.trans],
  ["Combustible", v.fuel],
  ["Tipo", v.type],
  ["Condición", v.badge],
  ["Provincia", v.loc],
  ["Vendedor", v.dealerName],
];

export function SpecTabs({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Tabs defaultValue="specs" className="w-full">
      <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-nk-border bg-transparent p-0">
        {[
          { value: "specs", label: "Especificaciones" },
          { value: "history", label: "Historial" },
          { value: "location", label: "Ubicación" },
          { value: "dealer", label: "Dealer" },
        ].map(({ value, label }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:text-brand"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="specs" className="mt-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {SPECS(vehicle).map(([key, val]) => (
            <div key={key} className="flex justify-between gap-4 border-b border-nk-border/60 py-2">
              <dt className="text-sm text-nk-fg-muted">{key}</dt>
              <dd className="text-sm font-semibold text-nk-fg">{val}</dd>
            </div>
          ))}
        </dl>
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <HistorialAI vehicle={vehicle} />
      </TabsContent>

      <TabsContent value="location" className="mt-4">
        <div className="space-y-4">
          <div
            className="flex aspect-[16/7] items-center justify-center rounded-r border border-dashed border-nk-border bg-nk-surface-2 text-sm text-nk-fg-muted"
            aria-hidden
          >
            Mapa — próximamente
          </div>
          <p className="text-sm text-nk-fg">
            <strong>{vehicle.dealerName}</strong>
            <br />
            {vehicle.loc}, República Dominicana
          </p>
        </div>
      </TabsContent>

      <TabsContent value="dealer" className="mt-4">
        <div className="rounded-r border border-nk-border bg-nk-surface p-4 shadow-nk-sm">
          <h3 className="font-manrope text-lg font-bold">{vehicle.dealerName}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-nk-fg-muted">
            <Star className="h-4 w-4 fill-nk-warning text-nk-warning" aria-hidden />
            {vehicle.rating.toFixed(1)} · {vehicle.reviews} reseñas
          </p>
          <p className="mt-2 text-sm text-nk-fg-muted">
            Responde en ~{vehicle.avgResp}
          </p>
          <Button variant="brand" className="mt-4 w-full sm:w-auto">
            Contactar
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
