"use client";

import { Bell } from "lucide-react";
import { EmptyState } from "@/components/forge";

export default function DealerNotificationsPage() {
  return (
    <div className="px-4 pt-6 pb-5 md:px-8 md:pt-8 md:pb-8">
      <h1 className="font-display text-forge-xl font-semibold text-forgeGray-900 mb-6">
        Alertas
      </h1>
      <EmptyState
        titleLevel={2}
        icon={<Bell />}
        title="Sin alertas pendientes"
        description="Las notificaciones de tus solicitudes aparecer&aacute;n aqu&iacute;."
      />
    </div>
  );
}
