import { Suspense } from "react";
import SocialConnectionsClient from "./SocialConnectionsClient";

function LoadingFallback() {
  return (
    <div className="ndk-page flex items-center justify-center p-20">
      <div className="animate-pulse text-gray-400">Cargando...</div>
    </div>
  );
}

export default function SocialConnectionsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SocialConnectionsClient />
    </Suspense>
  );
}
