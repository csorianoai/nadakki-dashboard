/**
 * Credit pilot API types — subset aligned with Render OpenAPI v5.4.4.
 * Full codegen: `npx openapi-typescript $NEXT_PUBLIC_API_BASE_URL/openapi.json -o lib/api/openapi-schema.ts`
 */
export type paths = {
  "/api/v2/credit/applications/{application_id}/kyc/escalate-review": {
    post: {
      requestBody: { content: { "application/json": { reason: string; notes?: string } } };
      responses: { 200: { content: { "application/json": components["schemas"]["EscalateResponse"] } } };
    };
  };
  "/api/v2/credit/applications/{application_id}/documents/{doc_id}/ocr/escalate-review": {
    post: {
      requestBody: { content: { "application/json": { reason: string; notes?: string } } };
      responses: { 200: { content: { "application/json": components["schemas"]["EscalateResponse"] } } };
    };
  };
  "/api/v2/credit/applications/{application_id}/expediente/full": {
    get: { responses: { 200: { content: { "application/json": Record<string, unknown> } } } };
  };
  "/api/v2/credit/notifications": {
    get: { responses: { 200: { content: { "application/json": Record<string, unknown> } } } };
  };
};

export type components = {
  schemas: {
    EscalateRequest: { reason: string; notes?: string };
    EscalateResponse: {
      escalation_id: string;
      status: string;
      assigned_to?: string | null;
      event_type: string;
      application_id: string;
      created_at: string;
    };
  };
};
