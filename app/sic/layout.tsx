"use client";

import { SicBarraInstitucional } from "@/components/sic/SicBarraInstitucional";
import { useTenant } from "@/contexts/TenantContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { TourGuiadoInstitucional } from "@/components/sic/TourGuiadoInstitucional";

export default function SicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useTenant();
  const primaryColor = settings?.primaryColor ?? "#0ea5e9";

  return (
    <DemoProvider>
      <div
        className="min-h-screen bg-[#0a0f1c]"
        style={{ "--sic-primary": primaryColor } as React.CSSProperties}
      >
        <SicBarraInstitucional />
        <main>{children}</main>
        <TourGuiadoInstitucional />
      </div>
    </DemoProvider>
  );
}
