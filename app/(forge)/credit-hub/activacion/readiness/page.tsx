import { ReadinessView } from "@/components/activation/ReadinessView";
import { ProductionGatesView } from "@/components/activation/ProductionGatesView";

export const metadata = {
  title: "Readiness - Nadakki",
  description: "Estado de configuración y preparación para producción",
};

export default function ReadinessPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Estado de activación</h1>
        <p className="text-slate-400 mt-2">
          Completa todos los requisitos antes de lanzar a producción
        </p>
      </div>

      {/* Readiness scores and dimensions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Readiness</h2>
        <ReadinessView />
      </div>

      {/* Production gates */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Gates de producción</h2>
        <ProductionGatesView />
      </div>
    </div>
  );
}
