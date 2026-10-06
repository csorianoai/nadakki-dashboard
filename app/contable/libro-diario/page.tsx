import Link from "next/link";
import { BookText } from "lucide-react";
import { ContablePageShell } from "@/components/contable/ContablePageShell";

/**
 * /contable/libro-diario no tiene pantalla (auditoria Mapaal QA, P1).
 *
 * Antes la ruta daba 404. No se redirige al libro mayor: es OTRO informe
 * (movimientos por cuenta, no asientos en orden), y mandar ahi sin avisar haria
 * creer que es el diario. El informe del backend (`journal@1.0`,
 * lib/dcc/reportes.ts) hoy devuelve solo cabeceras, sin lineas. Se dice eso y se
 * ofrece lo que si existe.
 */
export default function ContableLibroDiarioPage() {
  return (
    <ContablePageShell
      title="Libro diario"
      description="Los asientos en orden de fecha."
      icon={<BookText className="h-8 w-8" aria-hidden />}
    >
      <section
        role="status"
        data-testid="libro-diario-sin-pantalla"
        className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200"
      >
        <p className="font-semibold text-white">El libro diario todavía no tiene pantalla.</p>
        <p className="mt-1 text-zinc-400">
          Mientras tanto podés ver los movimientos de cada cuenta en el libro mayor, o registrar un asiento nuevo.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/contable/libro-mayor" className="font-semibold text-emerald-200 underline hover:text-white">
            Ir al libro mayor
          </Link>
          <Link href="/contable/asientos/nuevo" className="font-semibold text-emerald-200 underline hover:text-white">
            Registrar un asiento
          </Link>
        </div>
      </section>
    </ContablePageShell>
  );
}
