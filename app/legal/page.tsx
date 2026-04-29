import Link from "next/link";

const cards = [
  { href: "/legal/contracts", titulo: "Contratos", descripcion: "Análisis de cláusulas, riesgo y validación." },
  { href: "/legal/research", titulo: "Consulta legal", descripcion: "Chat conversacional con asistente legal." },
  { href: "/legal/audit", titulo: "Auditoría", descripcion: "Histórico de ejecuciones del sistema." },
  { href: "/legal/config", titulo: "Configuración", descripcion: "Estado del knowledge pack y jurisdicción." },
];

export default function LegalHome() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition"
          >
            <h2 className="text-lg font-medium text-slate-900">{c.titulo}</h2>
            <p className="text-sm text-slate-600 mt-1">{c.descripcion}</p>
          </Link>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Catálogo de agentes legales (vista anterior):{" "}
        <Link href="/legal-agents" className="text-blue-600 hover:underline">
          /legal-agents
        </Link>
      </p>
    </div>
  );
}
