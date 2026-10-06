"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { DccNavGroup } from "./DccShell";

/**
 * Barra lateral marina del shell DCC. Escritorio: en el flujo, 248 px.
 * Movil: panel superpuesto con fondo oscuro detras, que se cierra al elegir
 * destino. Item activo en dorado con filo izquierdo; foco en turquesa.
 */
export function DccShellSidebar({
  firma,
  marca,
  grupos,
  activo,
  abiertoMovil,
  onCerrar,
}: {
  firma: string;
  marca: { nombre: string | null; logoUrl: string | null };
  grupos: DccNavGroup[];
  activo: string | null;
  abiertoMovil: boolean;
  onCerrar: () => void;
}) {
  return (
    <>
      {abiertoMovil ? (
        <button type="button" aria-label="Cerrar menú" onClick={onCerrar} className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" />
      ) : null}
      <aside
        data-testid="dcc-shell-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] max-w-[85vw] shrink-0 flex-col bg-[var(--dcc-navy)] text-[var(--dcc-on-navy)] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          abiertoMovil ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-[var(--dcc-navy-2)] px-4 py-4">
          {marca.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo del tenant, URL externa del branding
            <img src={marca.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-md bg-[var(--dcc-on-navy)] object-contain p-1" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p data-testid="dcc-shell-marca" className="truncate text-[15px] font-semibold">
              {marca.nombre ?? "Institución financiera"}
            </p>
            <p data-testid="dcc-shell-firma" className="truncate text-[11px] text-[var(--dcc-on-navy-muted)]">
              {firma}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onCerrar}
            className="rounded-md p-1 text-[var(--dcc-on-navy-muted)] hover:text-[var(--dcc-on-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-teal)] lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Menú principal" className="flex-1 overflow-y-auto px-3 py-3">
          {grupos.map((grupo) => (
            <div key={grupo.label} className="mb-3">
              <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--dcc-on-navy-muted)]">
                {grupo.label}
              </p>
              <ul className="space-y-0.5">
                {grupo.items.map((item) => {
                  const esActivo = item.id === activo;
                  const Icono = item.icon;
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onCerrar}
                        aria-current={esActivo ? "page" : undefined}
                        className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dcc-teal)] ${
                          esActivo
                            ? "bg-[var(--dcc-navy-2)] font-semibold text-[var(--dcc-gold)] shadow-[inset_3px_0_0_var(--dcc-gold)]"
                            : "font-medium text-[var(--dcc-on-navy-muted)] hover:bg-[var(--dcc-navy-2)] hover:text-[var(--dcc-on-navy)]"
                        }`}
                      >
                        <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
