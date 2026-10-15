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
  if (!item.href && item.pronto) {
    // Ruta aprobada sin página todavía: tarjeta sin enlace, para no mandar a un 404.
    return (
      <div aria-disabled="true" data-pronto={item.pronto} data-testid="tarjeta-pagina" data-item={item.id} className={`${CLASES.tarjeta} cursor-default opacity-60`}>
        <span className={CLASES.tarjetaIcono}>
          <Icono aria-hidden className="h-4 w-4" />
        </span>
        <span className={CLASES.tarjetaTitulo}>{item.label}</span>
        <span className={CLASES.insignia}>Pronto</span>
        {item.descripcion ? <span className={CLASES.tarjetaDescripcion}>{item.descripcion}</span> : null}
      </div>
    );
  }
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
