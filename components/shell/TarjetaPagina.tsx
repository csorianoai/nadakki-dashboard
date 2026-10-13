"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ItemMenu } from "@/lib/modulos/registro";
import { CLASES } from "./clases";

/**
 * Una página del grupo como tarjeta: icono, nombre en español y una línea de qué hace. Solo lógica y estructura;
 * todo el estilo sale de CLASES.tarjeta* (clases.ts), para reaplicar el diseño sin tocar este archivo.
 */
export function TarjetaPagina({ item, iconoGrupo }: { item: ItemMenu; iconoGrupo?: LucideIcon }) {
  const Icono = item.icono ?? iconoGrupo ?? LayoutGrid;
  return (
    <Link href={item.href} data-testid="tarjeta-pagina" data-item={item.id} className={CLASES.tarjeta}>
      <span className={CLASES.tarjetaIcono}>
        <Icono aria-hidden className="h-4 w-4" />
      </span>
      <span className={CLASES.tarjetaTitulo}>{item.label}</span>
      {item.descripcion ? <span className={CLASES.tarjetaDescripcion}>{item.descripcion}</span> : null}
    </Link>
  );
}
