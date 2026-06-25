import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await fetch("https://nadakki-ai-suite.onrender.com/health", {
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json();
    return NextResponse.json({ ok: true, backend: data, ts: Date.now() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 200 });
  }
}
