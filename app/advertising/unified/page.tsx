"use client";

import { AdvertisingDashboardLive } from "../components/AdvertisingDashboardLive";

export default function Page() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdvertisingDashboardLive title="Vista unificada — Dashboard API" />
      <h1 className="text-3xl font-bold">Vista unificada</h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Resumen multi-plataforma desde el mismo endpoint de dashboard.
      </p>
    </div>
  );
}
