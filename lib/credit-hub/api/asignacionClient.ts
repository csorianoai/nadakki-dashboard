import { chFetch } from "./client";

/** BANK-V2-03: analistas a los que el administrador del banco puede asignar. */
export type AssignableAnalyst = { user_id: string; email: string; role_key: string };

type Params = { tenantId: string; applicationId: string; analystId: string; lenderCode?: string };

function cuerpo(p: Params): string {
  return JSON.stringify({
    analyst_id: p.analystId,
    ...(p.lenderCode?.trim() ? { lender_code: p.lenderCode.trim() } : {}),
  });
}

export function getAssignableAnalysts(params: { tenantId: string }): Promise<{ analysts: AssignableAnalyst[] }> {
  return chFetch<{ analysts: AssignableAnalyst[] }>("/api/v2/credit/bank/assignable-analysts", {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
  });
}

/** Asignarse una solicitud sin asignar: el claim propio que exige el decide. */
export function claimForMe(params: Params): Promise<unknown> {
  return chFetch<unknown>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/claim`, {
    tenantId: params.tenantId,
    actorRole: "bank_analyst",
    method: "POST",
    body: cuerpo(params),
  });
}

/** El administrador del banco asigna la solicitud a un analista (queda assigned_by). */
export function assignToAnalyst(params: Params): Promise<unknown> {
  return chFetch<unknown>(`/api/v2/credit/applications/${encodeURIComponent(params.applicationId)}/claim/assign`, {
    tenantId: params.tenantId,
    actorRole: "bank_admin",
    method: "POST",
    body: cuerpo(params),
  });
}
