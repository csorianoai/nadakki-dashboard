"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

/**
 * "No encontrado" dentro de la Suite: se pinta en el área principal, con el menú lateral visible (lo pone
 * GlobalForgeAppShell) y con dos salidas. Sustituye a la pantalla vacía de «Core no encontrado».
 */
export function PaginaNoEncontrada({ detalle }: { detalle?: string }) {
  const router = useRouter();
  const volver = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };
  return (
    <div data-testid="pagina-no-encontrada" className="ndk-page flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-violet-500">Error 404</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {detalle ?? "La dirección no existe o ya no está disponible. Usá el menú de la izquierda o buscá con Ctrl+K."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={volver}
            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            <Home className="h-4 w-4" aria-hidden />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
