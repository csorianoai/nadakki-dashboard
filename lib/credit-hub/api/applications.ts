import { chFetch } from "./client";
import type { CHActorRole } from "./client";
import type {
  CHApplication,
  CHCreateApplicationRequest,
} from "../types/_generated";

export function listApplications(params: {
  tenantId: string;
  actorRole: CHActorRole;
}): Promise<CHApplication[]> {
  return chFetch<CHApplication[]>("/api/v1/sic/credit-applications", {
    tenantId: params.tenantId,
    actorRole: params.actorRole,
  });
}

export function getApplication(params: {
  tenantId: string;
  actorRole: CHActorRole;
  applicationId: string;
}): Promise<CHApplication> {
  return chFetch<CHApplication>(
    `/api/v1/sic/credit-applications/${encodeURIComponent(params.applicationId)}`,
    {
      tenantId: params.tenantId,
      actorRole: params.actorRole,
    }
  );
}

export function createApplication(params: {
  tenantId: string;
  actorRole: CHActorRole;
  body: CHCreateApplicationRequest;
  idempotencyKey?: string;
}): Promise<CHApplication> {
  return chFetch<CHApplication>("/api/v1/sic/credit-applications", {
    tenantId: params.tenantId,
    actorRole: params.actorRole,
    method: "POST",
    body: JSON.stringify(params.body),
    idempotencyKey: params.idempotencyKey,
  });
}
