import { Suspense } from "react";
import GoogleAdsClient from "./GoogleAdsClient";

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
      <GoogleAdsClient />
    </Suspense>
  );
}
