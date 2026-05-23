"use client";

import Link from "next/link";
import { ProyectoIntakeWizard } from "@/components/proyectos/ProyectoIntakeWizard";

export default function NuevoProyectoPage() {
  return (
    <div className="mx-auto max-w-4xl pb-16">
      <p className="text-forge-sm text-forgeGray-600">
        <Link href="/proyectos" className="text-forgeBrand-600 hover:text-forgeBrand-700">
          ← Panel de proyectos
        </Link>
      </p>
      <header className="mt-4">
        <h1 className="font-display text-forge-xl font-semibold tracking-tight text-forgeGray-900">Nuevo proyecto</h1>
        <p className="mt-2 max-w-2xl text-forge-sm text-forgeGray-600">
          Captura inicial de alcance antes de ejecutar gates del core. Compatible con paralelismo del backend (
          <code className="font-forgeMono text-forge-xs">POST /api/v1/proyectos</code>
          ).
        </p>
      </header>

      <div className="mt-8">
        <ProyectoIntakeWizard />
      </div>
    </div>
  );
}
