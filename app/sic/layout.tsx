"use client";

import { SicBarraContexto } from "@/components/sic/SicBarraContexto";

export default function SicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      <SicBarraContexto />
      <main>{children}</main>
    </div>
  );
}
