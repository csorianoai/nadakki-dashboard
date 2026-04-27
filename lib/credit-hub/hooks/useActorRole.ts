"use client";

import { usePortal } from "./usePortal";
import type { CHActorRole } from "../api/client";

export function useActorRole(): { actorRole: CHActorRole | null } {
  const { portal } = usePortal();
  return { actorRole: portal };
}
