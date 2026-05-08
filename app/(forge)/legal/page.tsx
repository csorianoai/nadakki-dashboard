"use client";

import Link from "next/link";
import LegalHomeContent from "@/components/legal/LegalHomeContent";
import { LegalTaskExecuteProvider } from "@/hooks/useExecuteLegalTask";

export default function LegalForgeHomePage() {
  return (
    <LegalTaskExecuteProvider>
      <nav className="mb-6 flex gap-4 border-b border-forgeInk-200 pb-2" aria-label="Modo Legal">
        <Link
          href="/legal"
          className="border-b-2 border-forgeBrand-600 pb-2 text-sm font-medium text-forgeBrand-700"
        >
          Tareas
        </Link>
        <Link href="/legal/cases" className="pb-2 text-sm font-medium text-forgeInk-500 hover:text-forgeInk-800">
          Expedientes
        </Link>
      </nav>
      <LegalHomeContent />
    </LegalTaskExecuteProvider>
  );
}
