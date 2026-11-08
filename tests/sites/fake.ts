/** jsdom no trae Response: doble minimo con lo que usa el cliente (ok, status, text, json). */
export function resp(body: unknown, status = 200, contentType = "application/json"): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => (k.toLowerCase() === "content-type" ? contentType : null) },
    text: async () => text,
    json: async () => JSON.parse(text),
  } as unknown as Response;
}
export const SITE_A = "00000000-0000-4000-8000-0000000000b1";
export const TENANT = "00000000-0000-4000-8000-0000000000a1";
export const siteOk = {
  id: SITE_A, tenant_id: TENANT, vertical: "realestate", name: { es: "SYNTH Realty" }, status: "draft", content_version: 0,
};
