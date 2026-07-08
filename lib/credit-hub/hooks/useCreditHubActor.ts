"use client";

import { useContext, useMemo } from "react";
import { AuthContext } from "@/lib/auth/auth-context";
import type { CHAction } from "../utils/permissions";
import { actorCan, resolveCHActorRole } from "../auth/portal-access";

/** Session-derived Credit Hub actor + permission helpers (PR FE-SEC-01). */
export function useCreditHubActor() {
  const auth = useContext(AuthContext);
  const roleKey = auth?.activeRole?.role_key ?? null;

  const actor = useMemo(() => resolveCHActorRole(roleKey), [roleKey]);

  return {
    actor,
    roleKey,
    isAuthenticated: Boolean(auth?.user),
    can: (action: CHAction) => actorCan(actor, action),
  };
}
