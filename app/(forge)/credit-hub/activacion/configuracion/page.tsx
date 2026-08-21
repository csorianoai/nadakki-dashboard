import { ConfiguracionView } from "@/components/activation/ConfiguracionView";

export const metadata = {
  title: "Configuración - Nadakki",
  description: "Configuración de institución",
};

export default function ConfiguracionPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración de institución</h1>
        <p className="text-slate-400 mt-2">
          Completa cada bloque por separado. Tu progreso se guarda automáticamente.
        </p>
      </div>

      <ConfiguracionView />
    </div>
  );
}
