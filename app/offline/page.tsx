import type { Metadata } from "next";
import { OfflineRetryButton } from "./OfflineRetryButton";

export const metadata: Metadata = {
  title: "Sin conexion — Nadakki Credit",
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] px-4 text-center">
      <div className="mb-6">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="40" cy="40" r="38" stroke="#334155" strokeWidth="4" />
          <path
            d="M20 55 L60 25"
            stroke="#8b5cf6"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M26 30 Q40 18 54 30"
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M32 38 Q40 28 48 38"
            stroke="#475569"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="40" cy="48" r="4" fill="#475569" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">Sin conexion</h1>
      <p className="text-slate-400 max-w-sm mb-8">
        No se pudo conectar al servidor. Verifica tu conexion a internet e
        intenta de nuevo.
      </p>

      <OfflineRetryButton />

      <p className="text-xs text-slate-600 mt-12">Nadakki Credit</p>
    </main>
  );
}
