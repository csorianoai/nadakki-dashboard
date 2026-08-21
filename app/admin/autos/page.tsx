"use client";

import { AutosAdminGate } from "@/components/autos/admin/AutosAdminGate";
import { AutosAdminDashboard } from "@/components/autos/admin/AutosAdminDashboard";

export default function AutosAdminPage() {
  return (
    <AutosAdminGate>
      <AutosAdminDashboard />
    </AutosAdminGate>
  );
}
