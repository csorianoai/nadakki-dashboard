import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nadakki — Carga de documento",
  description: "Entrega segura de documentos",
  robots: { index: false, follow: false },
};

export default function MobileCustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="es-DO" className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-md px-4 py-4">
          <p className="text-center text-lg font-semibold tracking-tight text-slate-900">Nadakki</p>
          <p className="mt-1 text-center text-xs text-slate-500">Carga de documento</p>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-md px-4 py-6">
        {children}
      </main>
    </div>
  );
}
