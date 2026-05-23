"use client";

import Link from "next/link";
import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { ProyectoIntakeWizard } from "@/components/proyectos/ProyectoIntakeWizard";

export default function NuevoProyectoPage() {
  return (
    <ProyectosTenantGate>
      <div className="mx-auto max-w-4xl pb-16">
        <p className="text-forge-sm text-forgeGray-600">
          <Link href="/proyectos" className="text-forgeBrand-600 hover:text-forgeBrand-700">
            ← Panel de proyectos
          </Link>
        </p>
        <header className="mt-4">
          <h1 className="font-display text-forge-xl font-semibold tracking-tight text-forgeGray-900">Nuevo proyecto</h1>
          <p className="mt-2 max-w-2xl text-forge-sm text-forgeGray-600">
            Captura inicial enlazada a <span className="font-forgeMono text-forge-xs">POST /api/v1/proyectos</span> (tenant vía cabecera
            &nbsp;
            <span className="font-forgeMono text-forge-xs">X-Tenant-ID</span>). Ajustar campos al YAML del contrato cuando esté disponible en
            este repo.
          </p>
        </header>

        <div className="mt-8">
          <ProyectoIntakeWizard />
        </div>
      </div>
    </ProyectosTenantGate>
  );
}
