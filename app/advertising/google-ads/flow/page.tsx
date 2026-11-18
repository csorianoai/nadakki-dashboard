"use client";

import NavigationBar from "@/components/ui/NavigationBar";
import GoogleAdsExecutionFlow from "@/components/google-ads/GoogleAdsExecutionFlow";

export default function GoogleAdsFlowPage() {
  return (
    <div className="min-h-screen p-6">
      <NavigationBar backHref="/advertising/google-ads" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Google Ads · Flujo de ejecución</h1>
        <p className="text-sm text-slate-500 mt-1">M01–M15 · Flujo guiado con verificación previa automática</p>
      </div>
      <div className="max-w-3xl">
        <GoogleAdsExecutionFlow />
      </div>
    </div>
  );
}
