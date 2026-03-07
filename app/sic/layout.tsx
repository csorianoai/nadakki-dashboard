"use client";

import { SicBarraInstitucional } from "@/components/sic/SicBarraInstitucional";
import { useTenant } from "@/contexts/TenantContext";

export default function SicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useTenant();
  const primaryColor = settings?.primaryColor ?? "#0ea5e9";

  return (
    <div
      className="min-h-screen bg-[#0a0f1c]"
      style={{ "--sic-primary": primaryColor } as React.CSSProperties}
    >
      <SicBarraInstitucional />
      <main>{children}</main>
    </div>
  );
}
