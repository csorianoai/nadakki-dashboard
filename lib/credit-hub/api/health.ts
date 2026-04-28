import { chFetch } from "./client";
import type { CHActorRole } from "./client";
import type { CHHealthResponse } from "../types/_generated";

export async function getHealth(params: {
  tenantId: string;
  actorRole: CHActorRole;
}): Promise<CHHealthResponse> {
  return chFetch<CHHealthResponse>("/api/v1/sic/routeone/health", {
    tenantId: params.tenantId,
    actorRole: params.actorRole,
  });
}
