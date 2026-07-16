"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VEHICLES_SEED } from "@/lib/vehicles";
import { fmtRD } from "@/lib/format";
import { cuota } from "@/lib/finance";

/** Phase 2 stub — full search UI lands in Fase 3. */
export function AutosVehiculosContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const tipo = searchParams.get("tipo");
  const sample = VEHICLES_SEED[0]!;
  const monthly = Math.round(cuota(sample.price, 20, 60));

  return (
    <div className="mx-auto max-w-[1440px] px-[22px] py-8">
      <div className="mb-6">
        <Link href="/autos" className="text-sm text-nk-fg-muted hover:text-brand">
          ← Volver al inicio
        </Link>
        <h1 className="mt-3 font-manrope text-[clamp(28px,4vw,40px)] font-extrabold text-nk-fg">
          Buscar vehículos
        </h1>
        <p className="mt-1 text-sm text-nk-fg-muted">
          Fase 3 — filtros exhaustivos. {VEHICLES_SEED.length} vehículos seed disponibles.
        </p>
        {(q || tipo) && (
          <p className="mt-2 text-sm text-brand">
            Filtros activos: {[q && `q=${q}`, tipo && `tipo=${tipo}`].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition hover:-translate-y-1 hover:shadow-nk-lg">
          <CardHeader>
            <CardTitle className="font-manrope">
              {sample.year} {sample.make} {sample.model}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-[4/3] rounded-r" style={{ background: sample.grad }} aria-hidden />
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="font-manrope text-lg font-extrabold tabular-nums">{fmtRD(sample.price)}</p>
                <p className="text-sm font-semibold tabular-nums text-brand">
                  {fmtRD(monthly)}/mes · 60 meses · 13.5% APR
                </p>
              </div>
              <Badge variant="brandSoft">{sample.match}% match</Badge>
            </div>
            <Button variant="brand" className="w-full" asChild>
              <Link href={`/autos/vehiculo/${sample.id}`}>Ver detalle</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
