"use client";

import { useSyncExternalStore } from "react";

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
    () => true,
  );
}
