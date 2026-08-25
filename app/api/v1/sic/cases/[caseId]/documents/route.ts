import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl } from "@/lib/config/backend-url";

const BACKEND_URL =
  resolveBackendUrl();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const tenantId =
    req.headers.get("x-resolved-tenant-id") ||
    req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "X-Tenant-ID header required" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const headers: Record<string, string> = { "X-Tenant-ID": tenantId };
    const auth = req.headers.get("Authorization");
    if (auth) headers["Authorization"] = auth;

    const target = `${BACKEND_URL}/api/v1/sic/cases/${encodeURIComponent(caseId)}/documents`;
    const res = await fetch(target, {
      method: "POST",
      headers,
      body: formData,
    });
    const text = await res.text().catch(() => "");
    const contentType = res.headers.get("Content-Type") || "application/json";
    if (contentType.includes("application/json")) {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json ?? {}, { status: res.status });
    }
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
