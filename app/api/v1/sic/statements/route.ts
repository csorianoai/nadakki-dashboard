import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_RENDER_API_URL ||
  "https://nadakki-ai-suite.onrender.com";

export async function POST(req: NextRequest) {
  const tenantId =
    req.headers.get("X-Tenant-ID") ||
    req.headers.get("x-tenant-id") ||
    "credicefi";

  try {
    const formData = await req.formData();
    const headers: Record<string, string> = {
      "X-Tenant-ID": tenantId,
    };
    const auth = req.headers.get("Authorization");
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(`${BACKEND_URL}/api/v1/sic/statements`, {
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
