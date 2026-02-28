import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nadakki-ai-suite.onrender.com').replace(/\/$/, '');
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 200, 1), 1000);
  const offset = Math.max(Number(request.nextUrl.searchParams.get('offset')) || 0, 0);
  const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || undefined;

  const url = `${base}/api/ai-studio/agents?limit=${limit}&offset=${offset}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (tenantId) headers['X-Tenant-ID'] = tenantId;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 300 } });
    if (!res.ok) throw new Error('Backend ' + res.status);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { success: false, data: { agents: [], pagination: { total: 0, limit, offset } }, error: String(e) },
      { status: 502 }
    );
  }
}
