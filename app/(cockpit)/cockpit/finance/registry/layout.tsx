"use client";

import { type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useCockpit } from "@/lib/cockpit/context";

export default function FinanceRegistryLayout({ children }: { children: ReactNode }) {
  const { isPlatformSuperadmin } = useCockpit();

  if (!isPlatformSuperadmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-cockpit-border bg-cockpit-surface p-8 text-center">
        <div>
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-cockpit-err" aria-hidden />
          <h2 className="text-lg font-semibold">Acceso restringido</h2>
          <p className="mt-2 text-sm text-cockpit-muted">
            Solo <strong>platform_superadmin</strong> puede editar el registro.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
