"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

// El replay no tiene ruta en el backend (404); la pagina se conserva porque
// esta en lib/paginas/manifiesto.json. Pendiente decision de producto.
export default function SicExpedienteReplayPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  return (
    <div className="p-6">
      <h1 className="text-lg font-700 text-zinc-100 m-0 mb-2">Decision Replay</h1>
      <p className="text-zinc-500 text-sm italic">No disponible todavía.</p>
      <Link href={`/sic/expedientes/${id}`} className="mt-4 inline-block text-violet-400 hover:underline text-sm">
        Volver al expediente
      </Link>
    </div>
  );
}
