import { ReadinessView } from "@/components/activation/ReadinessView";

export const metadata = {
  title: "Readiness - Nadakki",
  description: "Estado de configuración y preparación para producción",
};

export default function ReadinessPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Estado de activación</h1>
        <p className="text-slate-400 mt-2">
          Completa todos los requisitos antes de lanzar a producción
        </p>
      </div>

      <ReadinessView />
    </div>
  );
}
