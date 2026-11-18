"use client";

import Link from "next/link";
import MetricasGoogleAds from "@/components/google-ads/MetricasGoogleAds";

export default function MetricasGoogleAdsPage() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <Link href="/advertising/google-ads" className="text-sm text-blue-600 hover:underline">
          ← Google Ads
        </Link>
        <h1 className="text-3xl font-bold mt-2">Métricas de Google Ads</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Cifras tal como las entrega Google Ads para la cuenta y el rango elegidos.
        </p>
      </div>
      <MetricasGoogleAds />
    </div>
  );
}
