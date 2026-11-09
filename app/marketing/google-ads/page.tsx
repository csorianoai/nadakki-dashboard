import { Suspense } from "react";
import GoogleAdsClient from "./GoogleAdsClient";
import ConectarGoogleAds from "@/components/google-ads/ConectarGoogleAds";

function LoadingFallback() {
  return (
    <div className="ndk-page flex items-center justify-center p-20">
      <div className="animate-pulse text-gray-400">Cargando...</div>
    </div>
  );
}

export default function GoogleAdsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="p-6 max-w-7xl mx-auto"><ConectarGoogleAds /></div>
      <GoogleAdsClient />
    </Suspense>
  );
}
