"use client";

import { AdvertisingDashboardLive } from "../components/AdvertisingDashboardLive";

export default function Page() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdvertisingDashboardLive title="Meta Ads — Dashboard API" />
      <h1 className="text-3xl font-bold">Meta Ads</h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Panel conectado al API de advertising. Amplía aquí campañas y creatividades cuando el
        backend exponga rutas específicas.
      </p>
    </div>
  );
}
