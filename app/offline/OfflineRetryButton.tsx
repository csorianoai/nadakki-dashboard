"use client";

import { useCallback } from "react";

export function OfflineRetryButton() {
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <button
      onClick={handleRetry}
      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors min-h-[44px] min-w-[44px]"
    >
      Reintentar conexion
    </button>
  );
}
