"use client";

import { AdvertisingDashboardLive } from "../components/AdvertisingDashboardLive";

export default function Page() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdvertisingDashboardLive title="LinkedIn Ads — Dashboard API" />
      <h1 className="text-3xl font-bold">LinkedIn Ads</h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Dashboard en vivo vía <code className="text-xs">/api/v1/advertising/dashboard</code>.
      </p>
    </div>
  );
}
